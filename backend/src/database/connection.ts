// src/database/connection.ts
import { Pool } from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
// const bcrypt = require('bcrypt')

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'taskmanager',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('✅ Database connected successfully')
    console.log('⏰ Database time:', result.rows[0].now)
    client.release()
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect()

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
        priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `)

    // Create demo user if not exists
    const demoUserCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@taskmanager.com']
    )

    if (demoUserCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('demo123', 10)

      const demoUser = await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['Demo User', 'demo@taskmanager.com', hashedPassword]
      )

      // Create demo tasks
      const demoTasks = [
        {
          title: 'Learn Docker',
          description: 'Study Docker containerization and multi-stage builds',
          status: 'done',
          priority: 'high',
        },
        {
          title: 'Setup Kubernetes',
          description: 'Configure k3s cluster and deploy applications',
          status: 'in-progress',
          priority: 'high',
        },
        {
          title: 'CI/CD Pipeline',
          description: 'Implement GitHub Actions for automated deployment',
          status: 'todo',
          priority: 'medium',
        },
        {
          title: 'Monitoring Setup',
          description: 'Configure Prometheus and Grafana for observability',
          status: 'todo',
          priority: 'medium',
        },
        {
          title: 'Security Hardening',
          description:
            'Implement security best practices and vulnerability scanning',
          status: 'todo',
          priority: 'low',
        },
      ]

      for (const task of demoTasks) {
        await client.query(
          'INSERT INTO tasks (title, description, status, priority, user_id) VALUES ($1, $2, $3, $4, $5)',
          [
            task.title,
            task.description,
            task.status,
            task.priority,
            demoUser.rows[0].id,
          ]
        )
      }

      console.log('👤 Demo user created with sample tasks')
    }

    client.release()
    console.log('✅ Database schema initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

export { pool }
