-- Sistema de Anotações para o schema rarcursos
-- Corrigindo tipos de dados para compatibilidade

-- Tabela para armazenar anotações dos usuários
CREATE TABLE IF NOT EXISTS rarcursos.anotacoes_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências para nossas tabelas existentes (corrigindo tipo para UUID)
  usuario_uid UUID NOT NULL REFERENCES rarcursos.users(uid) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES rarcursos.cursos(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES rarcursos.aulas(id) ON DELETE CASCADE,
  
  -- Conteúdo da anotação
  titulo VARCHAR(200),
  conteudo TEXT NOT NULL,
  
  -- Timestamp do vídeo (em segundos) - para anotações em momentos específicos
  timestamp_video INTEGER DEFAULT NULL,
  
  -- Tipo de anotação
  tipo VARCHAR(20) DEFAULT 'nota' CHECK (tipo IN ('nota', 'duvida', 'importante', 'resumo')),
  
  -- Cor/categoria visual
  cor VARCHAR(20) DEFAULT 'azul' CHECK (cor IN ('azul', 'verde', 'amarelo', 'vermelho', 'roxo')),
  
  -- Metadados
  privada BOOLEAN DEFAULT true,
  favorita BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true, -- Seguindo padrão das outras tabelas
  
  -- Timestamps seguindo padrão das outras tabelas
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_anotacoes_usuario_uid ON rarcursos.anotacoes_usuario(usuario_uid);
CREATE INDEX IF NOT EXISTS idx_anotacoes_curso_id ON rarcursos.anotacoes_usuario(curso_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_aula_id ON rarcursos.anotacoes_usuario(aula_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_timestamp ON rarcursos.anotacoes_usuario(timestamp_video);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo ON rarcursos.anotacoes_usuario(tipo);
CREATE INDEX IF NOT EXISTS idx_anotacoes_ativo ON rarcursos.anotacoes_usuario(ativo);

-- Tabela para tags personalizadas (para versão futura)
CREATE TABLE IF NOT EXISTS rarcursos.tags_anotacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_uid UUID NOT NULL REFERENCES rarcursos.users(uid) ON DELETE CASCADE,
  nome VARCHAR(50) NOT NULL,
  cor VARCHAR(20) DEFAULT 'cinza',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_tag UNIQUE(usuario_uid, nome)
);

-- Tabela de relacionamento anotação-tag (para versão futura)
CREATE TABLE IF NOT EXISTS rarcursos.anotacao_tags (
  anotacao_id UUID REFERENCES rarcursos.anotacoes_usuario(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES rarcursos.tags_anotacao(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (anotacao_id, tag_id)
);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION rarcursos.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_anotacoes_usuario_updated_at 
    BEFORE UPDATE ON rarcursos.anotacoes_usuario 
    FOR EACH ROW EXECUTE FUNCTION rarcursos.update_updated_at_column();

CREATE TRIGGER update_tags_anotacao_updated_at 
    BEFORE UPDATE ON rarcursos.tags_anotacao 
    FOR EACH ROW EXECUTE FUNCTION rarcursos.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE rarcursos.anotacoes_usuario IS 'Anotações pessoais dos usuários nas aulas';
COMMENT ON COLUMN rarcursos.anotacoes_usuario.timestamp_video IS 'Momento do vídeo em segundos onde a anotação foi feita';
COMMENT ON COLUMN rarcursos.anotacoes_usuario.tipo IS 'Tipo da anotação: nota, duvida, importante, resumo';
COMMENT ON COLUMN rarcursos.anotacoes_usuario.privada IS 'Se true, apenas o usuário pode ver. Se false, pode ser compartilhada';
