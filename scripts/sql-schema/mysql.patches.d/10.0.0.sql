create table meta
(
	metaKey varchar(30) not null,
	value varchar(100) null
);

create unique index meta_metaKey_uindex
	on meta (metaKey);

alter table meta
	add constraint meta_pk
		primary key (metaKey);

-- INSERT INTO meta (metaKey, value) VALUES ('dbSchemaVersion', '10.0.0');
