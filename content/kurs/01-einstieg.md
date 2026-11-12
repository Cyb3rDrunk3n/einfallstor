---
titel: Einstieg und Recht
kurz: Was ein Penetrationstest ist, was das Gesetz dazu sagt und wie du dir ein legales Übungslabor baust.
icon: kompass
---

# Was ist ein Penetrationstest?
minuten: 8
xp: 40

Ein Penetrationstest, kurz Pentest, ist ein beauftragter Angriff auf IT-Systeme. Eine Firma bezahlt Fachleute dafür, ihre Server, Netze oder Anwendungen so zu untersuchen, wie es ein echter Angreifer tun würde. Der Unterschied liegt im Auftrag: Der Tester hat eine schriftliche Erlaubnis, hält sich an vereinbarte Grenzen und liefert am Ende einen Bericht statt eines Schadens.

Das Ziel ist schlicht. Schwachstellen sollen gefunden und geschlossen werden, bevor jemand sie ausnutzt, der keine guten Absichten hat.

## Abgrenzung zu ähnlichen Begriffen

Vier Begriffe werden oft verwechselt:

| Begriff | Was passiert | Ergebnis |
|---|---|---|
| Schwachstellenscan | Ein Programm prüft Systeme automatisch gegen eine Liste bekannter Lücken. | Liste möglicher Probleme, ungeprüft |
| Penetrationstest | Menschen prüfen mit Werkzeugen und Handarbeit, welche Lücken sich wirklich ausnutzen lassen. | Bericht mit belegten Befunden |
| Red Teaming | Ein Team verfolgt über Wochen ein konkretes Ziel und testet dabei auch, ob die Verteidigung den Angriff bemerkt. | Aussage über Erkennung und Reaktion |
| Bug Bounty | Ein Unternehmen lädt öffentlich dazu ein, Lücken nach festen Regeln zu melden, und zahlt Prämien. | Einzelne gemeldete Lücken |

Ein Scan sagt: „Hier könnte etwas sein.“ Ein Pentest sagt: „Hier ist etwas, so haben wir es nachgewiesen, und so behebt ihr es.“

## Black Box, Grey Box, White Box

Wie viel der Tester vorab weiß, wird vor dem Test festgelegt:

- **Black Box:** Der Tester kennt nur den Namen oder die Adresse des Ziels. Das entspricht einem Angreifer von außen.
- **Grey Box:** Er bekommt Teilwissen, zum Beispiel ein normales Benutzerkonto.
- **White Box:** Er erhält volle Einsicht, etwa Quellcode, Netzpläne und Administratorzugänge.

Mehr Wissen bedeutet meistens mehr Befunde in weniger Zeit. Black Box klingt realistisch, verbraucht aber viel bezahlte Zeit für Dinge, die der Auftraggeber in fünf Minuten hätte sagen können.

## Was du dafür können musst

Pentesting ist kein einzelnes Werkzeug, das man startet. Es setzt sich aus Grundlagen zusammen: Du musst verstehen, wie Netzwerke Daten transportieren, wie Betriebssysteme Rechte vergeben und wie Webanwendungen aufgebaut sind. Dazu kommt etwas, das Anfänger oft unterschätzen: sauberes Dokumentieren. Ein Befund, den der Kunde nicht nachvollziehen kann, ist für ihn wertlos.

In dieser Reihenfolge geht der Kurs vor. Erst Recht und Labor, dann Netzwerke und Linux, danach Methodik, Web-Sicherheit, Passwörter, Schwachstellen und am Ende der Bericht.

> [!MERKE] Ein Pentest ohne Auftrag ist kein Pentest, sondern eine Straftat. Die nächste Lektion erklärt, warum.

?? Was unterscheidet einen Penetrationstest von einem Schwachstellenscan?
( ) Ein Pentest läuft vollautomatisch, ein Scan wird von Hand gemacht.
(x) Beim Pentest wird geprüft und belegt, ob sich Lücken tatsächlich ausnutzen lassen.
( ) Ein Scan braucht eine Erlaubnis, ein Pentest nicht.
!! Der Scan liefert eine ungeprüfte Liste möglicher Probleme. Im Pentest wird nachgewiesen, was davon wirklich ausnutzbar ist. Eine Erlaubnis braucht beides.

