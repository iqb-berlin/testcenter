# Super-Admin
## Login
### with valid credentials of super-user
On the start page,

* insert credentials of super-user (`super:user123`)

  * "select workspace"-page appears
  * "super-admin"-button appears
  
* click "super-admin"-button

  * "super-user"-page appears
  * tab "users" is selected
  * tab "workspaces" exists
  
## "users"-tab 

### "create user"-button

On "users"-tab on "super-user"-page

* click the "add user"-button (+)

  * "new user"-modal appears.
  * "save" button is disabled
  
* insert name and password

  * save button is enabled
  
* click "save"-button

  * new user appears in list.


### change user's rights

On "users"-tab on "super-user"-page

* select a user *by clicking on his name* 

  * all workspaces an this user's (`expired_user`) rights appear on the right side
  
* change/give rights by clicking one of the checkboxes
* click the save-button. 
  
  * save confirmation appears.
  
* select another user *by clicking on his name*
* select the first user again

  * rights are still changed
  
### delete user

* select a user *by clicking on his name or on the box left to his name*

 * "confirm deletion"-modal appears

* click "ok"-button

 * user vanishes from list. 


### change user's password

On "users"-tab on "super-user"-page

* select a user *by clicking on his name*
* click on the "change-password"-button (the left of the two pen-icons)
  
  * "change password"-modal appears
  
  * insert new password

* "password changed" confirmation appears.

### change user's super-admin status

On "users"-tab on "super-user"-page

* select a user *by clicking on his name* (not to be confused with selection 
by the checkbox left to the name)
* click on the "change-super-admin-status"-button (the right of the 
two pen-icons)

  * "change-super-admin-status"-modal appears
  
* click OK

  * "insert password" modal appears
  
* insert password

  * user's super-admin status is gone (the asterisk behind his name vanished).
  

### don't change user's super-admin status without password

On "users"-tab on "super-user"-page

* select a user *by clicking on his name* (not to be confused with selection 
by the checkbox left to the name)
* click on the "change-super-admin-status"-button (the right of the 
two pen-icons)

  * "change-super-admin-status"-modal appears
  
* click OK

  * "insert password" modal appears
  
* insert incorrect password

 * warning appears.
 
## "workspaces"-tab

### add workspace

On "workspaces"-tab on "super-user"-page

* click the "add workspace"-button (+)

  * "new workspace"-modal appears.
  * "save" button is disabled
  
* insert name

  * save button is enabled
  
* click "save"-button

  * new workspace of this name appears in list.
  
### delete workspace 

* select a user *by clicking on the box left to it's name or the box left to it*

 * "confirm deletion"-modal appears

* click "ok"-button

 * workspace vanishes from list. 

### change user's rights on workspace

On "users"-tab on "super-user"-page

* select a workspace *by clicking on it's name* 

  * all users appear on the right side with their rights on this workspace
  
* change/give rights by clicking one of the checkboxes
* click the save-button. 
  
  * save confirmation appears
  
* select another user *by clicking on his name*
* select the first user again

  * rights are still changed.
