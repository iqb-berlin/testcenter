create table files
(
    workspace_id       bigint(20) unsigned                                            not null,
    name               varchar(40)                                                    not null,
    id                 varchar(40)                                                    null,
    version_mayor      int                                                            null,
    version_minor      int                                                            null,
    version_patch      int                                                            null,
    version_label      text                                                            null,
    label              text                                                           null,
    description        text                                                           null,
    type               enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') not null,
    verona_module_type enum ('player', 'schemer', 'editor')                           null,
    verona_version     varchar(12)                                                    null,
    verona_module_id   varchar(50)                                                    null,

    constraint files_pk primary key (workspace_id, name, type),
    constraint files_workspaces_id_fk foreign key (workspace_id) references workspaces (id) on delete cascade
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

create index files_workspace_id_name_index on files (workspace_id, name);
create index files_id_index on files (id);