?? Bei welchem Vorgehen bekommt der Tester vorab Quellcode und Netzpläne?
( ) Black Box
( ) Grey Box
(x) White Box
!! White Box bedeutet volle Einsicht. Bei Black Box kennt der Tester nur das Ziel, bei Grey Box hat er Teilwissen.

?? Was liefert ein Pentester am Ende seiner Arbeit ab?
(x) Einen Bericht mit belegten Befunden und Empfehlungen
( ) Eine Liste der gefundenen Passwörter zur freien Verwendung
( ) Nichts, die Arbeit endet mit dem letzten Test
!! Der Bericht ist das Produkt. Er beschreibt, was gefunden wurde, wie es belegt ist und wie man es behebt.

# Recht und Ethik: erst die Erlaubnis
minuten: 10
xp: 50

Dieselbe Handlung kann ein bezahlter Auftrag oder eine Straftat sein. Den Unterschied macht allein die Einwilligung dessen, dem das System gehört. Diese Lektion zeigt die wichtigsten Regeln für Deutschland. Sie ersetzt keine Rechtsberatung, sie soll dir aber klarmachen, wo die Grenze verläuft.

## Was das Strafgesetzbuch sagt

Mehrere Paragrafen des Strafgesetzbuchs (StGB) betreffen das Eindringen in fremde Systeme:

| Paragraf | Überschrift | Worum es geht |
|---|---|---|
| § 202a | Ausspähen von Daten | sich unbefugt Zugang zu Daten verschaffen, die gegen Zugriff besonders gesichert sind |
| § 202b | Abfangen von Daten | Daten aus einer nichtöffentlichen Übertragung unbefugt abfangen |
| § 202c | Vorbereiten des Ausspähens und Abfangens von Daten | Passwörter oder Programme für solche Taten herstellen, beschaffen oder verbreiten |
| § 303a | Datenveränderung | Daten rechtswidrig löschen, unterdrücken, unbrauchbar machen oder verändern |
| § 303b | Computersabotage | eine Datenverarbeitung von wesentlicher Bedeutung erheblich stören |

Auf das Ausspähen von Daten nach § 202a stehen bis zu drei Jahre Freiheitsstrafe oder Geldstrafe. Es kommt auf das Wort „unbefugt“ an: Wer mit Einwilligung des Berechtigten handelt, handelt nicht unbefugt.

§ 202c wird oft Hackerparagraf genannt, weil er schon die Vorbereitung unter Strafe stellt. Sicherheitswerkzeuge, die auch Administratoren und Tester für erlaubte Prüfungen nutzen, fallen nach einer Entscheidung des Bundesverfassungsgerichts von 2009 nicht allein wegen ihrer Eignung darunter. Den Ausschlag gibt der Zweck, zu dem ein Programm bestimmt ist und eingesetzt wird.

## Was eine Beauftragung regeln muss

Bevor ein Test beginnt, wird schriftlich festgehalten:

- **Wer erlaubt den Test?** Die Einwilligung muss von jemandem kommen, der über die Systeme verfügen darf. Bei gemieteten Servern oder Cloud-Diensten gelten zusätzlich die Regeln des Anbieters.
- **Was ist im Scope?** Scope heißt Geltungsbereich: die genaue Liste der Adressen, Domains und Anwendungen, die getestet werden dürfen. Alles andere ist tabu.
- **Wann wird getestet?** Zeitfenster verhindern, dass ein Test mitten im Monatsabschluss die Buchhaltung lahmlegt.
- **Welche Methoden sind erlaubt?** Angriffe auf die Verfügbarkeit oder das Täuschen von Mitarbeitern sind nur zulässig, wenn sie ausdrücklich vereinbart wurden.
- **Wer ist erreichbar?** Beide Seiten nennen Ansprechpartner für den Notfall.
- **Was passiert mit Daten?** Tester sehen oft vertrauliche oder personenbezogene Daten. Vertraulichkeit, Aufbewahrung und Löschung gehören in den Vertrag.

