---
titel: Passwörter und Kryptografie
kurz: Kodieren, hashen und verschlüsseln auseinanderhalten und verstehen, was ein gutes Passwort ausmacht.
icon: lock
---

# Kodieren, hashen, verschlüsseln
minuten: 10
xp: 50

Drei Verfahren verwandeln lesbaren Text in etwas, das unverständlich aussieht. Sie haben völlig verschiedene Zwecke. Wer sie verwechselt, baut unsichere Systeme oder zieht falsche Schlüsse aus dem, was er bei einer Prüfung sieht.

## Kodierung: nur eine andere Schreibweise

Eine Kodierung stellt Daten in anderer Form dar, damit sie sich transportieren oder speichern lassen. Ein Geheimnis gibt es dabei nicht. Jeder kann eine Kodierung umkehren.

| Kodierung | Beispiel für den Text „Hallo“ |
|---|---|
| Base64 | `SGFsbG8=` |
| Hexadezimal | `48616c6c6f` |
| URL-Kodierung | aus einem Leerzeichen wird `%20` |

Base64 erkennt man oft an den Gleichheitszeichen am Ende. Stößt ein Prüfer in einer Anwendung auf angeblich verschlüsselte Werte, die sich als Base64 entpuppen, dann ist das ein Befund: Die Daten sind ungeschützt.

