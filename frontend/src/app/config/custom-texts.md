# CustomTexts
This application enables changes of texts during runtime. It's an implementation 
of the CustomTextPipe/CustomTextService 
of [iqb-components](https://github.com/iqb-berlin/iqb-components). The idea is, that 
there might be some cases where the standard titles, prompts or explanations are not 
suitable for the specific environment the iqb-testcenter application is run in. One 
could change the source code and rebuild the application, but for minor changes we 
use this text replacement feature 'custom texts'.

This document 
describes the ways to bring the custom texts to the application and lists 
all possible keys.

### Configuration file on the server
There is one file on the server where the application looks for custom texts:
```
/config/customTexts.json
``` 
These custom texts are loaded at (re)start of the application and the replacement starts 
as soon as possible. This is a simple JSON file with key value pairs. Example:
```
{
    "login_testEndButtonLabel": "Test beenden",
    "login_bookletSelectPrompt": "Bitte wählen",
...
}
```
The adminstrator of the server can upload this file. We aim at providing an 
administration feature of the super-admin section of the application to manage 
these texts.

### Configuration via login configuration
For some tests, the test authority might like to change standard titles, prompts or explanations 
furthermore depending on the testtaker. For example, the questionnaire for teachers 
will use 'Please contact the administrator of the survey' and the booklet for students 
will prompt 'Please ask the test proctor'.

The login configuration goes with the XML file for the longin(s). There is one optional 
section 'CustomTexts' in every login file. Text replacements in this section will apply 
for every login of this file. Example:
```
<CustomTexts>
    <CustomText key="login_testEndButtonText">Test beenden</CustomText>
    <CustomText key="login_bookletSelectPrompt">Bitte wählen</CustomText>
...
</CustomTexts>
```
### Configuration of System check
In the definition file for system checks, there is also one place to define text
replacements:
```
<Config>
    <UploadSpeed ...
    <DownloadSpeed ...
    <CustomText key="syscheck_questionsintro">...</CustomText>
    <CustomText key="app_intro1">...</CustomText>
...
</Config>
```



### List of possible replacements
| Key       | Used for     | Default     |
| :------------- | :---------- | :----------- |
