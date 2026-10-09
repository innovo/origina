-- The built-in sample documents (nursing examples) are no longer used.
-- Remove them from the shared library; each institution keeps its own sources.
delete from corpus where org_id is null;
