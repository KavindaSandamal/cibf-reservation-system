-- Create database (if not exists)
CREATE DATABASE cibf_db;

-- Connect to cibf_db
\c cibf_db

-- Create schemas for each microservice
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS stall_schema;
CREATE SCHEMA IF NOT EXISTS reservation_schema;
CREATE SCHEMA IF NOT EXISTS user_schema;

-- Grant permissions (postgres user has all permissions by default)
-- If using a different user, grant permissions:
-- GRANT ALL PRIVILEGES ON SCHEMA auth_schema TO postgres;
-- GRANT ALL PRIVILEGES ON SCHEMA stall_schema TO postgres;
-- GRANT ALL PRIVILEGES ON SCHEMA reservation_schema TO postgres;
-- GRANT ALL PRIVILEGES ON SCHEMA user_schema TO postgres;

-- Tables will be created automatically by Hibernate (spring.jpa.hibernate.ddl-auto=update)
-- No need to create tables manually
