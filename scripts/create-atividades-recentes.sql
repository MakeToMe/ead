-- Criação da tabela de atividades recentes
CREATE TABLE IF NOT EXISTS rarcursos.atividades_recentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_uid UUID NOT NULL REFERENCES rarcursos.users(uid),
    tipo_atividade VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    cor_icone VARCHAR(50),
    entidade_tipo VARCHAR(50), -- 'aula', 'curso', 'modulo', 'certificado', etc.
    entidade_id UUID, -- ID da entidade relacionada
    url VARCHAR(255), -- URL para navegação direta
    metadados JSONB, -- Dados adicionais específicos do tipo de atividade
    visualizada BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_atividades_recentes_usuario ON rarcursos.atividades_recentes(usuario_uid);
CREATE INDEX IF NOT EXISTS idx_atividades_recentes_tipo ON rarcursos.atividades_recentes(tipo_atividade);
CREATE INDEX IF NOT EXISTS idx_atividades_recentes_entidade ON rarcursos.atividades_recentes(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_atividades_recentes_criado_em ON rarcursos.atividades_recentes(criado_em DESC);

-- Trigger para atualizar o campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION rarcursos.update_atividades_recentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_atividades_recentes_updated_at
BEFORE UPDATE ON rarcursos.atividades_recentes
FOR EACH ROW
EXECUTE FUNCTION rarcursos.update_atividades_recentes_updated_at();

-- Inserir alguns tipos de atividades comuns para referência
INSERT INTO rarcursos.atividades_recentes (
    usuario_uid,
    tipo_atividade,
    titulo,
    descricao,
    icone,
    cor_icone,
    entidade_tipo,
    entidade_id,
    url
) VALUES 
-- Exemplo: assistiu aula
(
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID de um usuário real
    'assistiu_aula',
    'Assistiu uma aula',
    'Você assistiu a aula "Introdução ao JavaScript"',
    'play-circle',
    'indigo',
    'aula',
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID de uma aula real
    '/assistir-curso/00000000-0000-0000-0000-000000000000' -- URL para a aula
),
-- Exemplo: concluiu curso
(
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID de um usuário real
    'concluiu_curso',
    'Concluiu um curso',
    'Você concluiu o curso "JavaScript Avançado"',
    'check-circle',
    'green',
    'curso',
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID de um curso real
    '/meus-cursos/00000000-0000-0000-0000-000000000000' -- URL para o curso
),
-- Exemplo: recebeu certificado
(
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID de um usuário real
    'recebeu_certificado',
    'Recebeu um certificado',
    'Você recebeu o certificado do curso "React Fundamentals"',
    'award',
    'amber',
    'certificado',
    '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID de um certificado real
    '/certificados/00000000-0000-0000-0000-000000000000' -- URL para o certificado
);

-- Comentário: Remova os exemplos acima em produção ou substitua pelos IDs reais
