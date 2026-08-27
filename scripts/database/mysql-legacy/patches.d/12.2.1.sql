alter table files modify version_label text null;

alter table files modify verona_module_type enum('player', 'schemer', 'editor', '') null;