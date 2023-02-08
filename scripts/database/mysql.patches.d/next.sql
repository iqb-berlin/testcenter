alter table unit_defs_attachments
    drop column file_type;

alter table unit_defs_attachments
    add column file_type enum ('Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource') generated always as ('Booklet') stored;

