# Stil-Leitfaden

Die Formatierungsregeln sind integriert und müssen zwingend eingehalten werden. Grundlegende Einstellungen wie Einrückungen und Zeilenenden stammen aus der `.editorconfig`, die der Editor automatisch anwendet.

---

## Commit-Nachrichten

- Betreff im Imperativ ("Füge hinzu", nicht "Hinzugefügt" oder "Fügt hinzu") formulieren, großgeschrieben und ohne abschließenden Punkt. Der Betreff wird kurz gehalten — etwa 50 Zeichen, nicht mehr als 72 inklusive Tag.
- Betreff und Hauptteil werden durch eine Leerzeile getrennt, der Hauptteil wird bei 72 Zeichen umgebrochen.
- Im Hauptteil wird erklärt, *warum* die Änderung vorgenommen wurde und was sie bewirkt, nicht wie sie funktioniert — der Diff zeigt das bereits.
- Dem Betreff wird der Teil des Projekts, den die Änderung betrifft, in eckige Klammern vorangestellt — zum Beispiel `[be]`, `[fe]`, `[db]`, `[e2e]`, `[ci]`, `[infra]`, `[docs]`, `[file-server]`. Mehrere Tags werden in einem Klammerpaar kombiniert: `[be, fe, docs]`.
- Der Tag beschreibt, worum es bei der Änderung geht – nicht jedes Verzeichnis, das davon betroffen ist. Eine Änderung, die keinem spezifischen Bereich zugeordnet werden kann, benötigt keinen Tag.
- 
Die Begründung hinter diesen Regeln ist unter [cbea.ms/git-commit](https://cbea.ms/git-commit/) erläutert.

---

## Backend (PHP)

Gelintet und formatiert mit [mago](https://mago.carthage.software), konfiguriert in `backend/mago.toml`.

- Jede Datei deklariert `strict_types=1`, und Typen werden mit PHP-eigenen Typhinweisen ausgedrückt.
- phpDocumentor-Stil-Docblocks werden nur dort verwendet, wo native Typhinweise nicht ausreichen — in der Praxis immer dann, wenn Arrays in einer Funktionssignatur erscheinen oder wenn Werte aus einem Array ausgelesen werden.
- Statische Funktionen werden bevorzugt — es wird ein funktionaler Stil angestrebt, wo das Problem dies zulässt.
- Enums und Klassen werden als Wertobjekte verwendet, anstatt Primitives herumzureichen.

---

## Frontend (Angular)

Gelintet mit ESLint, konfiguriert unter `eslintConfig` in `package.json`.

- Bei kleinen Komponenten werden Template und Stile inline gehalten. Dateien werden nur separiert, wenn die Lesbarkeit dies erfordert.
- Im HTML wird nicht nach einem Tag umgebrochen. Alles bleibt in einer Zeile, bis 80 Zeichen erreicht sind.
- HTML-Attribute werden wie folgt angeordnet:
  1. Struktur-Direktiven
  2. IDs, Klassen, ARIA-Labels
  3. Eingaben
  4. Ausgaben
- Deklarative Farben und Schriftgrößen werden anstelle von Hex-Codes verwendet.
- Es werden keine `get foo()`-Zugriffsmethoden hinzugefügt. Stattdessen wird ein einfaches Feld oder eine Methode verwendet, die beschreibt, was sie tut.

---

*Verbesserungsvorschläge sind willkommen*
