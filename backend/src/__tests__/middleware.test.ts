
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateToken } from '@/middleware/auth'

const JWT_SECRET = 'your-secret-key'

const makeReq = (authHeader?: string): Partial<Request> => ({
  headers: authHeader ? { authorization: authHeader } : {},
})

const makeRes = (): Partial<Response> => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('authenticateToken middleware', () => {
  const next: NextFunction = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when Authorization header is missing', () => {
    const req = makeReq() as Request
    const res = makeRes() as Response

    authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Access token required' })
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token format is wrong (no Bearer prefix)', () => {
    const req = makeReq('InvalidFormat token123') as Request
    const res = makeRes() as Response

    authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with InvalidToken error for malformed token', (done) => {
    const req = makeReq('Bearer malformed.token.here') as Request
    const res = makeRes() as Response
    const next: NextFunction = jest.fn()

    authenticateToken(req, res, () => {})

    setTimeout(() => {
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'InvalidToken' })
      )
      done()
    }, 50)
  })

  it('returns 401 with TokenExpired error for expired token', (done) => {
    const expiredToken = jwt.sign(
      { userId: 'user-1', email: 'test@test.com' },
      JWT_SECRET,
      { expiresIn: -1 } // already expired
    )

    const req = makeReq(`Bearer ${expiredToken}`) as Request
    const res = makeRes() as Response

    authenticateToken(req, res, () => {})

    setTimeout(() => {
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'TokenExpired' })
      )
      done()
    }, 50)
  })

  it('calls next() and attaches user to req for valid token', (done) => {
    const token = jwt.sign(
      { userId: 'user-123', email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    const req = makeReq(`Bearer ${token}`) as any
    const res = makeRes() as Response
    const next = jest.fn()

    authenticateToken(req, res, next)

    setTimeout(() => {
      expect(next).toHaveBeenCalled()
      expect(req.user).toEqual({ userId: 'user-123', email: 'test@example.com' })
      done()
    }, 50)
  })
})
