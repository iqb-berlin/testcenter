alter table files add is_valid boolean not null;
alter table files add validation_report text null;
alter table files add modification_ts timestamp not null;
alter table files add size int not null;
alter table files add context_data text null;

create table file_relations
(
    workspace_id bigint unsigned not null,
    subject_name varchar(120) not null,
    subject_type enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') not null,
    relationship_type enum('hasBooklet', 'containsUnit', 'usesPlayer', 'usesPlayerResource', 'isDefinedBy', 'unknown') not null,
    object_request varchar(120) not null,
    object_type  enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') not null,
    object_name varchar(120) null,
    constraint file_relations_pk
        primary key (workspace_id, subject_name, subject_type, relationship_type, object_request),
    constraint file_relations_files_fk
        foreign key (workspace_id, subject_name, subject_type) references files (workspace_id, name, type)
        on delete cascade
) collate = utf8_german2_ci;

-- TODO! set index

create index file_relations_subject_index
    on files (workspace_id, name, type);