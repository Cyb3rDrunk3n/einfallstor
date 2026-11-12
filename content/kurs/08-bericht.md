---
titel: Bericht und Ausblick
kurz: Wie aus Befunden ein brauchbarer Bericht wird und wie du nach diesem Kurs weiterlernst.
icon: file
---

# Der Bericht: dein eigentliches Produkt
minuten: 10
xp: 50

Der Auftraggeber sieht von wochenlanger Arbeit nur eines: den Bericht. Ein technisch starker Test mit einem schlechten Bericht ist für ihn ein schlechter Test. Der Bericht ist deshalb keine lästige Pflicht am Ende. Er ist die Leistung, für die bezahlt wird.

## Zwei Leserkreise

Ein Bericht hat mindestens zwei Arten von Lesern. Die Geschäftsleitung will auf einer Seite wissen, wie es um die Sicherheit steht und was zu tun ist. Die Administratoren wollen genau wissen, was wo gefunden wurde und wie sie es beheben. Der Aufbau bedient beide:

| Abschnitt | Inhalt | Leser |
|---|---|---|
| Management Summary | Gesamtbild in verständlicher Sprache, größte Risiken, wichtigste Maßnahmen | Leitung |
| Auftrag und Vorgehen | Scope, Zeitraum, Methode, Einschränkungen | alle |
| Befunde | jede Schwachstelle einzeln, nach Schweregrad sortiert | Technik |
| Anhang | Werkzeuge, Protokolle, Rohdaten | Technik |

## Aufbau eines Befunds

Jeder Befund folgt demselben Schema. Ein Beispiel:

| Feld | Inhalt |
|---|---|
| Titel | Administrationsoberfläche aus dem Internet erreichbar |
| Betroffen | verwaltung.beispiel.de, Port 8443 |
| Schweregrad | hoch |
| Beschreibung | Die Anmeldeseite der Verwaltungsoberfläche ist ohne Einschränkung aus dem Internet aufrufbar. Anmeldeversuche werden nicht begrenzt. |
| Nachweis | Aufruf am 03.11. um 10:42 Uhr von der Testadresse, Bildschirmfoto im Anhang |
| Risiko | Zugangsdaten lassen sich beliebig oft durchprobieren. Ein Erfolg würde volle Kontrolle über die Anwendung bedeuten. |
| Empfehlung | Zugriff auf das interne Netz oder ein VPN beschränken, Anmeldeversuche begrenzen, Zwei-Faktor-Anmeldung einführen |

## Was einen guten Befund ausmacht

- **Nachvollziehbar:** Ein Administrator kann den Befund mit den Angaben selbst nachstellen.
- **Belegt:** Bildschirmfotos und Zeitangaben zeigen, dass die Schwäche wirklich besteht.
- **Bewertet:** Der Schweregrad ist begründet und berücksichtigt die Lage des Kunden.
- **Lösbar:** Die Empfehlung ist konkret. „Sicherheit verbessern“ hilft niemandem.
- **Sachlich:** Der Bericht beschreibt Zustände und sucht keine Schuldigen.

## Umgang mit sensiblen Inhalten

Ein Pentest-Bericht beschreibt die Schwächen des Kunden im Detail und muss entsprechend geschützt werden. Passwörter und personenbezogene Daten werden im Bericht geschwärzt. Die Übergabe erfolgt verschlüsselt. Wie lange der Tester seine Unterlagen aufbewahrt und wann er sie löscht, regelt der Vertrag.

## Nach dem Bericht

Üblich ist ein Abschlussgespräch, in dem der Tester die Ergebnisse vorstellt und Fragen beantwortet. Hat der Kunde die Schwachstellen behoben, folgt oft ein Nachtest: Der Tester prüft gezielt, ob die Maßnahmen wirken.

> [!TIPP] Übe das Berichten ab sofort. Schreibe zu jeder Mission im Übungsterminal drei Sätze: Was war die Aufgabe, wie hast du sie gelöst, was hast du daraus gelernt?

?? Für wen ist die Management Summary geschrieben?
( ) Für die Administratoren, die die Lücken beheben
(x) Für die Leitung, die das Gesamtbild und die wichtigsten Maßnahmen verstehen muss
( ) Für andere Pentester
!! Die Zusammenfassung erklärt die Lage ohne technische Einzelheiten. Die Details stehen in den Befunden.

?? Welche Empfehlung in einem Befund ist brauchbar?
( ) Die Sicherheit sollte verbessert werden.
( ) Das System ist unsicher.
(x) Zugriff auf die Verwaltungsoberfläche auf das interne Netz beschränken und Anmeldeversuche begrenzen.
!! Eine gute Empfehlung nennt konkrete Schritte, die jemand umsetzen kann.

?? Warum gehört zu jedem Befund ein Nachweis mit Zeitangabe?
(x) Damit der Kunde den Befund nachvollziehen und in seinen Protokollen wiederfinden kann
( ) Damit der Bericht länger wird
( ) Weil Bildschirmfotos gesetzlich vorgeschrieben sind
!! Der Nachweis belegt, dass die Schwäche wirklich besteht. Die Zeitangabe hilft, den Test in den Protokollen des Kunden zuzuordnen.