Diese Vereinbarung heißt im Berufsalltag oft „Rules of Engagement“.

## Gute Absicht schützt nicht

Der Vorsatz, eine Lücke nur melden zu wollen, ändert an der Rechtslage nichts. Wer ohne Erlaubnis eine Zugangssicherung überwindet, erfüllt den Tatbestand, egal aus welchem Motiv.

Einen geregelten Weg gibt es trotzdem. Manche Organisationen veröffentlichen, unter welchen Bedingungen sie Sicherheitsmeldungen von außen annehmen. Das Verfahren heißt Coordinated Vulnerability Disclosure. Die Bedingungen stehen oft in einer Datei namens `security.txt` oder in den Regeln eines Bug-Bounty-Programms. Wer sie genau einhält, bleibt in dem Rahmen, den die Organisation selbst gesetzt hat.

## Der Kodex dieses Kurses

1. Ich teste nur Systeme, die mir gehören oder für die ich eine schriftliche Erlaubnis habe.
2. Ich bleibe im vereinbarten Scope.
3. Ich richte keinen vermeidbaren Schaden an und breche ab, wenn ein System instabil wird.
4. Ich behandle alles vertraulich, was ich bei einem Test sehe.
5. Ich melde Funde dem Auftraggeber und nutze sie nicht für eigene Zwecke.

> [!RECHT] Im Zweifel gilt: nicht anfassen. Für das Üben gibt es genug legale Ziele, die nächste Lektion stellt sie vor.

?? Was macht aus einem Angriff auf ein IT-System einen legalen Penetrationstest?
(x) Die Einwilligung des Berechtigten, am besten schriftlich und mit klarem Scope
( ) Die Absicht, gefundene Lücken später zu melden
( ) Die Verwendung frei erhältlicher Werkzeuge
!! Nur die Einwilligung dessen, der über das System verfügen darf, nimmt dem Handeln das „unbefugt“. Gute Absichten oder legale Werkzeuge ändern daran nichts.

?? Was bedeutet „Scope“ in einer Beauftragung?
( ) Die Dauer des Tests in Stunden
( ) Das Honorar des Testers
(x) Die genaue Liste der Systeme, die getestet werden dürfen
!! Der Scope ist der Geltungsbereich. Was nicht darin steht, wird nicht getestet.

?? Welcher Paragraf des StGB stellt das unbefugte Verschaffen von Zugang zu besonders gesicherten Daten unter Strafe?
( ) § 303b, Computersabotage
(x) § 202a, Ausspähen von Daten
( ) § 263, Betrug
!! § 202a StGB heißt „Ausspähen von Daten“. § 303b betrifft das Stören von Datenverarbeitung, § 263 regelt den Betrug.

?? Du entdeckst zufällig eine Schwachstelle auf einer fremden Website. Was ist der richtige Weg?
( ) Erst tiefer eindringen, um die Lücke sicher zu belegen
( ) Die Lücke in einem Forum veröffentlichen
(x) Nicht weiter testen und prüfen, ob der Betreiber einen Meldeweg nennt, zum Beispiel in einer security.txt
!! Weitertesten ohne Erlaubnis kann strafbar sein. Viele Betreiber nennen einen Meldeweg für Sicherheitshinweise.

# Dein legales Übungslabor
minuten: 9
xp: 40

Üben darfst du überall dort, wo du der Berechtigte bist oder wo der Betreiber das Üben ausdrücklich anbietet. Das klingt nach einer Einschränkung, reicht aber für Jahre.

## Drei Wege zum Üben

