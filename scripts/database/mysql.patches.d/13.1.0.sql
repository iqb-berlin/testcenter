create table unit_defs_attachments
(
    workspace_id bigint not null,
    unit_name varchar(120) not null,
    booklet_name varchar(50) not null,
    attachment_type enum('capture-image') not null,
    variable_id varchar(100) not null,
    constraint unit_defs_attachments_pk
        primary key (booklet_name, unit_name, variable_id, workspace_id)
) collate = utf8_german2_ci;

