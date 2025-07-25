{{ config(materialized='table') }}

-- Users table for authentication
-- This table stores user information for the dashboard login system

-- Create the users table with proper structure
-- Note: This is a simplified version for ClickHouse
-- In a real production environment, you would want to use proper table creation

SELECT 
    generateUUIDv4() as user_id,
    'admin' as username,
    'admin@example.com' as email,
    '$2a$12$RLJOkxGze266qPlFoiSeIuVpwa4Y0vYSezWnjjBUyiJK1NghGOd2e' as password_hash, -- "password" hashed
    now() as created_at,
    now() as updated_at,
    true as is_active 
