CREATE TABLE IF NOT EXISTS public.file_document (
    document_id bigint,
    file_id bigint,
    PRIMARY KEY (document_id, file_id),
    FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE
);

ALTER TABLE documents
ADD COLUMN uploaded_by_user_id BIGINT;

ALTER TABLE documents
ADD CONSTRAINT fk_documents_user
FOREIGN KEY (uploaded_by_user_id)
REFERENCES users(id);