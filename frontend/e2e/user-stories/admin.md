# Admin
## Login
### with valid credentials of super-user
On the start page,

* insert credentials of admin-user (`super:user123`)

  * "select workspace"-page appears
  
### with invalid credentials
On the start page,

* insert credentials of super-user (`super:user123`)
  
# select workspace   
On "select workspace"-page

* click on workspace

  * "workspace overview"-page appears
  * "files"-tab is open
  * "sys-check-report"-tab available if sys-check in this workspace
  * "results/answers"-tab available if booklet exists
  * in headline: name of workspace and rights
  
# files tab

On "files"-tab in "workspace overview"-page

 * all files from workspace are listed.


## validate button

On "files"-tab in "workspace overview"-page

* click on "validate workspace"-button

  * validation results appear below the buttons.
  
## upload button shall upload XML File 
  
On "files"-tab in "workspace overview"-page

* click on "upload"-button
* select Unit-File from your hard drive

  * the new file appears in filelist.


## upload button shall not upload invalid XML File

On "files"-tab in "workspace overview"-page

* click on "upload"-button
* select broken Unit-File from your hard drive

  * XMl-error description appears below the buttons
  * OK-button appears below error-text
  
* click OK-button

  * XMl-error description disappears.
  
## upload button shall accept multiple files

On "files"-tab in "workspace overview"-page

* click on "upload"-button
* select (use shift key) a broken and a valid unit file from your hard drive

  * XMl-error description for the broken file appears below the buttons
  * OK-button appears below error-text
  * valid file appears in file-list.
  
* click OK-button

  * XMl-error description disappears.

## upload button shall accept zipped archive

On "files"-tab in "workspace overview"-page

* click on "upload"-button
* select zip-archive with two valid files

  * both files appears in file-list.
  
## delete button shall delete files

On "files"-tab in "workspace overview"-page

* check the boxes left to the names of two files
* click the "delete file"-button

 * "confirm deletion"-modal appears

* click "ok"-button

  * the two files disappear from file-list

# sys-check tab

On "SysCheck"-tab in "workspace overview"-page

 * sys-check-report(s) appear in list
 
## get report-data CSV

* select sys-check-report(s) by checking the boxes left to the names
* click the "download reports"-button

  * download modal appears or downloads starts (browser dependant)
  * download contains valid CSV
  
## delete reports

* select a sys-check-report-set by checking the boxes left to the names
* click the delete-button

 * "confirm deletion"-modal appears

* click "ok"-button
   
 * the list-entry of this report-set disappears from list.
 
# results tab

On "Results"-tab in "workspace overview"-page

 * result-sets for groups appear in list
 
## "download-answers"-button

On "Results"-tab in "workspace overview"-page

* select a result-set by checking the boxes left to the names
* click the "download-answers"-button

  * download modal appears or downloads starts (browser dependant)
  * download contains valid CSV
  
## "download-logs"-button

On "Results"-tab in "workspace overview"-page

* select a result-set by checking the boxes left to the names
* click the "download-logs"-button

  * download modal appears or downloads starts (browser dependant)
  * download contains valid CSV
  
## "download-comments"-button

On "Results"-tab in "workspace overview"-page

* select a result-set by checking the boxes left to the names
* click the "download-comments"-button

  * download modal appears or downloads starts (browser dependant)
  * download contains valid CSV

## delete results

* select a result-set by checking the boxes left to the names
* click the "delete"-button

 * "confirm deletion"-modal appears

* click "ok"-button
   
 * the list-entry of this report-set disappears from list.
