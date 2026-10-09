# Leitfaden zum Mitwirken

Dieser Leitfaden richtet sich in erster Linie an externe Institute und Partnerorganisationen, die regelmäßig Code beitragen. Er beschreibt, wie ein Beitrag von der Idee bis zum Merge verläuft.

Warum dieser Leitfaden existiert: Beiträge sind am wertvollsten, wenn sie keine zusätzliche Arbeit verursachen – weder für Sie noch für uns. Ein fertiger Pull Request (PR) mit mehreren hundert Zeilen, der später aus konzeptionellen Gründen abgelehnt wird, ist für alle frustrierend und wäre vermeidbarer Aufwand gewesen. Wenn Sie den Workflow im Voraus kennen, wird Ihr Beitrag auf vorhersehbare Weise integriert, Reviews bleiben kurz, und niemand arbeitet an Dingen, die nie eingepflegt werden.

> **Kurzzusammenfassung**
> **Ihr Teil:** (bei größeren Änderungen: zuerst besprechen →) Fork oder Branch erstellen →
> PR gegen `master` auf GitHub mit einer beschreibenden Zusammenfassung eröffnen.
> **Unser Teil:** CI-Pipeline auslösen → Review durch mindestens einen Maintainer → Merge.

---

## 1. Leitende Prinzipien

- **Die Produktentwicklung obliegt dem IQB.** Testcenter wird von vielen Instituten genutzt, und es ist unsere Verantwortung als Maintainer, das System langfristig kohärent und wartbar zu halten. Die Entscheidung, was Teil des Produkts wird, liegt daher bei uns – aus diesem Grund möchten wir frühzeitig von Ihren Plänen erfahren: So stellen wir am einfachsten sicher, dass Ihre Arbeit in eine Richtung geht, die wir auch integrieren können.
- **Melden Sie sich frühzeitig.** Besonders bei Ihrem ersten Beitrag oder bei allem, was über eine kleine Korrektur hinausgeht, ist es eine gute Idee, vorab mit uns Kontakt aufzunehmen. Eine kurze Nachricht darüber, was Sie planen, spart allen Zeit und vermeidet spätere Überraschungen. Für größere Änderungen, die ein formelleres Vorgehen erfordern, siehe Abschnitt 2.
- **Kleine, überprüfbare Änderungen** sind großen, intransparente PRs vorzuziehen. Ein PR sollte eine kohärente Änderung darstellen und nicht mehrere unzusammenhängende Themen auf einmal. Bitte stellen Sie sicher, dass die Änderung für jemanden, der sie nicht geschrieben hat, lesbar und verständlich bleibt. Teilen Sie Ihre Arbeit in logische Einheiten auf – entweder als separate Commits innerhalb eines PR oder als mehrere verbundene PRs, wenn die Themen eigenständig sind.
- **Diskutieren Sie vor dem Codieren** bei größeren Änderungen (neue Module, Änderungen an öffentlichen Schnittstellen, architektonische Entscheidungen). Siehe Abschnitt 2.
- **Jeder externe Beitrag durchläuft ein Review.**

---

## 2. Vor dem Schreiben von Code: Vorschläge für Änderungen

| Umfang der Änderung | Vorgehen |
|---|---|
| Bugfix, kleine Verbesserung, Dokumentation, regelmäßiges Feature | PR direkt eröffnen – Motivation und Vorgehen können in der **PR-Beschreibung** stehen, ein separates Issue ist nicht notwendig |
| Architektur-/Schnittstellenänderung, größeres Refactoring, neue Abhängigkeit mit weitreichenden Auswirkungen | Zuerst ein **RFC-Issue** mit Label `rfc` erstellen: Problem, vorgeschlagene Lösung, Alternativen, Auswirkungen auf bestehende Nutzer |

---

## 3. Workflow im Detail

### 3.1 Fehler (issue)

