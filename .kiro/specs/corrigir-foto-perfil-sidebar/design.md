# Design Document

## Overview

O problema da foto de perfil na sidebar indica que o sistema de autenticação atual não está carregando dados completos do perfil do usuário durante a verificação de sessão. A solução envolve expandir os dados retornados pela API de autenticação e garantir que todos os componentes tenham acesso às informações completas do perfil desde o primeiro carregamento.

## Architecture

### Data Flow Enhancement
```
Login/Session Check → Complete Profile Data → AuthContext → Sidebar Component
                                          ↓
                                    Profile Cache → Other Components
```

### Profile Data Structure
```typescript
interface CompleteUser extends User {
  foto_perfil?: string
  foto_perfil_url?: string
  configuracoes_perfil?: ProfileSettings
  preferencias?: UserPreferences
}
```

### Caching Strategy
- Cache completo do perfil no AuthContext
- Invalidação inteligente quando dados são atualizados
- Fallback para dados parciais se carregamento completo falhar

## Components and Interfaces

### Enhanced AuthService
```typescript
interface AuthServiceV2 {
  // Existing methods...
  getCurrentUserProfile(): CompleteUser | null
  refreshUserProfile(): Promise<CompleteUser | null>
  updateUserProfile(updates: Partial<CompleteUser>): Promise<CompleteUser>
}
```

### Profile Data Provider
```typescript
interface ProfileDataProvider {
  getProfilePhoto(): string | null
  getProfilePhotoUrl(): string | null
  setProfilePhoto(photo: string): void
  onProfilePhotoChange(callback: (photo: string | null) => void): UnsubscribeFn
}
```

### Sidebar Component Updates
```typescript
interface SidebarProps {
  user: CompleteUser | null
  isLoading: boolean
  onProfilePhotoError?: (error: Error) => void
}
```

## Data Models

### Complete User Profile
```typescript
interface CompleteUser {
  // Existing User fields
  uid: string
  nome: string
  email: string
  perfis: string
  criado_em: string
  atualizado_em: string
  
  // Enhanced profile fields
  foto_perfil?: string
  foto_perfil_url?: string
  nome_completo?: string
  telefone?: string
  configuracoes_perfil?: {
    tema: 'light' | 'dark'
    notificacoes: boolean
    idioma: string
  }
}
```

### Profile Photo State
```typescript
interface ProfilePhotoState {
  url: string | null
  isLoading: boolean
  error: Error | null
  lastUpdated: number
}
```

## Error Handling

### Photo Loading Errors
- Graceful fallback to default avatar
- Retry mechanism for network errors
- Error logging without breaking UI
- User feedback for persistent errors

### API Integration Errors
- Fallback to basic user data if profile enhancement fails
- Progressive enhancement approach
- Maintain existing functionality if new features fail

### Cache Invalidation
- Smart cache invalidation on profile updates
- Fallback to server data if cache is corrupted
- Automatic retry on cache miss

## Testing Strategy

### Unit Tests
- Profile data loading and caching
- Photo URL generation and validation
- Error handling scenarios
- Cache invalidation logic

### Integration Tests
- End-to-end profile photo loading
- Cross-component data consistency
- API integration with enhanced profile data
- Session restoration with complete profile

### Visual Tests
- Sidebar appearance with and without photo
- Loading states and error states
- Responsive behavior of profile photo
- Fallback avatar display

## Implementation Details

### API Enhancement
- Modify `/api/auth/me` to return complete profile data
- Update `/api/auth/signin` and `/api/auth/signup` responses
- Add profile photo URL generation logic
- Implement efficient database queries for profile data

### Frontend Integration
- Update AuthServiceV2 to handle complete profile data
- Enhance AuthContext to provide profile photo state
- Modify sidebar component to use profile photo from context
- Add profile photo caching and error handling

### Performance Optimization
- Lazy loading of non-critical profile data
- Image optimization and caching
- Efficient re-rendering when profile data changes
- Memory management for cached profile data

## Migration Strategy

### Backward Compatibility
- Maintain existing User interface
- Extend with optional profile fields
- Graceful degradation if enhanced data unavailable

### Rollout Plan
1. Enhance API endpoints with complete profile data
2. Update AuthServiceV2 to handle enhanced data
3. Modify AuthContext to provide profile photo state
4. Update sidebar component to use profile photo
5. Add error handling and fallback mechanisms
6. Implement caching and performance optimizations

### Data Migration
- Ensure existing users without profile photos get default avatars
- Handle missing or corrupted profile photo data
- Migrate any existing profile photo storage to new system