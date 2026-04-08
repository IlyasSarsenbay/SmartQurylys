-- Пересоздаём таблицу licenses с правильной структурой для JPA JOINED inheritance.
-- Ранее таблица имела отдельный file_id, но JPA ожидает id = PK + FK на files.

DROP TABLE IF EXISTS public.licenses;

DROP TYPE IF EXISTS license_review_status;

CREATE TYPE license_review_status AS ENUM (
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED'
);

CREATE TABLE public.licenses (
    id bigint NOT NULL PRIMARY KEY,
    license_category_display character varying(255),
    review_status license_review_status,
    organisation_id bigint,
    rejection_reason character varying(500),
    FOREIGN KEY (id) REFERENCES public.files(id) ON DELETE CASCADE,
    FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
);

ALTER TABLE public.licenses OWNER TO postgres;
