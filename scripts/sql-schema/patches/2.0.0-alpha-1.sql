alter table persons modify valid_until timestamp default NULL null on update CURRENT_TIMESTAMP;
alter table logins modify valid_until timestamp default NULL null on update CURRENT_TIMESTAMP;
