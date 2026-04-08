CREATE TABLE IF NOT EXISTS public.representative_documents (
    id bigint NOT NULL PRIMARY KEY,
    review_status character varying(255),
    rejection_reason character varying(500),
    organisation_id bigint,
    FOREIGN KEY (id) REFERENCES public.files(id) ON DELETE CASCADE,
    FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE
);

ALTER TABLE public.representative_documents OWNER TO postgres;
