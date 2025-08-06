/**
 * Profile Types - Tipos relacionados ao perfil do usuário
 */

import { User } from '@/lib/auth-service-v2'

export interface CompleteUser extends User {
  foto_perfil?: string
  foto_perfil_url?: string
  nome_completo?: string
  telefone?: string
  configuracoes_perfil?: ProfileSettings
  preferencias?: UserPreferences
}

export interface ProfileSettings {
  tema: 'light' | 'dark'
  notificacoes: boolean
  idioma: string
  privacidade: 'publico' | 'privado' | 'amigos'
}

export interface UserPreferences {
  newsletter: boolean
  notificacoes_email: boolean
  notificacoes_push: boolean
  idioma_preferido: string
}

export interface ProfilePhotoState {
  url: string | null
  isLoading: boolean
  error: Error | null
  lastUpdated: number
}

export interface ProfileDataProvider {
  getProfilePhoto(): string | null
  getProfilePhotoUrl(): string | null
  setProfilePhoto(photo: string): void
  onProfilePhotoChange(callback: (photo: string | null) => void): () => void
}

export interface ProfilePhotoError extends Error {
  type: 'network' | 'not_found' | 'invalid_format' | 'server_error'
  retryable: boolean
}