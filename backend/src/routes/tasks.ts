// src/routes/tasks.ts
import { Router, Request, Response } from 'express'
import Joi from 'joi'
import { pool } from '../database/connection'

const router = Router()

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow(''),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
})

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow(''),
  status: Joi.string().valid('todo', 'in-progress', 'done'),
  priority: Joi.string().valid('low', 'medium', 'high'),
}).min(1)

// Get all tasks for authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const { status, priority, limit = 100, offset = 0 } = req.query

    let query = 'SELECT * FROM tasks WHERE user_id = $1'
    const queryParams: any[] = [userId]
    let paramCount = 1

    if (status) {
      paramCount++
      query += ` AND status = $$\{paramCount}`
      queryParams.push(status)
    }

    if (priority) {
      paramCount++
      query += ` AND priority = $$\{paramCount}`
      queryParams.push(priority)
    }

    query += ' ORDER BY created_at DESC'

    if (limit) {
      paramCount++
      query += ` LIMIT $$\{paramCount}`
      queryParams.push(parseInt(limit as string))
    }

    if (offset) {
      paramCount++
      query += ` OFFSET $$\{paramCount}`
      queryParams.push(parseInt(offset as string))
    }

    const result = await pool.query(query, queryParams)

    res.json({
      success: true,
      data: result.rows.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        userId: task.user_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })),
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

// Get single task by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      })
      return
    }

    const task = result.rows[0]

    res.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        userId: task.user_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    })
  } catch (error) {
    console.error('Get task error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

// Create new task
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createTaskSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details?.[0]?.message ?? 'Validation error',
      })
      return
    }

    const userId = (req as any).user.userId
    const { title, description, priority } = value

    const result = await pool.query(
      'INSERT INTO tasks (title, description, priority, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description?.trim() || '', priority, userId]
    )

    const task = result.rows[0]

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        userId: task.user_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

// Update task
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = updateTaskSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details?.[0]?.message ?? 'Validation error',
      })
      return
    }

    const userId = (req as any).user.userId
    const { id } = req.params

    // Check if task exists and belongs to user
    const existingTask = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (existingTask.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      })
      return
    }

    // Build dynamic update query
    const updates = Object.keys(value)
    const values = Object.values(value)

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      })
      return
    }

    const setClause = updates
      .map((field, index) => `$\{field} = $$\{index + 1}`)
      .join(', ')
    values.push(id, userId)

    const query = `
      UPDATE tasks 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING *
    `

    const result = await pool.query(query, values)
    const task = result.rows[0]

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        userId: task.user_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

// Delete task
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      })
      return
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

export { router as taskRoutes }
