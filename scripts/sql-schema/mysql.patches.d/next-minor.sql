alter table meta
    add category varChar(30) null;

drop index meta_metaKey_uindex on meta;

alter table meta drop primary key;

alter table meta drop key meta_metaKey_uindex;

alter table meta
    add constraint meta_pk
        unique (metaKey, category);

create unique index meta_metaKey_category_uindex
    on meta (metaKey, category);
