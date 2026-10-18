import { ZodError } from 'zod'
import { AppError } from '../utils/AppError.js'

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500
  let message = err.message || 'Something went wrong'
  let errors

  if (err instanceof ZodError) {
    status = 400
    message = 'Validation failed'
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
  } else if (err.code === 11000) {
    status = 409
    const field = Object.keys(err.keyValue || {})[0] || 'value'
    message = `${field} already exists`
  } else if (err.name === 'ValidationError') {
    status = 400
    message = 'Validation failed'
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
  } else if (err.name === 'CastError') {
    status = 400
    message = 'Invalid ID format'
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401
    message = 'Invalid or expired session. Please log in again.'
  }

  if (status >= 500) console.error(err)

  const isProd = process.env.NODE_ENV === 'production'
  res.status(status).json({
    success: false,
    message: status >= 500 && isProd ? 'Internal server error' : message,
    ...(errors && { errors }),
    ...(!isProd && status >= 500 && { stack: err.stack }),
  })
}