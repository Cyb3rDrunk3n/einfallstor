# Einfallstor auf einem eigenen Server betreiben

Gerät: gemieteter Linux-Server (VPS) mit Debian 13 „trixie“  ·  Stand: 12.11.2026  ·  Dauer: etwa 30 Minuten  ·  Risiko: mittel

> **Stand des Pakets: Entwurf.** Skript, Dienstdatei und Caddy-Konfiguration sind auf Syntax geprüft, auf einem echten Server aber noch nicht gelaufen. Probiere die Einrichtung zuerst in einer Test-VM aus.

## 1. Was wird geändert und warum

Ein frischer Debian-Server wird so eingerichtet, dass Einfallstor unter einer eigenen Adresse über HTTPS erreichbar ist. Ein Server im Internet wird ab der ersten Minute automatisch nach offenen Diensten und schwachen Passwörtern abgesucht. Das Skript `einrichten.sh` verkleinert deshalb die Angriffsfläche auf das Nötige:

| Maßnahme | Wirkung |
|---|---|
| Firewall (ufw) | Von außen erreichbar sind nur SSH, HTTP und HTTPS. |
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
| `ss -tlnp` | Python lauscht nur auf `127.0.0.1:1337` |
| `systemd-analyze security einfallstor` | Bewertung im grünen Bereich |
| `https://deine.domain` im Browser | die Startseite, mit gültigem Zertifikat |
| `http://deine.domain` im Browser | Umleitung auf HTTPS |

## 4. Rückweg

1. SSH wieder mit Passwort erlauben: `rm /etc/ssh/sshd_config.d/00-einfallstor.conf && systemctl reload ssh`
2. Firewall abschalten: `ufw disable`
3. Dienst entfernen: `systemctl disable --now einfallstor && rm /etc/systemd/system/einfallstor.service`
4. Caddy zurücksetzen: `cp /etc/caddy/Caddyfile.original /etc/caddy/Caddyfile && systemctl reload caddy`
5. Alles auf einmal: den Snapshot zurückspielen oder den Server beim Anbieter neu aufsetzen.

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
