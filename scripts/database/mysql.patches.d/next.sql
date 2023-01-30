alter table unit_defs_attachments
    modify column file_type enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') generated always as ('Booklet');

alter table unit_defs_attachments
    add constraint files_fk
        foreign key (workspace_id, booklet_name, file_type) references files (workspace_id, id, type)
            on delete cascade;