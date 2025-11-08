-- Create Admin User in auth_schema
-- Run this in your PostgreSQL client to create an admin user

-- Insert admin user (password: admin123 - hashed with BCrypt)
INSERT INTO auth_schema.users (username, password, role, business_name)
VALUES (
    'admin@cibf.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- BCrypt hash of "admin123"
    'ADMIN',
    NULL
)
ON CONFLICT (username) DO NOTHING;

-- Verify admin user was created
SELECT id, username, role FROM auth_schema.users WHERE username = 'admin@cibf.com';

