# Einfallstor auf einem eigenen Server betreiben

Gerät: gemieteter Linux-Server (VPS) mit Debian 13 „trixie“  ·  Stand: 12.11.2026  ·  Dauer: etwa 30 Minuten  ·  Risiko: mittel

> **Stand des Pakets:** am 12.11.2026 in einer virtuellen Maschine mit Debian 13.7 getestet, siehe Abschnitt „Getestet“. Noch nicht erprobt ist der Betrieb mit einer echten Domain und einem Zertifikat von Let's Encrypt.

## 1. Was wird geändert und warum

Ein frischer Debian-Server wird so eingerichtet, dass Einfallstor unter einer eigenen Adresse über HTTPS erreichbar ist. Ein Server im Internet wird ab der ersten Minute automatisch nach offenen Diensten und schwachen Passwörtern abgesucht. Das Skript `einrichten.sh` verkleinert deshalb die Angriffsfläche auf das Nötige:

| Maßnahme | Wirkung |
|---|---|
| Firewall (ufw) | Von außen erreichbar sind nur SSH, HTTP und HTTPS. |
| LLMNR abgeschaltet | Der Dienst für Namensauflösung im lokalen Netz lauscht nicht mehr auf Port 5355. |
| SSH nur mit Schlüssel | Die Anmeldung mit Passwort ist abgeschaltet, Passwort-Raten läuft ins Leere. |
| Automatische Updates | Sicherheitsupdates für Debian und Caddy kommen täglich von selbst. |
| Eigener Dienstbenutzer | Einfallstor läuft ohne Administratorrechte. |
| Abschottung durch systemd | Der Dienst darf nur in sein Datenverzeichnis schreiben und sieht keine Home-Verzeichnisse. |
| Caddy als Proxy | Holt und erneuert das TLS-Zertifikat, setzt HSTS, begrenzt die Größe von Anfragen. |
| Anwendung nur auf 127.0.0.1 | Der Python-Server ist von außen nicht direkt erreichbar. |
| Protokolle 14 Tage | Zugriffsprotokolle mit IP-Adressen werden nicht länger aufbewahrt. |

Nebenwirkungen: Ohne hinterlegten SSH-Schlüssel kommst du nach der Umstellung nicht mehr auf den Server, deshalb prüft das Skript vorher, ob ein Schlüssel da ist. Nach Kernel-Updates startet der Server um 04:30 Uhr selbst neu.

## 0. Vorher

- **Server:** Der kleinste Tarif genügt (1 CPU-Kern, 1 bis 2 GB Arbeitsspeicher). Betriebssystem Debian 13, Standort in der EU.
- **SSH-Schlüssel:** Beim Bestellen den öffentlichen Schlüssel hinterlegen. Ein Schlüsselpaar erzeugst du mit `ssh-keygen -t ed25519`.
- **Domain:** Einen A-Eintrag (und, falls vorhanden, einen AAAA-Eintrag) auf die Adresse des Servers setzen. Ohne Domain gibt es kein Zertifikat.
- **Sicherung:** Wenn der Anbieter Snapshots anbietet, vor dem Start einen anlegen.
- **Ist-Zustand festhalten:** `cat /etc/os-release` und `ss -tlnp` zeigen System und offene Ports vor der Einrichtung.

## 2. Schritte

1. Am Server anmelden:

   ```bash
   ssh root@ADRESSE-DES-SERVERS
   ```

2. Git installieren und das Projekt holen:

   ```bash
   apt-get update && apt-get install -y git
   ```

   ```bash
   git clone https://github.com/Cyb3rDrunk3n/einfallstor.git /opt/einfallstor
   ```

3. Die Einrichtung mit deiner Domain starten:

   ```bash
   bash /opt/einfallstor/deploy/einrichten.sh lernen.example.org
   ```

4. Die bestehende SSH-Sitzung offen lassen und in einem zweiten Fenster eine neue Verbindung aufbauen. Erst wenn die klappt, die erste schließen.

## 3. Prüfen

| Prüfung | Erwartetes Ergebnis |
|---|---|
| `systemctl is-active einfallstor caddy` | zweimal `active` |
| `ufw status verbose` | eingehend verboten, erlaubt sind SSH, 80 und 443 |
| `sshd -T \| grep -E 'passwordauthentication\|permitrootlogin'` | `passwordauthentication no`, `permitrootlogin without-password` |
| `ss -tlnp` | Python lauscht nur auf `127.0.0.1:1337`, von außen erreichbar sind allein die Ports 22, 80 und 443 |
| `systemd-analyze security einfallstor` | Bewertung um 1,7 („OK“) |
| elfmal mit falschem Passwort anmelden | zehnmal Statuscode 401, beim elften Mal 429 |
| `https://deine.domain` im Browser | die Startseite, mit gültigem Zertifikat |
| `http://deine.domain` im Browser | Umleitung auf HTTPS |

## 4. Rückweg

