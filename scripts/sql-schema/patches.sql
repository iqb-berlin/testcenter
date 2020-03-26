-- patches for validity time control https://github.com/iqb-berlin/testcenter-iqb-php/issues/67
alter table persons modify valid_until timestamp default NULL null;
alter table logins modify valid_until timestamp default NULL null;
