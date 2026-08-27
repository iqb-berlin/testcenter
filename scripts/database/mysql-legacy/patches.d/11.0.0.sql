alter table test_logs
    add timestamp_server timestamp default CURRENT_TIMESTAMP null;

alter table tests
    add timestamp_server timestamp default CURRENT_TIMESTAMP null;