1. Diese Plattform: Das [Übungsterminal](#/terminal) simuliert eine Linux-Shell im Browser. Dahinter steckt kein echtes Netz, du kannst nichts beschädigen.
2. Ein eigenes Labor aus virtuellen Maschinen: Eine virtuelle Maschine (VM) ist ein kompletter Rechner, der als Programm auf deinem PC läuft. Die Software dafür heißt Hypervisor, bekannte Vertreter sind VirtualBox, VMware Workstation und Hyper-V. In einem Labor laufen meist eine Arbeitsmaschine mit Linux und eine oder mehrere Übungsmaschinen, die absichtlich Schwächen enthalten und für Schulungen gebaut wurden.
3. Lernplattformen im Netz: Anbieter wie TryHackMe, Hack The Box Academy, die Web Security Academy von PortSwigger oder OverTheWire stellen Übungsumgebungen bereit, in denen du nach ihren Regeln arbeiten darfst. Für Einsteiger eignen sich geführte Lernpfade am besten.

## Das Labor richtig abschotten

Übungsmaschinen mit absichtlichen Schwächen gehören nicht ins Heimnetz und schon gar nicht ins Internet. Hypervisoren kennen dafür verschiedene Netzwerkmodi:

| Modus | Die VM erreicht | Geeignet für |
|---|---|---|
| NAT | das Internet über deinen PC, ist von außen aber nicht erreichbar | Arbeitsmaschine, Updates |
| Host-only oder internes Netz | nur andere VMs und je nach Modus deinen PC | verwundbare Übungsmaschinen |
| Netzwerkbrücke (Bridge) | dein ganzes Heimnetz wie ein normales Gerät | Übungsmaschinen: nie |

Weitere Regeln:

- Lege vor jeder Übung einen Snapshot an (bei Hyper-V heißt das Prüfpunkt). Damit setzt du die VM in Sekunden auf einen sauberen Stand zurück.
- Verwende im Labor keine echten Passwörter und keine echten Daten.
- Schalte Übungsmaschinen aus, wenn du fertig bist.
- Halte den Hypervisor und deine Arbeitsmaschine aktuell.

## Was dein Rechner können sollte

Für zwei gleichzeitig laufende VMs sind 16 GB Arbeitsspeicher angenehm, mit 8 GB geht es bei sparsamer Einstellung. Wichtiger als Leistung ist freier Plattenplatz: Rechne mit 20 bis 40 GB pro VM. Die Virtualisierungsfunktion des Prozessors muss im BIOS oder UEFI eingeschaltet sein, bei den meisten Geräten ist sie das ab Werk.

## Führe ein Laborbuch

Schreibe von Anfang an mit: Was hast du getan, was kam heraus, was hast du nicht verstanden? Eine einfache Textdatei mit Datum reicht. Später im Beruf ist diese Gewohnheit die Grundlage jedes Berichts.

> [!TIPP] Du brauchst für diesen Kurs noch kein Labor. Alle Lektionen funktionieren mit dem eingebauten Übungsterminal. Baue das Labor auf, wenn du die Grundlagen-Module hinter dir hast.

?? In welchem Netzwerkmodus sollte eine absichtlich verwundbare Übungsmaschine laufen?
( ) Netzwerkbrücke, damit sie im ganzen Heimnetz erreichbar ist
(x) Host-only oder internes Netz, abgeschottet vom Heimnetz und vom Internet
( ) Egal, solange ein Virenscanner installiert ist
!! Verwundbare Maschinen dürfen nur für dich erreichbar sein. Eine Netzwerkbrücke stellt sie wie ein normales Gerät ins Heimnetz.

?? Wozu dient ein Snapshot (Prüfpunkt) einer virtuellen Maschine?
(x) Er speichert den Zustand, sodass du die VM später darauf zurücksetzen kannst.
( ) Er verschlüsselt die Festplatte der VM.
( ) Er beschleunigt die VM.
!! Ein Snapshot hält den aktuellen Zustand fest. Nach einer Übung setzt du die Maschine damit auf den sauberen Stand zurück.

?? Welches Ziel darfst du ohne weitere Rückfrage zum Üben verwenden?
( ) Die Website deines Arbeitgebers, weil du dort angestellt bist
( ) Den Router der Nachbarn, wenn das WLAN offen ist
(x) Eine eigene virtuelle Maschine in deinem abgeschotteten Labor
!! Ein Arbeitsverhältnis ist keine Erlaubnis zum Testen, ein offenes WLAN auch nicht. Dein eigenes Labor gehört dir.
