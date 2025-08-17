-- Database initialization script
-- This file will be executed when PostgreSQL container starts for the first time

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert demo user (password: demo123)
INSERT INTO users (name, email, password_hash) VALUES 
('Demo User', 'demo@taskmanager.com', '$2b$10$rOlmn9jUHCu7.Y9bJqWh0eiGCw3cjOiCh0tUn9L9fKrGJlKhGh7u2')
ON CONFLICT (email) DO NOTHING;

-- Insert demo tasks for the demo user
INSERT INTO tasks (title, description, status, priority, user_id) 
SELECT 
    title, description, status, priority, u.id
FROM (VALUES 
    ('Learn Docker', 'Study Docker containerization and multi-stage builds for DevOps', 'done', 'high'),
    ('Setup Kubernetes', 'Configure k3s cluster and deploy microservices applications', 'in-progress', 'high'),
    ('CI/CD Pipeline', 'Implement GitHub Actions for automated testing and deployment', 'todo', 'medium'),
    ('Monitoring Setup', 'Configure Prometheus and Grafana for application observability', 'todo', 'medium'),
    ('Security Hardening', 'Implement security best practices and vulnerability scanning', 'todo', 'low'),
    ('Database Optimization', 'Optimize PostgreSQL queries and implement connection pooling', 'todo', 'low')
) AS demo_tasks(title, description, status, priority),
users u 
WHERE u.email = 'demo@taskmanager.com'
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully with demo data';
END $$;
