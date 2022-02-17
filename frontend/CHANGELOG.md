# Changelog

## 12.0.3
Various Bugfixes:
* (#341) When you visited a test in demo-mode as a monitor, and terminated it, you returned to the starter but didn't see the monitor-monitor button again. That got fixed.
* (#340) After reload you return to the correct unit now
* (#335) Order of checks when leaving a unit is fixed: First check completeness, then ask for leaving the timed block
* (#347) Dont't check navigationLeaveRestrictions if unit is already time-locked.

Minor Changes
* In "demo" mode "showTimeLeft" is off now

## 12.0.2
Use Font Roboto everywhere

## 12.0.1
Fix critical bug in login

## 12.0.0
This Version implements Verona 3 and Verona 4 specs.

### Version-Number
We synchronize version-numbers of front- and backend to 12 because there will be only one version-number in the future anyway.

### Fixes
* (Almost) all [defined booklet-parameters](https://iqb-berlin.github.io/testcenter-frontend/booklet-config) should work now.
* Redesign of the Unit- and Page-Navigation.
* Improved error-handling (especially while loading tests).
* Improved behaviour while loading, make progress bar actually show progress.
* The sandboxing of the player's iframe is improved to maintain security and also allow links into new tabs.

### New Features
* [Verona 3 and Verona 4](https://github.com/verona-interfaces/player) compatible!
* New Navigation-paradigm: 
  * Instead of hindering the user to enter a unit which is locked (by timer, by code oder because it's not loaded yet), it can now regardless 
    be entered but will not be displayed. This allows the testee to go back or do whatever she wants when entering a locked unit instead of landing in
    a navigational limbo with no escape.
  * Units, that have no timer get never locked now, and the testee is **always** allowed to return to them - even if (and this is new) there is a locked block
    between ths current and the target unit.
* You can now restrict your units to can only be left when everything was seen and/or edited. For this there are 
  booklet-parameter `force_presentation_complete` and `force_response_complete` as well as new Restriction-Element called `<DenyNavigationOnIncomplete>`.
* new useful booklet-parameters `restore_current_page_on_return`, `show_end_button_in_player`, `allow_player_to_terminate_test`, `lock_test_on_termination`.

### Known Issues
* This version of the Testcenter is compatible with all known players that use the Verona2, Verona3 oder Verona4 interface. A noteworthy exception is the simple player 2. 
  Because the dataParts where implemented wrongly (not stringified), it will not be able to restore previously entered unit data after relaod/re-login anymore
  (but apart from that work correctly).
* In Verona 2+ there is mode for `stateReportPolicy` called `on-demand`- This can be set in the 
  booklet is still *not* supported by the testcenter. (It will fall back to `eager`). [#324](https://github.com/iqb-berlin/testcenter-frontend/issues/324)



## 9.0.0
* Update Angular version from 9 to 12
