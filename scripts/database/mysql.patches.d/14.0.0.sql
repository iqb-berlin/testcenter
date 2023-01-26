delete from files;
delete from unit_defs_attachments;
delete from logins;

alter table files add is_valid boolean not null;
alter table files add validation_report text null;
alter table files add modification_ts timestamp not null;
alter table files add size int not null;
alter table files add context_data text null;
alter table files modify id varchar(120) not null;

alter table files add
    constraint unique_id unique (workspace_id, id, type);

alter table files modify name varbinary(120) not null;
alter table logins modify source varbinary(120) not null;

alter table unit_defs_attachments
    add column file_type enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') generated always as ('Booklet') virtual;

alter table unit_defs_attachments modify column booklet_name varchar(120);
alter table unit_defs_attachments modify column workspace_id bigint unsigned;

alter table unit_defs_attachments
    add constraint files_fk
        foreign key (workspace_id, booklet_name, file_type) references files (workspace_id, id, type)
            on delete cascade;

create table file_relations (
    workspace_id bigint unsigned not null,
    subject_name varbinary(120) not null,
    subject_type enum('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') not null,
    relationship_type enum('hasBooklet', 'containsUnit', 'usesPlayer', 'usesPlayerResource', 'isDefinedBy', 'unknown') not null,
    object_type  enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') not null,
    object_name varbinary(120) null,
    constraint unique_combination
        unique (workspace_id, subject_name, subject_type, relationship_type, object_type, object_name),
    constraint file_relations_files_fk
        foreign key (workspace_id, subject_name, subject_type) references files (workspace_id, name, type)
        on delete cascade
) default char set=utf8 collate = utf8_german2_ci;


create index file_relations_subject_index
    on files (workspace_id, name, type);