Wenn Sie einen Bug melden oder ein Feature vorschlagen möchten, legen Sie bitte ein Ticket nach unserer [Issue-Vorlagen](https://github.com/iqb-berlin/testcenter/issues/new/choose) an.
Für kleine Änderungen und alles, was keine Diskussion erfordert, ist ein Ticket **nicht** notwendig (siehe Abschnitt 2): Ein PR mit einer guten Beschreibung reicht aus.

### 3.2 Repository und Branches

Der aktuelle Entwicklungsstand befindet sich auf `master`. Aus `master` kann zu jedem Zeitpunkt eine neue öffentliche Version (Release) erzeugt werden (CI muss grün sein).

**Beiträge:** Erstellen Sie Ihren eigenen Fork oder einen aus dem Master-Zweig abgeleiteten Feature-Zweig.

### 3.3 Pull Requests

- PRs werden **ausschließlich auf GitHub** eröffnet.
- Unsere CI-Pipeline **kann nicht auf Forks ausgeführt werden**. Damit die Checks laufen können, muss ein Maintainer einen Branch für Ihre Änderungen im Haupt-Repository erstellen. Erst dann können Ihre Commits die CI-Bestätigung erhalten. Dies geschieht, sobald der Review-Prozess beginnt. Seien Sie also nicht überrascht, wenn direkt nach dem Eröffnen des PR keine Checks angezeigt werden – Sie müssen selbst nichts unternehmen.
- Die PR-Beschreibung sollte enthalten: *was* geändert wurde, *warum* und *wie es getestet wurde*.
- Verweisen Sie auf das zugehörige Issue, z. B. `#123`. **Bitte verwenden Sie keine GitHub-Keywords wie `Closes #123` oder `Fixes #123`** – diese schließen das Ticket beim Merge automatisch. Wir schließen Tickets bewusst manuell, unter anderem um vor dem Schließen noch einmal zu prüfen, ob wirklich alles erledigt ist.
- Sie können einen PR gerne als **Draft** eröffnen, wenn Sie frühzeitig Feedback zur Richtung erhalten möchten, bevor die Implementierung abgeschlossen ist.
- Die Aktualisierung der `CHANGELOG.md` als Teil Ihres PR wird begrüßt, ist aber nicht zwingend erforderlich.

### 3.4 Review

- Zum Merge ist **mindestens eine Zustimmung eines Maintainers** erforderlich.
- Reviewer prüfen: Korrektheit, Einhaltung der Code-Richtlinien (siehe 4), Tests, Klarheit und Auswirkungen auf bestehende Nutzer/Institute.
- Unsere Review-Kapazitäten sind begrenzt, daher kann ein Review gelegentlich etwas dauern. Wir bemühen uns, zeitnah zu antworten, bitten aber um Ihr Verständnis, wenn es manchmal länger dauert. Eine kurze, freundliche Erinnerung im PR ist völlig in Ordnung, wenn länger nichts passiert.
- Wenn sich `master` weiterentwickelt hat, erwarten wir nicht, dass Sie Ihren Branch kontinuierlich aktualisieren. Ein Update ist nur notwendig, wenn Ihr Branch tatsächlich Konflikte mit `master` hat oder wenn die CI-Checks gegen den aktuellen Stand laufen müssen. Die Verantwortung, dass der PR integrierbar bleibt, liegt beim Beitragenden – in kleinen oder einfachen Fällen kann ein Maintainer dies auch direkt übernehmen.
- **Rebasing auf `master` ist für Feature-Branches unsere bevorzugte Methode**, damit Merge-Commits die Commit-Historie nicht unnötig belasten. Ein Merge von `master` in Ihren Branch ist jedoch nicht verboten – wenn dies für einen bestimmten Branch die Arbeit erleichtert, können Sie dies gerne tun.
- **Sobald andere Personen in Ihren Branch commiten** – wenn z. B. ein Reviewer einen Fix einpflegt – ist ein Rebase oder das Umschreiben des Verlaufs tabu, da dabei deren Arbeit stillschweigend gelöscht oder dupliziert werden könnte. Ab diesem Zeitpunkt sollten Sie entweder mergen oder sich in Verbindung setzen.

---

## 4. Code-Richtlinien

- Unsere Konventionen sind im Kapitel: **Style Guide** zusammengefasst.
- Bitte führen Sie Formatierung und Linting lokal aus, bevor Sie pushen.
- Neue Funktionalitäten benötigen **Tests**; Bugfixes sollten idealerweise einen Regressionstest enthalten.
- Öffentliche Schnittstellen (APIs, CLI, Konfigurationsformate) sind dokumentiert –
  kennzeichnen Sie Änderungen an diesen explizit im PR.

---

## 5. Kommunikation

- **Issues**: für alles, was mit Funktionalität/Features zu tun hat.
- **PRs**: für alles, was direkt mit dem Code zu tun hat.
- *TODO: Weitere Kanäle (z. B. Mailingliste / Matrix / regelmäßiger Austausch zwischen beteiligten Instituten) sind noch nicht festgelegt – diese werden hier verlinkt, sobald sie definiert sind.*

---

*Dieses Dokument ist ein lebendiges Dokument – Vorschläge zur Verbesserung sind immer als PR gegen diese Datei willkommen.*
