# Relatório de Auditoria - Fluxo de Dados do Usuário

## 🔍 **Problema Identificado**

**Inconsistência crítica:** Sidebar mostra "Flavio Guardia - Admin" enquanto página de perfil mostra "Flávio Marcelo Guardia - Aluno"

## 📊 **Mapeamento Completo do Fluxo de Dados**

### **1. Fontes de Dados Identificadas**

#### **A. UserStateManager** (`lib/user-state-manager.ts`)
- **Função:** Fonte única de verdade (implementado recentemente)
- **Estado:** Singleton com cache interno
- **Métodos principais:**
  - `getCurrentUser()` - Retorna usuário atual
  - `refreshUser()` - Recarrega do servidor
  - `subscribe()` - Sistema de notificações

#### **B. AuthContext** (`contexts/auth-context.tsx`)
- **Função:** Provedor de contexto React
- **Implementação:** Usa UserStateManager via subscription
- **Estado:** `user`, `isLoading`, `isAuthenticated`

#### **C. auth-client** (`lib/auth-client.ts`)
- **Função:** Cliente de autenticação (legacy)
- **Métodos:** `getCurrentClientUser()`, `ensureUserLoaded()`
- **Status:** Ainda usado em alguns lugares

### **2. Componentes que Consomem Dados**

#### **A. DashboardSidebar** (`app/dashboard/components/dashboard-sidebar.tsx`)
```typescript
// IMPLEMENTAÇÃO ATUAL:
const { user } = useAuth() // ✅ Usa AuthContext
// Deveria receber dados do UserStateManager via AuthContext
```

#### **B. Página de Perfil** (`app/perfil/page.tsx`)
```typescript
// IMPLEMENTAÇÃO ATUAL:
const { user } = useAuth() // ✅ Usa AuthContext
const freshUserData = await getUserFreshData(currentUser.uid) // ❌ Busca direto do servidor
```

#### **C. DashboardLayout** (`components/dashboard-layout.tsx`)
```typescript
// IMPLEMENTAÇÃO ATUAL:
const { user } = useAuth() // ✅ Usa AuthContext
<DashboardSidebar user={user} /> // ✅ Passa dados via props
```

## 🚨 **Problemas Identificados**

### **1. Múltiplas Fontes de Dados**
- **AuthContext:** Via UserStateManager (dados cached)
- **Página de Perfil:** Via `getUserFreshData()` (dados frescos do servidor)
- **Resultado:** Dados diferentes sendo exibidos

### **2. Cache Desatualizado**
- UserStateManager pode ter dados antigos em cache
- Página de perfil sempre busca dados frescos
- Não há sincronização entre as fontes

### **3. Inicialização Problemática**
```typescript
// AuthContext inicialização:
if (!userStateManager.isCacheValid()) {
  userStateManager.refreshUser() // ❌ Pode não estar funcionando
} else {
  const currentUser = userStateManager.getCurrentUser() // ❌ Pode retornar dados antigos
}
```

### **4. Falta de Validação**
- Não há verificação se dados estão consistentes
- Não há detecção automática de inconsistências
- Não há logs para debug

## 🔄 **Fluxo Atual Mapeado**

### **Cenário 1: Carregamento Inicial**
```
1. AuthProvider inicializa
2. Verifica se UserStateManager.isCacheValid()
3. Se válido: usa getCurrentUser() (DADOS ANTIGOS)
4. Se inválido: chama refreshUser() (pode falhar silenciosamente)
5. DashboardSidebar recebe dados via useAuth()
6. Página de Perfil chama getUserFreshData() independentemente
```

### **Cenário 2: Mudança de Perfil por Admin**
```
1. Admin altera perfil na administração
2. userStateManager.invalidateUserCache() é chamado
3. UserStateManager deveria fazer refresh automático
4. AuthContext deveria receber notificação
5. DashboardSidebar deveria atualizar automaticamente
❌ FALHA: Algum passo não está funcionando
```

## 🎯 **Causas Prováveis da Inconsistência**

### **1. UserStateManager não está funcionando corretamente**
- Cache pode não estar sendo invalidado
- Refresh pode estar falhando silenciosamente
- Subscription pode não estar propagando mudanças

### **2. Dados antigos persistindo**
- Cache do navegador
- Estado local não limpo
- Múltiplas instâncias de dados

### **3. Timing de inicialização**
- UserStateManager pode não estar pronto quando AuthContext inicializa
- Race condition entre cache e dados frescos

### **4. Falha na propagação de eventos**
- Subscription pode não estar ativa
- Eventos podem não estar sendo disparados
- Listeners podem não estar funcionando

## 📋 **Componentes que Precisam de Investigação**

### **Alta Prioridade:**
1. **UserStateManager** - Verificar se está funcionando
2. **AuthContext** - Validar subscription
3. **DashboardSidebar** - Confirmar fonte de dados
4. **getUserFreshData()** - Entender por que busca dados diferentes

### **Média Prioridade:**
1. **Cache management** - Verificar invalidação
2. **Event propagation** - Testar notificações
3. **Error handling** - Verificar falhas silenciosas

## 🔧 **Próximas Ações Recomendadas**

### **Imediatas:**
1. **Debug do UserStateManager** - Verificar estado atual
2. **Teste de subscription** - Validar se AuthContext recebe atualizações
3. **Comparação de dados** - Verificar diferenças entre fontes

### **Implementação:**
1. **Data Consistency Validator** - Detectar inconsistências
2. **Enhanced logging** - Rastrear fluxo de dados
3. **Auto-correction** - Corrigir inconsistências automaticamente

## 📊 **Métricas de Consistência**

### **Estado Atual:**
- **Consistência:** 0% (dados completamente diferentes)
- **Detecção:** Manual (usuário precisa reportar)
- **Correção:** Manual (recarregar página)

### **Meta:**
- **Consistência:** 99.9%
- **Detecção:** Automática (< 5 segundos)
- **Correção:** Automática (< 2 segundos)

---

**Status:** 🚨 Problema crítico identificado - Requer correção imediata
**Próximo passo:** Implementar Data Consistency Validator para diagnóstico detalhado