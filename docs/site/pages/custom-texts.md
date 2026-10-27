# Textersetzungen

Viele Texte der Oberfläche lassen sich durch eigene ersetzen. Diese Seite listet alle Schlüssel auf, deren Texte
ersetzt werden können. Die Ersetzungen werden als Key-Value-Paare im Element `<CustomTexts>` hinterlegt:

```xml
<CustomTexts>
    <CustomText key="login_testEndButtonLabel">Test beenden</CustomText>
    <CustomText key="booklet_warningEndTestTitle">Test wirklich beenden?</CustomText>
</CustomTexts>
```

Das Element kann an diesen Stellen stehen:

- in der **Testtaker-XML**: für alle Logins dieser Datei
- in der **Booklet-XML**: nur für dieses Booklet

::: tip Hinweis
Detaillierte Informationen zu den Testdateien finden Sie [hier](https://iqb-berlin.github.io/tba-info/study-run/preparation/test-files/).
:::

<!--@include: ../generated/custom-texts.md-->
