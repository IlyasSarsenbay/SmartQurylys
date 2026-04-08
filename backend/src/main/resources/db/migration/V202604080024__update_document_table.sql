-- ALTER TABLE documents
-- DROP COLUMN uploaded_by_user_id;
-- ALTER TABLE documents
-- DROP COLUMN file_id;

ALTER TABLE documents
ADD COLUMN uploaded_by_user_id BIGINT;

ALTER TABLE documents
ADD CONSTRAINT fk_documents_user
FOREIGN KEY (uploaded_by_user_id)
REFERENCES users(id);

ALTER TABLE documents
ADD COLUMN file_id BIGINT;

ALTER TABLE documents
ADD CONSTRAINT fk_documents_file
FOREIGN KEY (file_id)
REFERENCES files(id) 
ON DELETE CASCADE;
