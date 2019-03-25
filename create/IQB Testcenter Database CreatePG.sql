-- database schema IQB Testcenter
-- for PostgreSQL

-- vo stands for VERA online
-- tc stands for testcenter

-- CREATE DATABASE not tested (dummy)
CREATE DATABASE votcdb
    WITH 
    OWNER = votc_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'de_DE.UTF-8'
    LC_CTYPE = 'de_DE.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

GRANT ALL ON DATABASE votcdb TO votc_admin;


-- tested 10.9.2018 (mdr2, mme)

CREATE TABLE public.users
(
    id serial,
    name character varying(50) NOT NULL,
    password character varying(100) NOT NULL,
    email character varying(100),
    is_superadmin boolean NOT NULL DEFAULT false,
    CONSTRAINT pk_users PRIMARY KEY (id)
);

CREATE TABLE public.workspaces
(
    id serial,
    name character varying(50) NOT NULL,
    CONSTRAINT pk_workspaces PRIMARY KEY (id)
);

CREATE TABLE public.workspace_users
(
    workspace_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(10) NOT NULL DEFAULT 'RW',
    CONSTRAINT pk_workspace_users PRIMARY KEY (workspace_id, user_id),
    CONSTRAINT fk_workspace_users_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_workspace_users_workspace FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.admintokens
(
    id character varying(50) NOT NULL,
    user_id integer NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    CONSTRAINT pk_admintokens PRIMARY KEY (id),
    CONSTRAINT fk_users_admintokens FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.logins
(
    id serial,
    name character varying(50) NOT NULL,
    mode character varying(10) NOT NULL,
    workspace_id integer NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    token character varying(50) NOT NULL,
    booklet_def text,
    groupname character varying(100) NOT NULL,
    CONSTRAINT pk_logins PRIMARY KEY (id),
    CONSTRAINT fk_login_workspace FOREIGN KEY (workspace_id)
        REFERENCES public.workspaces (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
	
CREATE TABLE public.persons
(
    id serial,
    code character varying(50) NOT NULL,
    login_id integer NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    token character varying(50) NOT NULL,
    laststate text,
    CONSTRAINT pk_persons PRIMARY KEY (id),
    CONSTRAINT fk_person_login FOREIGN KEY (login_id)
        REFERENCES public.logins (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.booklets
(
    id serial,
    name character varying(50) NOT NULL,
    person_id integer NOT NULL,
    laststate text,
    locked boolean NOT NULL DEFAULT false,
    label character varying(100),
    CONSTRAINT pk_booklets PRIMARY KEY (id),
    CONSTRAINT fk_booklet_person FOREIGN KEY (person_id)
        REFERENCES public.persons (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
	
CREATE TABLE public.bookletlogs
(
    booklet_id integer NOT NULL,
    timestamp bigint NOT NULL DEFAULT 0,
    logentry text,
    CONSTRAINT fk_log_booklet FOREIGN KEY (booklet_id)
        REFERENCES public.booklets (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.bookletreviews
(
    booklet_id integer NOT NULL,
    reviewtime timestamp without time zone NOT NULL,
	reviewer character varying(50) NOT NULL,
	priority integer NOT NULL DEFAULT 0,
	categories character varying(50),
    entry text,
    CONSTRAINT fk_review_booklet FOREIGN KEY (booklet_id)
        REFERENCES public.booklets (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.units
(
    id serial,
    name character varying(50) NOT NULL,
    booklet_id integer NOT NULL,
    laststate text,
    responses text,
    responsetype character varying(50),
    responses_ts bigint default 0,
    restorepoint text,
    restorepoint_ts bigint default 0,
    CONSTRAINT pk_units PRIMARY KEY (id),
    CONSTRAINT fk_unit_booklet FOREIGN KEY (booklet_id)
        REFERENCES public.booklets (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.unitlogs
(
    unit_id integer NOT NULL,
    timestamp bigint NOT NULL DEFAULT 0,
    logentry text,
    CONSTRAINT fk_log_unit FOREIGN KEY (unit_id)
        REFERENCES public.units (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE public.unitreviews
(
    unit_id integer NOT NULL,
    reviewtime timestamp without time zone NOT NULL,
	reviewer character varying(50) NOT NULL,
	priority integer NOT NULL DEFAULT 0,
	categories character varying(50),
    entry text,
    CONSTRAINT fk_unit_booklet FOREIGN KEY (unit_id)
        REFERENCES public.units (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
