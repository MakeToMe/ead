/**
 * Tipos e interfaces para o sistema de logging
 */

export type LogLevel = 'SILENT' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE'

export interface LogConfig {
  environment: 'development' | 'production'
  globalLevel: LogLevel
  componentLevels: Record<string, LogLevel>
  quietMode: boolean
  debugMode: boolean
  persistSettings: boolean
}

export interface ComponentRegistry {
  [componentName: string]: {
    defaultLevel: LogLevel
    currentLevel: LogLevel
    description: string
  }
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  userId?: string
  sessionId?: string
  stackTrace?: string
}

export interface EnhancedLoggerConfig {
  globalLevel: LogLevel
  componentLevels: Record<string, LogLevel>
  enabledInProduction: boolean
  persistConfig: boolean
}

export interface LoggingCommands {
  setLogLevel(level: LogLevel): void
  setComponentLevel(component: string, level: LogLevel): void
  showLogConfig(): void
  enableQuietMode(): void
  enableDebugMode(): void
  enableNormalMode(): void
}

export interface LogManagerInterface {
  setGlobalLevel(level: LogLevel): void
  setComponentLevel(component: string, level: LogLevel): void
  getEffectiveLevel(component: string): LogLevel
  isEnabled(component: string, level: LogLevel): boolean
  enableQuietMode(): void
  enableDebugMode(): void
  getConfig(): LogConfig
  resetToDefaults(): void
}

export interface ComponentLogger {
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, data?: any, error?: Error): void
  critical(message: string, data?: any, error?: Error): void
}

export interface LoggerFactory {
  createLogger(componentName: string): ComponentLogger
  getLogger(componentName: string): ComponentLogger
  registerComponent(name: string, defaultLevel: LogLevel, description: string): void
}