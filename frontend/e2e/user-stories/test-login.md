# Test
## Login
### with valid credentials
On the start page,

* insert credentials (`test:user123`)

  * "Insert Code" modal appears

* insert correct code: (`xxx`)

  * booklet overview appears and contains booklets: `Sample booklet`.

### with invalid credentials

On the start page,

* insert invalid credentials (`test:blah`)

  * "Invalid credentials"-message appears.

### with correct credentials but wrong code
On the start page,

* insert credentials (`test:user123`)

  * "Insert Code" modal appears

* insert code: (`zzz`)

  * booklet overview appears and contains booklets: `Sample booklet`.

  * "Invalid code"-message appears.

* insert correct code (`xxx`)
* click "continue"

  * booklet overview appears and contains booklets: `Sample booklet`.

## login with codeless-login

On the start page,

* insert credentials of codeless login (`test-review:user123`)

  * booklet overview appears and contains booklets: `Sample booklet`.

## login with passwordless-login

On the start page,

* insert credentials of a login that does not require a password (`test-no-pw:`)

  * booklet overview appears and contains booklets: `Sample booklet`.

## login with expired login

On the start page,

* insert credentials of an expired login (`test-expired:`)

  * "login expired"-warning appears
  * login form stays
 
* re-enter correct credentials (`test:user123`)

  * booklet overview appears and contains booklets: `Sample booklet`.

Known Bug: https://github.com/iqb-berlin/testcenter-iqb-ng/issues/107

## login with login, that is no active right now

On the start page,

* insert credentials of a login, which is not active right now (`test-future:`)

  * "login invalid"-warning appears
  * login form stays

* re-enter correct credentials (`test:user123`)

  * booklet overview appears and contains booklets: `Sample booklet`.

Known Bug: https://github.com/iqb-berlin/testcenter-iqb-ng/issues/108

## login survives reload

On the start page,

* insert credentials (`test:user123`)

  * "Insert Code" modal appears

* reload page by pressing [F5] 

  * "Insert Code" modal appears again
  
* insert correct code: (`xxx`)

  * booklet overview appears and contains booklets: `Sample booklet`
  
* reload page by pressing [F5] 

  * booklet overview appears again.

## Forward/Back Buttons while login do their job

Not implemented yet: https://github.com/iqb-berlin/testcenter-iqb-ng/issues/109

## "login again"-button restarts login-process

On the start page,

* insert credentials (`test:user123`)

  * "Insert Code" modal appears again
  
* click "login again"

  * start page appears

* insert credentials again (`test:user123`)

  * "Insert Code" modal appears again

* insert correct code: (`xxx`)

  * booklet overview appears
  
* click "login again"

  * start page appears
