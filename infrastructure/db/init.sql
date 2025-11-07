-- Create database (if not exists)
CREATE DATABASE cibf_db;

-- Connect to cibf_db
\c cibf_db

-- Database will be initialized by Hibernate (spring.jpa.hibernate.ddl-auto=update)
-- No need to create tables manually