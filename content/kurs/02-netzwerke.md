---
titel: Netzwerk-Grundlagen
kurz: IP-Adressen, Ports, TCP, DNS und HTTP. Ohne diese Bausteine bleibt jede Scan-Ausgabe ein Rätsel.
icon: netz
---

# IP-Adressen und Netze
minuten: 10
xp: 45

Jedes Gerät in einem Netzwerk braucht eine Adresse, sonst kommen Daten nicht an. Diese Adresse ist die IP-Adresse. In einem Auftrag steht der Scope fast immer als Liste von IP-Adressen oder Adressbereichen. Wer sie nicht lesen kann, weiß nicht, was er testen darf.

## Aufbau einer IPv4-Adresse

Eine IPv4-Adresse besteht aus 32 Bit, geschrieben als vier Zahlen von 0 bis 255 mit Punkten dazwischen:

```
192.168.56.10
```

Jede der vier Zahlen steht für 8 Bit und heißt Oktett. Die Adresse hat zwei Teile: Der vordere bezeichnet das Netz, der hintere das einzelne Gerät darin, den Host. Wo die Grenze liegt, sagt die Subnetzmaske.

## Subnetzmaske und CIDR

Die Schreibweise `192.168.56.0/24` heißt CIDR-Notation. Die Zahl hinter dem Schrägstrich gibt an, wie viele Bit zum Netzanteil gehören. Bei `/24` sind das die ersten drei Oktette, das vierte bleibt für Hosts.

| CIDR | Subnetzmaske | Adressen | nutzbare Hosts |
|---|---|---|---|
| /8 | 255.0.0.0 | 16 777 216 | 16 777 214 |
| /16 | 255.255.0.0 | 65 536 | 65 534 |
| /24 | 255.255.255.0 | 256 | 254 |
| /30 | 255.255.255.252 | 4 | 2 |

Zwei Adressen jedes Netzes sind reserviert: Die erste ist die Netzadresse, die letzte die Broadcast-Adresse, über die alle Geräte im Netz gleichzeitig angesprochen werden. Deshalb hat ein /24-Netz 254 nutzbare Hosts und nicht 256.