1. SSH wieder mit Passwort erlauben: `rm /etc/ssh/sshd_config.d/00-einfallstor.conf && systemctl reload ssh`
2. Firewall abschalten: `ufw disable`
3. Dienst entfernen: `systemctl disable --now einfallstor && rm /etc/systemd/system/einfallstor.service`
4. Caddy zurücksetzen: `cp /etc/caddy/Caddyfile.original /etc/caddy/Caddyfile && systemctl reload caddy`
5. LLMNR wieder einschalten: `rm /etc/systemd/resolved.conf.d/einfallstor.conf && systemctl restart systemd-resolved`
6. Alles auf einmal: den Snapshot zurückspielen oder den Server beim Anbieter neu aufsetzen.

## Getestet

Am 12.11.2026 in einer virtuellen Maschine unter Hyper-V mit dem offiziellen Cloud-Abbild von Debian 13.7 (Kernel 6.12, Python 3.13, Caddy 2.11.9):

- Lauf auf dem frischen System, zweiter und dritter Lauf hintereinander und Fortsetzen nach einem abgebrochenen Lauf: jeweils ohne Fehler.
- Nach einem Neustart sind Firewall, Einfallstor und Caddy von selbst wieder aktiv.
- Von außen sind nur die Ports 22, 80 und 443 erreichbar. Die Anmeldung per SSH mit Passwort wird abgelehnt.
- Über Caddy antwortet die Seite per HTTP/2 mit HSTS, HTTP wird auf HTTPS umgeleitet, zu große Anfragen enden mit 413.
- Das Sitzungs-Cookie trägt hinter Caddy das Kennzeichen `Secure`. Die Begrenzung der Anmeldeversuche zählt die Adresse des Besuchers.
- Der Dienst kann außerhalb von `/var/lib/einfallstor` nicht schreiben und sieht keine Home-Verzeichnisse.
- `unattended-upgrade --dry-run` führt das Archiv von Caddy unter den erlaubten Quellen.

Nicht getestet: ein echtes Zertifikat von Let's Encrypt (im Test stellte Caddy für eine `.internal`-Adresse ein eigenes aus), das Abbild eines bestimmten Anbieters, Debian 12, IPv6 und ein tatsächlich eingespieltes automatisches Update samt Neustart.

## Fehlersuche

- **Das Skript bricht ab:** Die Meldung nennt die Stelle. Nach dem Beheben einfach noch einmal starten, das Skript setzt sauber fort.
- **Downloads brechen ab oder hängen, obwohl das Netz sonst funktioniert:** Läuft der Server als virtuelle Maschine hinter einem VPN-Tunnel, ist oft die Paketgröße schuld. Ein Tunnel überträgt weniger als die üblichen 1500 Byte, und große Antwortpakete gehen dann verloren. `ip link set dev eth0 mtu 1400` behebt das für die laufende Sitzung.

## Betrieb

- **Aktualisieren:** `git -C /opt/einfallstor pull --ff-only && systemctl restart einfallstor`
- **Protokolle lesen:** `journalctl -u einfallstor -n 50` und `journalctl -u caddy -n 50`
- **Datenbank sichern:** Die Konten liegen in `/var/lib/einfallstor/einfallstor.db`. Eine saubere Kopie im laufenden Betrieb erzeugt:

  ```bash
  python3 -c "import sqlite3; q = sqlite3.connect('/var/lib/einfallstor/einfallstor.db'); z = sqlite3.connect('/root/einfallstor-sicherung.db'); q.backup(z)"
  ```

## Was dieses Paket nicht abdeckt

- **Impressum und Datenschutzerklärung:** Wer die Seite in Deutschland öffentlich betreibt, braucht in aller Regel beides. Die Anwendung bringt dafür noch keine Seiten mit. Sie speichert Benutzernamen, Passwort-Hashes und Lernfortschritt und setzt ein technisch nötiges Sitzungs-Cookie.
- **Überwachung:** Niemand wird benachrichtigt, wenn der Dienst ausfällt oder ungewöhnlich viele Anfragen kommen.
- **Sicherungen außer Haus:** Die Datenbank wird nicht automatisch an einen zweiten Ort kopiert.
- **Schutz vor Überlastung:** Gegen eine Flut von Anfragen hilft nur ein vorgeschalteter Dienst des Anbieters.

## Quellen

- Caddy, Installation unter Debian: https://caddyserver.com/docs/install (das Paket in Debian 13 selbst ist Version 2.6.2 und damit deutlich älter)
- Caddy, weitergereichte Kopfzeilen: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- Debian 13 „trixie“, Informationen zur Veröffentlichung: https://www.debian.org/releases/stable/
- Debian-Wiki, UnattendedUpgrades: https://wiki.debian.org/UnattendedUpgrades
- systemd.exec, Abschottung von Diensten: https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html
- BSI, IT-Grundschutz-Kompendium, Bausteine SYS.1.1 Allgemeiner Server, SYS.1.3 Server unter Linux und Unix, APP.3.2 Webserver: https://www.bsi.bund.de/grundschutz

## Protokoll

Halte nach der Einrichtung fest, was du wann geändert hast: Datum, Server, Domain und die Ergebnisse aus Abschnitt 3.