?? Was ist ein Nachtest?
( ) Ein zweiter vollständiger Pentest durch eine andere Firma
( ) Die Prüfung des Berichts auf Rechtschreibfehler
(x) Eine gezielte Prüfung, ob die behobenen Schwachstellen wirklich geschlossen sind
!! Im Nachtest wird kontrolliert, ob die Maßnahmen des Kunden wirken.

# Wie es weitergeht
minuten: 8
xp: 40

Du kennst jetzt die Grundlagen: Recht, Netzwerke, Linux, Methodik, die wichtigsten Schwachstellenklassen und den Bericht. Darauf baut alles Weitere auf. Diese letzte Lektion zeigt, wie du von hier aus sinnvoll weitermachst.

## Regelmäßig statt viel

Dreimal pro Woche eine Stunde bringt mehr als ein ganzer Samstag im Monat. Führe dein Laborbuch weiter und halte nach jeder Übung fest, was du gelernt hast und was offen geblieben ist. Die offenen Punkte sind dein Lernplan für die nächste Woche.

## Ein Vorschlag für die nächsten Monate

| Zeitraum | Schwerpunkt |
|---|---|
| Monat 1 | eigenes Labor aufbauen, Linux im Alltag benutzen |
| Monat 2 und 3 | geführte Einsteiger-Lernpfade auf einer Übungsplattform durcharbeiten |
| Monat 4 und 5 | Web-Sicherheit vertiefen, zum Beispiel mit den kostenlosen Laboren der Web Security Academy |
| ab Monat 6 | einfache Übungsmaschinen selbstständig bearbeiten und zu jeder einen Bericht schreiben |

## Übungsformen

- **Lernplattformen** wie TryHackMe oder Hack The Box Academy führen Schritt für Schritt durch Themen und stellen die Übungsumgebung bereit.
- **Capture the Flag (CTF)** sind Wettbewerbe mit Aufgaben aus verschiedenen Gebieten. Für Einsteiger eignet sich picoCTF.
- **OverTheWire** bietet Aufgabenreihen, mit denen du die Arbeit auf der Linux-Kommandozeile festigst.
- **Eigene Projekte:** Setze selbst einen Webserver auf und härte ihn. Wer Systeme aufbauen kann, versteht besser, wo sie brechen.

## Was du noch lernen solltest

- eine Skriptsprache, am besten Python, um wiederkehrende Aufgaben zu automatisieren
- Windows-Netze und den Verzeichnisdienst Active Directory, der in den meisten Unternehmen läuft
- Grundlagen von Cloud-Plattformen
- Englisch, weil fast alle Fachtexte in dieser Sprache erscheinen

## Zertifikate

Zertifikate ersetzen keine Übung, helfen aber beim Berufseinstieg. Drei bekannte Stufen:

| Zertifikat | Einordnung |
|---|---|
| CompTIA Security+ | breites Grundlagenwissen zur IT-Sicherheit, theoretische Prüfung |
| eJPT | Einstieg ins Pentesting mit praktischer Prüfung |
| OSCP | anspruchsvolle praktische Prüfung, in Stellenanzeigen für Pentester häufig genannt |

Prüfe vor einer Anmeldung die aktuellen Inhalte und Kosten beim jeweiligen Anbieter.

## Zum Schluss: der Kodex

Mit dem Können wächst die Verantwortung. Alles, was du lernst, lässt sich zum Schutz und zum Schaden einsetzen. Was dich von einem Kriminellen unterscheidet, sind die Erlaubnis, das Augenmaß und der Bericht am Ende.

> [!RECHT] Teste nur, was dir gehört oder wofür du eine schriftliche Erlaubnis hast. Diese Regel gilt für Anfänger genauso wie für Profis.

Wenn du alle Lektionen abgeschlossen hast, findest du in deinem [Profil](#/profil) eine Teilnahmebescheinigung zum Ausdrucken.

?? Welche Lernweise empfiehlt diese Lektion?
( ) Einmal im Monat einen ganzen Tag lernen
(x) Regelmäßig in kurzen Einheiten üben und ein Laborbuch führen
( ) Erst alle Zertifikate erwerben und dann üben
!! Regelmäßigkeit schlägt Menge. Das Laborbuch zeigt dir, was du gelernt hast und was offen ist.

?? Was ist ein Capture the Flag (CTF)?
( ) Ein Gesetz zur IT-Sicherheit
( ) Ein Werkzeug zum Scannen von Netzen
(x) Ein Wettbewerb mit Übungsaufgaben aus der IT-Sicherheit
!! In CTFs löst du Aufgaben in einer dafür gebauten Umgebung. Für Einsteiger gibt es eigene Wettbewerbe.

?? Was gilt für erfahrene Pentester genauso wie für Anfänger?
(x) Getestet wird nur mit Erlaubnis des Berechtigten.
( ) Mit genug Erfahrung darf man auch ohne Auftrag testen.
( ) Der Bericht ist freiwillig.
!! Die Erlaubnis ist die Grundlage jedes Tests, unabhängig von der Erfahrung.
