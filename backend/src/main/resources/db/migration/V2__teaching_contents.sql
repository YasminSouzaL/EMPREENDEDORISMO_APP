CREATE TABLE portal_content (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36) NOT NULL REFERENCES portal_school(id), course_id VARCHAR(40) NOT NULL, class_id VARCHAR(60) NOT NULL, title VARCHAR(200) NOT NULL, body TEXT NOT NULL, url TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE INDEX portal_content_scope_idx ON portal_content(school_id,course_id,class_id);
