#!/usr/bin/env bash
# Richtet einen frischen Debian-Server für Einfallstor ein:
# Updates, Firewall, SSH nur mit Schlüssel, eigener Dienstbenutzer, HTTPS über Caddy.
#
# Aufruf als root:   bash einrichten.sh lernen.example.org
#
# Das Skript lässt sich gefahrlos ein zweites Mal starten.
#
# Stand: Entwurf vom 12.11.2026. Die Syntax ist geprüft, auf einem echten Server
# ist das Skript noch nicht gelaufen. Zuerst in einer Test-VM ausprobieren.

set -euo pipefail

DOMAIN="${1:-}"
REPO="https://github.com/Cyb3rDrunk3n/einfallstor.git"
ZIEL="/opt/einfallstor"

melde() { printf '\n==> %s\n' "$*"; }
abbruch() { printf 'Abbruch: %s\n' "$*" >&2; exit 1; }

# --- Voraussetzungen prüfen ---------------------------------------------------

[[ $EUID -eq 0 ]] || abbruch "Bitte als root ausführen."
[[ -n "$DOMAIN" ]] || abbruch "Aufruf: bash einrichten.sh deine.domain.de"
[[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] || abbruch "Das ist keine gültige Domain: $DOMAIN"

# shellcheck disable=SC1091
. /etc/os-release
[[ "${ID:-}" == "debian" ]] || abbruch "Gedacht für Debian 12 oder 13, gefunden: ${PRETTY_NAME:-unbekannt}"
[[ "${VERSION_ID:-0}" -ge 12 ]] || abbruch "Debian ${VERSION_ID:-?} ist zu alt, nötig ist 12 oder 13."

export DEBIAN_FRONTEND=noninteractive

# --- 1. System aktualisieren und Pakete installieren --------------------------

melde "System aktualisieren"
apt-get update
apt-get -y upgrade

melde "Pakete installieren"
apt-get install -y python3 git ufw unattended-upgrades curl ca-certificates gnupg \
    debian-keyring debian-archive-keyring apt-transport-https

# Caddy kommt aus dem Paketarchiv des Herstellers (https://caddyserver.com/docs/install).
# Das Paket in Debian selbst ist deutlich älter.
SCHLUESSEL=/usr/share/keyrings/caddy-stable-archive-keyring.gpg
QUELLE=/etc/apt/sources.list.d/caddy-stable.list
if [[ ! -s "$SCHLUESSEL" || ! -s "$QUELLE" ]]; then
    # Erst in einen Zwischenordner laden. So bleibt nach einem abgebrochenen
    # Download keine leere Datei zurück, die beim nächsten Lauf als fertig gilt.
    ZWISCHEN="$(mktemp -d)"
    curl -1sLf --retry 3 -o "$ZWISCHEN/gpg.key" 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        || abbruch "Der Schlüssel des Caddy-Archivs ließ sich nicht laden."
    curl -1sLf --retry 3 -o "$ZWISCHEN/caddy.list" 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        || abbruch "Die Quellenangabe des Caddy-Archivs ließ sich nicht laden."
    gpg --dearmor < "$ZWISCHEN/gpg.key" > "$ZWISCHEN/keyring.gpg"
    install -m 0644 "$ZWISCHEN/keyring.gpg" "$SCHLUESSEL"
    install -m 0644 "$ZWISCHEN/caddy.list" "$QUELLE"
    rm -rf "$ZWISCHEN"
    apt-get update
fi
apt-get install -y caddy

# Sicherstellen, dass wirklich die Fassung des Herstellers installiert ist.
CADDY_VERSION="$(dpkg-query -W -f='${Version}' caddy)"
apt-cache madison caddy | awk -v version="$CADDY_VERSION" '$3 == version && /cloudsmith/ { found = 1 } END { exit !found }' \
    || abbruch "Caddy $CADDY_VERSION stammt nicht aus dem Archiv des Herstellers."

# --- 2. Firewall: eingehend nur SSH, HTTP und HTTPS ---------------------------

melde "Firewall einrichten"
SSH_PORT="$(sshd -T 2>/dev/null | awk '$1 == "port" { print $2; exit }')"
SSH_PORT="${SSH_PORT:-22}"
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp comment 'HTTP, leitet auf HTTPS um'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTPS ueber HTTP/3'
ufw --force enable

# --- 3. Sicherheitsupdates automatisch einspielen -----------------------------

melde "Automatische Updates einschalten"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
cat > /etc/apt/apt.conf.d/52einfallstor <<'EOF'
// Auch Caddy aus dem Archiv des Herstellers automatisch aktualisieren.
Unattended-Upgrade::Origins-Pattern {
        "origin=cloudsmith/caddy/stable";
};
// Nach Kernel-Updates nachts selbst neu starten.
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
EOF

# Protokolle enthalten IP-Adressen. Zwei Wochen genügen für die Fehlersuche.
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/einfallstor.conf <<'EOF'
[Journal]
MaxRetentionSec=14day
EOF
systemctl restart systemd-journald

# --- 4. Anwendung holen und als Dienst einrichten ------------------------------

melde "Einfallstor installieren"
id einfallstor &>/dev/null || adduser --system --group --no-create-home einfallstor
if [[ -d "$ZIEL/.git" ]]; then
    git -C "$ZIEL" pull --ff-only
else
    git clone --depth 1 "$REPO" "$ZIEL"
fi
install -m 0644 "$ZIEL/deploy/einfallstor.service" /etc/systemd/system/einfallstor.service
systemctl daemon-reload
systemctl enable einfallstor
systemctl restart einfallstor

# --- 5. Caddy als HTTPS-Proxy ---------------------------------------------------

melde "Caddy einrichten"
[[ -f /etc/caddy/Caddyfile.original ]] || cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.original
sed "s/EINFALLSTOR_DOMAIN/${DOMAIN}/" "$ZIEL/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

# --- 6. SSH: Anmeldung nur noch mit Schlüssel ----------------------------------

melde "SSH absichern"
if [[ -s /root/.ssh/authorized_keys ]] || compgen -G "/home/*/.ssh/authorized_keys" > /dev/null; then
    # Die Datei beginnt mit 00, weil bei sshd der erste Treffer gilt und manche
    # Anbieter eigene Dateien mit höheren Nummern ablegen.
    cat > /etc/ssh/sshd_config.d/00-einfallstor.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
    sshd -t
    systemctl reload ssh
    echo "Anmeldung mit Passwort ist abgeschaltet."
else
    echo "WARNUNG: Kein SSH-Schlüssel hinterlegt. Die Anmeldung mit Passwort bleibt an."
    echo "Schlüssel hinterlegen und das Skript noch einmal starten."
fi

# --- 7. Ergebnis ------------------------------------------------------------------

melde "Prüfen"
sleep 2
systemctl is-active --quiet einfallstor || abbruch "Der Dienst einfallstor läuft nicht. Siehe: journalctl -u einfallstor -n 30"
systemctl is-active --quiet caddy || abbruch "Caddy läuft nicht. Siehe: journalctl -u caddy -n 30"
curl -fsS http://127.0.0.1:1337/api/me > /dev/null || abbruch "Einfallstor antwortet nicht auf 127.0.0.1:1337."

cat <<EOF

Fertig. Einfallstor läuft hinter Caddy.

  Adresse:    https://${DOMAIN}
  Dienste:    systemctl status einfallstor caddy
  Firewall:   ufw status verbose
  Protokoll:  journalctl -u einfallstor -n 50

Das Zertifikat holt Caddy selbst, sobald der DNS-Eintrag von ${DOMAIN}
auf diesen Server zeigt. Öffne jetzt in einem zweiten Fenster eine neue
SSH-Verbindung, bevor du diese schließt.
EOF