> [!PRAXIS] Wandle im [Kodierer](#/werkzeuge) einen eigenen Text in Base64 um und wieder zurück. Dafür brauchst du keinen Schlüssel, und darin liegt der Unterschied zur Verschlüsselung.

## Verschlüsselung: mit Schlüssel umkehrbar

Verschlüsselung macht Daten für alle unlesbar, die den Schlüssel nicht haben. Mit dem Schlüssel lässt sich der ursprüngliche Text wiederherstellen.

- **Symmetrisch:** Derselbe Schlüssel verschlüsselt und entschlüsselt. Das Verfahren ist schnell, aber beide Seiten müssen den Schlüssel sicher austauschen. Der Standard heißt AES.
- **Asymmetrisch:** Es gibt ein Schlüsselpaar. Was mit dem öffentlichen Schlüssel verschlüsselt wurde, kann nur der private Schlüssel entschlüsseln. Bekannt sind RSA und Verfahren auf Basis elliptischer Kurven.

HTTPS kombiniert beides: Asymmetrische Verfahren dienen dem sicheren Aushandeln eines Schlüssels, danach läuft die eigentliche Übertragung symmetrisch.

## Hashing: eine Einbahnstraße

Eine Hashfunktion berechnet aus beliebig langen Daten einen Wert fester Länge, den Hash. Drei Eigenschaften sind wichtig:

- Derselbe Text ergibt immer denselben Hash.
- Aus dem Hash lässt sich der Text nicht zurückrechnen.
- Schon die kleinste Änderung am Text ergibt einen völlig anderen Hash.

Probiere es im [Hash-Rechner](#/werkzeuge) aus: Berechne den Hash von „Hallo“ und dann von „hallo“. Die beiden Ergebnisse haben nichts gemeinsam.

Hashes belegen, dass Daten unverändert sind, etwa bei Downloads. Ihr wichtigster Einsatz ist aber die Speicherung von Passwörtern.

## Passwörter richtig speichern

Ein Dienst sollte dein Passwort nie im Klartext speichern. Er speichert den Hash und vergleicht bei der Anmeldung nur Hashes. Wird die Datenbank gestohlen, stehen dort keine Passwörter.

Damit das wirklich schützt, braucht es zwei Zutaten.

Die erste ist der Salt, ein Zufallswert, der für jedes Konto einzeln erzeugt und zusammen mit dem Passwort gehasht wird. Zwei Benutzer mit demselben Passwort haben dadurch verschiedene Hashes, und vorberechnete Tabellen mit Hashes häufiger Passwörter werden nutzlos.

Die zweite ist eine langsame Hashfunktion. Allgemeine Hashfunktionen wie MD5, SHA-1 oder SHA-256 sind auf Geschwindigkeit ausgelegt. Für Passwörter ist das ein Nachteil, weil sich mit einer gestohlenen Datenbank sehr viele Kandidaten pro Sekunde durchprobieren lassen. Passwort-Hashfunktionen wie Argon2, scrypt und bcrypt sind absichtlich rechenaufwendig. Bei einer einzelnen Anmeldung fällt das nicht auf, massenhaftes Raten wird dadurch teuer.

MD5 und SHA-1 gelten außerdem als gebrochen und sollten für Sicherheitszwecke nicht mehr verwendet werden.

> [!ABWEHR] Diese Plattform speichert Passwörter mit scrypt und einem eigenen Salt pro Konto.

?? Du findest in einer Anwendung den Wert SGFsbG8= und kannst ihn ohne Schlüssel in lesbaren Text umwandeln. Worum handelt es sich?
(x) Um eine Kodierung, hier Base64
( ) Um eine Verschlüsselung mit AES
( ) Um einen Passwort-Hash
!! Base64 ist eine Kodierung. Sie lässt sich von jedem umkehren und schützt nichts.

?? Welche Eigenschaft hat eine Hashfunktion?
( ) Mit dem passenden Schlüssel lässt sich der Text wiederherstellen.
(x) Aus dem Hash lässt sich der ursprüngliche Text nicht zurückrechnen.
( ) Der Hash ist immer länger als der Text.
!! Hashing ist eine Einbahnstraße. Umkehrbar mit Schlüssel ist die Verschlüsselung.

?? Wozu dient ein Salt beim Speichern von Passwörtern?
( ) Er verkürzt den Hash.
( ) Er ersetzt das Passwort.
(x) Er sorgt dafür, dass gleiche Passwörter verschiedene Hashes ergeben und vorberechnete Tabellen nutzlos werden.
!! Der Salt ist ein Zufallswert pro Konto. Er wird zusammen mit dem Passwort gehasht.

?? Warum ist SHA-256 allein ungeeignet, um Passwörter zu speichern?
( ) Weil SHA-256 umkehrbar ist
(x) Weil die Funktion sehr schnell ist und sich damit sehr viele Passwörter pro Sekunde durchprobieren lassen
( ) Weil der Hash zu kurz ist
!! Für Passwörter braucht es absichtlich langsame Funktionen wie Argon2, scrypt oder bcrypt.

# Warum schwache Passwörter fallen
minuten: 9
xp: 45

Gestohlene und erratene Zugangsdaten gehören zu den häufigsten Ursachen erfolgreicher Angriffe. Diese Lektion erklärt, warum Raten überhaupt funktioniert und was dagegen hilft.

## Zwei Arten zu raten

Online bedeutet: Jemand probiert Passwörter direkt an der Anmeldeseite aus. Das ist langsam, weil jeder Versuch eine Anfrage an den Server ist, und es fällt auf. Ein gut eingestellter Server bremst oder sperrt nach wenigen Fehlversuchen.

Offline bedeutet: Jemand hat eine Datenbank mit Passwort-Hashes erbeutet und rät auf eigenen Rechnern. Für jeden Kandidaten wird der Hash berechnet und verglichen. Hier bremst kein Server. Die Geschwindigkeit hängt nur von der verwendeten Hashfunktion ab, und deshalb ist deren Wahl so wichtig.

## Menschen sind berechenbar

Niemand probiert alle Zeichenfolgen der Reihe nach durch, wenn es schneller geht. Aus früheren Datenlecks sind viele Millionen echter Passwörter bekannt. Solche Listen kommen beim Raten zuerst an die Reihe, ergänzt um typische Abwandlungen: ein Großbuchstabe am Anfang, eine Jahreszahl oder ein Ausrufezeichen am Ende. `Sommer2025!` erfüllt jede übliche Passwortregel und ist trotzdem schwach.

Zwei Begriffe solltest du kennen:

- **Credential Stuffing:** Zugangsdaten aus einem Datenleck werden bei anderen Diensten ausprobiert. Das funktioniert, weil viele Menschen dasselbe Passwort mehrfach verwenden.
- **Password Spraying:** Wenige sehr häufige Passwörter werden gegen viele Konten probiert, sodass kein einzelnes Konto gesperrt wird.

## Länge schlägt Komplexität

Die Zahl der möglichen Passwörter wächst mit jedem zusätzlichen Zeichen um ein Vielfaches:

| Passwort | Mögliche Kombinationen |
|---|---|
| 8 Kleinbuchstaben | etwa 200 Milliarden |
| 12 Zeichen aus Groß- und Kleinbuchstaben und Ziffern | etwa 3 Trilliarden |
| 5 zufällig gewählte Wörter aus einer Liste mit 7776 Wörtern | etwa 28 Trillionen |

Eine Passphrase aus mehreren zufälligen Wörtern ist lang, gut zu merken und schwer zu raten. Die Wörter müssen aber wirklich zufällig gewählt sein. Ein Liedtext oder ein Sprichwort steht in den Listen.

> [!PRAXIS] Der [Passwort-Check](#/werkzeuge) schätzt die Stärke einer Eingabe direkt in deinem Browser. Probiere verschiedene Längen aus, aber tippe aus Prinzip nirgends ein echtes Passwort zum Testen ein.

## Was Benutzer tun können

- für jeden Dienst ein eigenes Passwort verwenden
- einen Passwortmanager nutzen, der lange Zufallspasswörter erzeugt und speichert
- Zwei-Faktor-Anmeldung einschalten, wo immer sie angeboten wird

## Was Betreiber tun können

- Passwörter mit einer langsamen Hashfunktion und Salt speichern
- Anmeldeversuche begrenzen und auffällige Muster melden
- neue Passwörter gegen Listen bekannter geleakter Passwörter prüfen
- Zwei-Faktor-Anmeldung anbieten, für Administratoren verpflichtend

## Im Pentest

Ob in einem Test Passwörter geprüft werden, steht in der Beauftragung. Solche Prüfungen sind heikel: Gesperrte Konten können den Betrieb stören, und ermittelte Passwörter sind hochsensible Daten. Deshalb wird vorab vereinbart, was zulässig ist und was mit den Ergebnissen geschieht.

?? Was ist Credential Stuffing?
( ) Das Verschlüsseln von Zugangsdaten
(x) Das Ausprobieren von Zugangsdaten aus einem Datenleck bei anderen Diensten
( ) Das Erraten eines Passworts durch Ausprobieren aller Zeichenfolgen
!! Credential Stuffing nutzt aus, dass viele Menschen dasselbe Passwort bei mehreren Diensten verwenden.

?? Warum ist Sommer2025! trotz Großbuchstabe, Ziffern und Sonderzeichen ein schwaches Passwort?
( ) Weil es zu lang ist
( ) Weil Sonderzeichen Passwörter schwächen
(x) Weil es einem verbreiteten Muster folgt, das beim Raten früh an die Reihe kommt
!! Wort, Jahreszahl, Ausrufezeichen: Solche Muster stehen in jeder Liste von Passwort-Abwandlungen.

?? Was begrenzt die Geschwindigkeit beim Offline-Raten gegen gestohlene Hashes?
(x) Der Rechenaufwand der verwendeten Hashfunktion
( ) Die Sperre nach drei Fehlversuchen
( ) Die Geschwindigkeit der Internetverbindung
!! Offline bremst kein Server. Nur eine absichtlich langsame Hashfunktion macht das Raten teuer.

?? Was ist der wichtigste Vorteil eines Passwortmanagers?
( ) Er macht Zwei-Faktor-Anmeldung überflüssig.
(x) Er ermöglicht für jeden Dienst ein eigenes, langes Zufallspasswort.
( ) Er verhindert Datenlecks bei den Anbietern.
!! Mit eigenen Passwörtern pro Dienst bleibt ein Datenleck auf diesen einen Dienst beschränkt.
