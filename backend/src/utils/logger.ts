/**
 * Structured JSON logger.
 *
 * Writes to stdout in newline-delimited JSON so that Promtail can parse
 * log lines without any additional pipeline configuration.
 *
 * Format per line:
 *   {"timestamp":"…","level":"info","service":"taskmanager-backend","message":"…",[context]}
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  [key: string]: unknown
}

const SERVICE = 'taskmanager-backend'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const configuredLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ?? 'info'

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[configuredLevel]) return

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE,
    message,
    ...context,
  }

  const line = JSON.stringify(entry)

  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n')
  } else {
    process.stdout.write(line + '\n')
  }
}

const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    write('debug', message, context),

  info: (message: string, context?: Record<string, unknown>) =>
    write('info', message, context),

  warn: (message: string, context?: Record<string, unknown>) =>
    write('warn', message, context),

  error: (message: string, context?: Record<string, unknown>) =>
    write('error', message, context),
}

export default logger