> [!PRAXIS] Rechne es nach: Öffne den [Subnetzrechner](#/werkzeuge) und gib `192.168.56.10/24` ein. Ändere dann die Zahl hinter dem Schrägstrich und beobachte, wie sich das Netz verändert.

## Private und öffentliche Adressen

Drei Bereiche sind für private Netze reserviert und werden im Internet nicht weitergeleitet:

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

Dein Heimnetz verwendet fast sicher einen davon. Nach außen tritt dein ganzer Haushalt mit einer einzigen öffentlichen Adresse auf, die der Router vom Internetanbieter bekommt. Der Router übersetzt zwischen innen und außen, das Verfahren heißt NAT (Network Address Translation).

Zwei Sonderfälle begegnen dir ständig. `127.0.0.1` ist die Loopback-Adresse, sie zeigt immer auf den eigenen Rechner und ist auch unter dem Namen `localhost` erreichbar. Das Standard-Gateway ist die Adresse des Routers, an den ein Gerät alles schickt, was nicht im eigenen Netz liegt.

## MAC-Adresse und IPv6 in Kürze

Neben der IP-Adresse hat jede Netzwerkkarte eine MAC-Adresse, eine vom Hersteller vergebene Hardware-Adresse. Sie gilt nur im lokalen Netz. Das Protokoll ARP ordnet dort IP-Adressen den passenden MAC-Adressen zu.

IPv6 ist der Nachfolger von IPv4 und verwendet 128 Bit lange Adressen in hexadezimaler Schreibweise, zum Beispiel `2001:db8::1`. Die Grundidee aus Netzanteil und Hostanteil bleibt dieselbe.

?? Wie viele nutzbare Host-Adressen hat das Netz 192.168.1.0/24?
( ) 256
(x) 254
( ) 24
!! Ein /24-Netz hat 256 Adressen. Netzadresse und Broadcast-Adresse sind reserviert, es bleiben 254.

?? Welche dieser Adressen liegt in einem privaten Adressbereich?
(x) 10.20.30.40
( ) 8.8.8.8
( ) 193.99.144.80
!! 10.0.0.0/8 ist einer der drei privaten Bereiche. Die beiden anderen Adressen sind öffentlich.

?? Im Scope steht 192.168.56.0/24. Gehört 192.168.57.5 dazu?
( ) Ja, die Adresse beginnt mit 192.168.
(x) Nein, bei /24 müssen die ersten drei Oktette übereinstimmen.
( ) Das lässt sich ohne Subnetzmaske nicht sagen.
!! /24 legt die ersten 24 Bit fest, also 192.168.56. Die Adresse 192.168.57.5 liegt in einem anderen Netz und ist damit nicht im Scope.

?? Wohin zeigt die Adresse 127.0.0.1?
( ) Auf den Router
( ) Auf den DNS-Server des Anbieters
(x) Auf den eigenen Rechner
!! 127.0.0.1 ist die Loopback-Adresse, auch localhost genannt.

# Ports, TCP und UDP
minuten: 10
xp: 45

Die IP-Adresse bringt Daten zum richtigen Rechner. Auf diesem Rechner laufen aber viele Programme gleichzeitig: ein Webserver, ein Mailserver, ein Fernzugang. Der Port entscheidet, welches Programm die Daten bekommt.

## Was ein Port ist

Ein Port ist eine Zahl zwischen 0 und 65535. Ein Dienst „lauscht“ auf einem Port, das heißt, er wartet dort auf Verbindungen. Die Kombination aus IP-Adresse und Port bezeichnet einen bestimmten Dienst auf einem bestimmten Rechner, geschrieben als `192.168.56.10:443`.

Viele Dienste haben einen festen Standardport. Die Ports 0–1023 heißen Well-known Ports. Diese Standardports solltest du kennen:

| Port | Protokoll | Dienst |
|---|---|---|
| 21 | TCP | FTP, Dateiübertragung |
| 22 | TCP | SSH, verschlüsselter Fernzugang |
| 25 | TCP | SMTP, Mailversand |
| 53 | UDP und TCP | DNS, Namensauflösung |
| 80 | TCP | HTTP, Web unverschlüsselt |
| 443 | TCP | HTTPS, Web verschlüsselt |
| 445 | TCP | SMB, Windows-Dateifreigaben |
| 3306 | TCP | MySQL-Datenbank |
| 3389 | TCP | RDP, Windows-Fernzugriff |

Eine längere Liste findest du im [Port-Lexikon](#/werkzeuge).

## TCP: mit Verbindungsaufbau

TCP (Transmission Control Protocol) baut vor dem Datenaustausch eine Verbindung auf. Das geschieht in drei Schritten, dem Drei-Wege-Handshake:

1. Der Client schickt ein Paket mit dem Merker SYN: „Ich möchte eine Verbindung.“
2. Der Server antwortet mit SYN-ACK: „Einverstanden, ich höre.“
3. Der Client bestätigt mit ACK. Die Verbindung steht.

TCP nummeriert alle Pakete, bestätigt den Empfang und schickt Verlorenes erneut. Webseiten, E-Mails und Fernzugänge nutzen deshalb TCP.

## UDP: ohne Verbindungsaufbau

UDP (User Datagram Protocol) schickt Pakete einfach los, ohne Handshake und ohne Empfangsbestätigung. Das ist schneller, aber es geht auch mal etwas verloren. DNS-Abfragen, Videotelefonie und Online-Spiele kommen damit gut zurecht.

## Offen, geschlossen, gefiltert

Aus Sicht eines Verbindungsversuchs kann ein TCP-Port drei Zustände haben:

- **Offen:** Ein Dienst lauscht und antwortet mit SYN-ACK.
- **Geschlossen:** Der Rechner ist erreichbar, aber kein Dienst lauscht. Er antwortet mit einem RST-Paket, einer Absage.
- **Gefiltert:** Es kommt gar keine Antwort, weil eine Firewall das Paket verworfen hat.

Eine Firewall ist ein Filter, der anhand von Regeln festlegt, welche Verbindungen durchgelassen werden. Gute Regelwerke verbieten zunächst alles und erlauben dann gezielt, was gebraucht wird.

## Warum das für die Sicherheit zählt

Jeder offene Port ist ein Dienst, und jeder Dienst kann veraltet oder falsch eingestellt sein. Die Summe aller erreichbaren Dienste nennt man Angriffsfläche. Verteidiger verkleinern sie, indem sie abschalten, was niemand braucht. Tester verschaffen sich als Erstes einen Überblick über sie.

> [!ABWEHR] Ein Dienst, der nicht läuft, kann nicht angegriffen werden. Die einfachste Härtungsmaßnahme ist deshalb, unnötige Dienste zu deaktivieren.

?? Auf welchem Port lauscht HTTPS standardmäßig?
( ) 80
( ) 22
(x) 443
!! 443 ist der Standardport für HTTPS. Port 80 gehört zu unverschlüsseltem HTTP, Port 22 zu SSH.

?? In welcher Reihenfolge läuft der Drei-Wege-Handshake von TCP ab?
(x) SYN, SYN-ACK, ACK
( ) ACK, SYN, SYN-ACK
( ) SYN, ACK, FIN
!! Der Client schickt SYN, der Server antwortet mit SYN-ACK, der Client bestätigt mit ACK.

?? Ein Verbindungsversuch auf einen Port bleibt ganz ohne Antwort. Was ist die wahrscheinlichste Erklärung?
( ) Der Port ist offen.
(x) Eine Firewall hat das Paket verworfen, der Port gilt als gefiltert.
( ) Der Port ist geschlossen und hat mit RST geantwortet.
!! Ein offener Port antwortet mit SYN-ACK, ein geschlossener mit RST. Bleibt jede Antwort aus, filtert meist eine Firewall.

?? Welche Aussage über UDP stimmt?
( ) UDP bestätigt jedes Paket und sendet Verlorenes erneut.
( ) UDP wird nur für E-Mails verwendet.
(x) UDP kommt ohne Verbindungsaufbau aus und ist dadurch schnell, aber nicht zuverlässig.
!! UDP verzichtet auf Handshake und Empfangsbestätigung. Zuverlässigkeit bietet TCP.

# DNS und HTTP
minuten: 11
xp: 50

Wenn du eine Webadresse eintippst, laufen zwei Vorgänge nacheinander ab. Zuerst wird der Name in eine IP-Adresse übersetzt, das erledigt DNS. Dann holt der Browser die Seite ab, das erledigt HTTP. Beide Protokolle solltest du lesen können, weil fast jede Prüfung einer Webanwendung damit beginnt.

## DNS: das Telefonbuch des Internets

DNS steht für Domain Name System. Menschen merken sich Namen wie `beispiel.de`, Rechner brauchen IP-Adressen. Ein DNS-Server, der Resolver, beantwortet die Frage „Welche Adresse gehört zu diesem Namen?“.

Im DNS sind verschiedene Eintragstypen hinterlegt:

| Typ | Inhalt |
|---|---|
| A | IPv4-Adresse zu einem Namen |
| AAAA | IPv6-Adresse zu einem Namen |
| CNAME | Verweis auf einen anderen Namen |
| MX | Mailserver der Domain |
| NS | zuständige Nameserver |
| TXT | freier Text, oft für Mail-Absicherung und Nachweise |

DNS-Einträge sind öffentlich abrufbar. Sie verraten deshalb einiges über den Aufbau einer Organisation: welche Mailserver sie nutzt, welche Subdomains es gibt, bei welchem Anbieter die Systeme stehen.

## HTTP: Anfrage und Antwort

HTTP (Hypertext Transfer Protocol) ist ein einfaches Frage-Antwort-Spiel in Textform. Der Browser schickt eine Anfrage:

```
GET /kurs/index.html HTTP/1.1
Host: beispiel.de
User-Agent: Mozilla/5.0
Cookie: sid=abc123
```

Die erste Zeile enthält die Methode (`GET`), den Pfad und die Protokollversion. Darunter folgen Kopfzeilen, die Header. Der Server antwortet:

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: sid=abc123; HttpOnly; Secure

<!doctype html> ...
```

Die Antwort beginnt mit einem Statuscode, danach kommen wieder Header und schließlich der Inhalt.

## Methoden und Statuscodes

Die Methode sagt, was der Client will:

| Methode | Bedeutung |
|---|---|
| GET | etwas abrufen |
| POST | Daten an den Server schicken, zum Beispiel ein Formular |
| PUT | etwas anlegen oder ersetzen |
| DELETE | etwas löschen |

Der Statuscode sagt, wie es ausgegangen ist. Die erste Ziffer gibt die Klasse an:

| Bereich | Bedeutung | Beispiele |
|---|---|---|
| 2xx | Erfolg | 200 OK |
| 3xx | Umleitung | 301 dauerhaft verschoben, 302 vorübergehend |
| 4xx | Fehler beim Client | 401 nicht angemeldet, 403 verboten, 404 nicht gefunden |
| 5xx | Fehler beim Server | 500 interner Fehler |

Der Unterschied zwischen 401 und 403 ist für Prüfer aufschlussreich: 401 heißt „Ich weiß nicht, wer du bist“, 403 heißt „Ich weiß, wer du bist, und du darfst das nicht“.

## Zustandslos, deshalb Cookies

HTTP merkt sich nichts. Jede Anfrage steht für sich, der Server weiß von sich aus nicht, dass du dich eben angemeldet hast. Die Lösung sind Cookies: Der Server gibt dem Browser mit `Set-Cookie` eine Kennung mit, und der Browser schickt sie bei jeder weiteren Anfrage zurück. Diese Sitzungskennung ist so wertvoll wie ein Passwort. Wer sie kennt, ist für den Server der angemeldete Benutzer.

## HTTPS

HTTPS ist HTTP, verpackt in eine verschlüsselte Verbindung mit dem Protokoll TLS. Es leistet dreierlei: Mitlesende sehen den Inhalt nicht, niemand kann ihn unbemerkt verändern, und ein Zertifikat belegt, dass du wirklich mit dem richtigen Server sprichst.

> [!PRAXIS] Sieh dir echte Anfragen an: Drücke in deinem Browser F12, öffne den Reiter „Netzwerk“ und lade diese Seite neu. Du siehst jede Anfrage mit Methode, Statuscode und Headern. Das ist erlaubt, es ist dein eigener Datenverkehr.

?? Welche Aufgabe hat DNS?
(x) Namen wie beispiel.de in IP-Adressen übersetzen
( ) Webseiten verschlüsseln
( ) Ports öffnen und schließen
!! DNS ist die Namensauflösung. Verschlüsselung leistet TLS, Ports regelt die Firewall.

?? Was bedeutet der Statuscode 403?
( ) Die Seite wurde nicht gefunden.
( ) Der Server hat einen internen Fehler.
(x) Der Zugriff ist verboten, auch wenn der Server weiß, wer anfragt.
!! 403 heißt „verboten“. Nicht gefunden wäre 404, ein interner Fehler 500.

?? Warum braucht eine Webanwendung Cookies für die Anmeldung?
( ) Weil Cookies die Verbindung verschlüsseln
(x) Weil HTTP zustandslos ist und der Server den Benutzer sonst bei jeder Anfrage vergessen hätte
( ) Weil Browser ohne Cookies keine Seiten anzeigen
!! HTTP merkt sich nichts zwischen zwei Anfragen. Die Sitzungskennung im Cookie stellt den Zusammenhang her.

?? Welcher DNS-Eintragstyp nennt die Mailserver einer Domain?
( ) A
(x) MX
( ) CNAME
!! MX steht für Mail Exchange. A-Einträge enthalten IPv4-Adressen, CNAME verweist auf einen anderen Namen.
