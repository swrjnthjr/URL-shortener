-- A new migration rather than editing 001_create_urls.sql, since that one
-- may already be applied (and recorded in schema_migrations) elsewhere.
ALTER SEQUENCE urls_id_seq RESTART WITH 100001;
