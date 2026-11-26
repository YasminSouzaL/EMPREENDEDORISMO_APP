ALTER TABLE aluno
    ADD COLUMN email VARCHAR(255);

ALTER TABLE aluno
    ADD CONSTRAINT uk_aluno_email UNIQUE (email);
