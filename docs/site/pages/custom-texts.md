# Testtaker: Textersetzungen

Dieses Dokument beschreibt, wie die benutzerdefinierten Texte in die Anwendung integriert werden und
listet alle möglichen Schlüssel auf. Die Textersetzungen können im Feld: `<CustomTexts>` für alle Logins hinterlegt werden.

```
<CustomTexts>
    <CustomText key="login_testEndButtonText">Test beenden</CustomText>
    <CustomText key="login_bookletSelectPrompt">Bitte wählen</CustomText>
...
</CustomTexts>
```

## Textersetzungen Systemcheck

Textersetzungen für den Systemcheck werden im Konfigurationsfeld der **Systemcheck-XML** angegeben.

```
<Config>
    <UploadSpeed ...
    <DownloadSpeed ...
    <CustomText key="syscheck_questionsintro">...</CustomText>
    <CustomText key="app_intro1">...</CustomText>
...
</Config>
```

<!--@include: ../generated/custom-texts.md-->
