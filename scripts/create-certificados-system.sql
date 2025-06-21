-- Tabela para armazenar os certificados emitidos
CREATE TABLE IF NOT EXISTS rarcursos.certificados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_certificado VARCHAR(50) UNIQUE NOT NULL, -- Número único do certificado
    aluno_id UUID NOT NULL REFERENCES rarcursos.users(uid) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES rarcursos.cursos(id) ON DELETE CASCADE,
    instrutor_id UUID NOT NULL REFERENCES rarcursos.users(uid) ON DELETE CASCADE,
    
    -- Dados do certificado
    nome_aluno VARCHAR(255) NOT NULL,
    titulo_curso VARCHAR(255) NOT NULL,
    descricao_curso TEXT,
    carga_horaria INTEGER NOT NULL, -- em minutos
    data_inicio DATE NOT NULL,
    data_conclusao DATE NOT NULL,
    nota_final DECIMAL(5,2), -- Nota final se houver avaliações
    
    -- Dados de verificação
    hash_verificacao VARCHAR(255) UNIQUE NOT NULL, -- Hash único para verificação
    qr_code_url VARCHAR(500), -- URL do QR Code gerado
    
    -- Status e metadados
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'revogado', 'suspenso')),
    template_usado VARCHAR(50) DEFAULT 'padrao',
    url_certificado VARCHAR(500), -- URL do PDF gerado
    
    -- Timestamps
    emitido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT fk_certificado_aluno FOREIGN KEY (aluno_id) REFERENCES rarcursos.users(uid),
    CONSTRAINT fk_certificado_curso FOREIGN KEY (curso_id) REFERENCES rarcursos.cursos(id),
    CONSTRAINT fk_certificado_instrutor FOREIGN KEY (instrutor_id) REFERENCES rarcursos.users(uid)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_certificados_aluno ON rarcursos.certificados(aluno_id);
CREATE INDEX IF NOT EXISTS idx_certificados_curso ON rarcursos.certificados(curso_id);
CREATE INDEX IF NOT EXISTS idx_certificados_numero ON rarcursos.certificados(numero_certificado);
CREATE INDEX IF NOT EXISTS idx_certificados_hash ON rarcursos.certificados(hash_verificacao);
CREATE INDEX IF NOT EXISTS idx_certificados_status ON rarcursos.certificados(status);

-- Tabela para templates de certificados
CREATE TABLE IF NOT EXISTS rarcursos.templates_certificados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- Configurações do template
    config_json JSONB NOT NULL, -- Configurações de layout, cores, fontes, etc.
    preview_url VARCHAR(500), -- URL da imagem de preview
    
    -- Status
    ativo BOOLEAN DEFAULT true,
    padrao BOOLEAN DEFAULT false, -- Se é o template padrão
    
    -- Timestamps
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir template padrão
INSERT INTO rarcursos.templates_certificados (nome, descricao, config_json, padrao, ativo) VALUES 
(
    'Template Padrão R$antos',
    'Template padrão da Plataforma R$antos com design moderno e profissional',
    '{
        "background": {
            "type": "gradient",
            "colors": ["#1e293b", "#334155", "#475569"],
            "shapes": true
        },
        "header": {
            "logo": true,
            "title": "CERTIFICADO DE CONCLUSÃO",
            "subtitle": "Plataforma R$antos"
        },
        "body": {
            "font": "Inter",
            "textColor": "#1e293b",
            "accentColor": "#6366f1"
        },
        "footer": {
            "signature": true,
            "qrCode": true,
            "verificationText": "Verifique a autenticidade em: https://plataforma-rantos.com/verificar"
        }
    }',
    true,
    true
);

-- Função para gerar número único do certificado
CREATE OR REPLACE FUNCTION rarcursos.gerar_numero_certificado()
RETURNS VARCHAR(50) AS $$
DECLARE
    novo_numero VARCHAR(50);
    contador INTEGER := 1;
    ano_atual VARCHAR(4) := EXTRACT(YEAR FROM NOW())::VARCHAR;
BEGIN
    LOOP
        -- Formato: CERT-2024-000001
        novo_numero := 'CERT-' || ano_atual || '-' || LPAD(contador::VARCHAR, 6, '0');
        
        -- Verificar se já existe
        IF NOT EXISTS (SELECT 1 FROM rarcursos.certificados WHERE numero_certificado = novo_numero) THEN
            RETURN novo_numero;
        END IF;
        
        contador := contador + 1;
        
        -- Evitar loop infinito
        IF contador > 999999 THEN
            RAISE EXCEPTION 'Não foi possível gerar número único para o certificado';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar hash de verificação
CREATE OR REPLACE FUNCTION rarcursos.gerar_hash_verificacao(
    p_numero_certificado VARCHAR(50),
    p_aluno_id UUID,
    p_curso_id UUID,
    p_data_conclusao DATE
)
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN encode(
        digest(
            p_numero_certificado || p_aluno_id::VARCHAR || p_curso_id::VARCHAR || p_data_conclusao::VARCHAR || NOW()::VARCHAR,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION rarcursos.update_certificados_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certificados_timestamp
    BEFORE UPDATE ON rarcursos.certificados
    FOR EACH ROW
    EXECUTE FUNCTION rarcursos.update_certificados_timestamp();

-- Comentários para documentação
COMMENT ON TABLE rarcursos.certificados IS 'Tabela para armazenar certificados emitidos pela plataforma';
COMMENT ON COLUMN rarcursos.certificados.numero_certificado IS 'Número único do certificado no formato CERT-YYYY-NNNNNN';
COMMENT ON COLUMN rarcursos.certificados.hash_verificacao IS 'Hash SHA256 único para verificação de autenticidade';
COMMENT ON COLUMN rarcursos.certificados.carga_horaria IS 'Carga horária do curso em minutos';
COMMENT ON COLUMN rarcursos.certificados.status IS 'Status do certificado: ativo, revogado ou suspenso';
