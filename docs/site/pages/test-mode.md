---
pageClass: wide-page
---

# Modus der Testdurchführung

Das Testcenter kann Tests in verschiedenen Modi durchführen, die sich in ihren Eigenschaften unterscheiden. Der Modus
wird für jedes Login im Attribut `mode` des Elements `<Login>` in der **Testtaker-XML** festgelegt:

```xml
<Login mode="run-hot-return" name="test" pw="user123">
    <Booklet>BOOKLET.SAMPLE-1</Booklet>
</Login>
```

::: tip Hinweis
Detaillierte Informationen zur Testtaker-XML finden Sie [hier](https://iqb-berlin.github.io/tba-info/study-run/preparation/test-files/testtaker-xml.html).
:::

<!--@include: ../generated/test-mode.md-->
