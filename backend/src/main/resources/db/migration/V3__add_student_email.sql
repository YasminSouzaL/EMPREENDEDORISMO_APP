ALTER TABLE aluno
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_aluno_email'
    ) THEN
        ALTER TABLE aluno
            ADD CONSTRAINT uk_aluno_email UNIQUE (email);
    END IF;
END
$$;
