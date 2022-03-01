# noinspection SqlResolveForFile

alter table meta
    add category varChar(30) null;

alter table meta drop primary key;

alter table meta drop key meta_metaKey_uindex;

alter table meta
    add constraint meta_pk
        unique (metaKey, category);

create unique index meta_metaKey_category_uindex
    on meta (metaKey, category);
