-- VimaERP 2.0 - Migration: Hyper-Produto Master v2
-- Adicao de campos técnicos, fiscais, logísticos e e-commerce.

-- 1. Tabela de Unidades de Medida
CREATE TABLE IF NOT EXISTS unidades_medida (
    id VARCHAR(26) PRIMARY KEY,
    tenant_id VARCHAR(26) NOT NULL,
    sigla VARCHAR(10) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    padrao_sefaz BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Expansao da Tabela de Produtos
ALTER TABLE produtos 
    -- Dados Gerais / Identificacao
    ADD COLUMN IF NOT EXISTS nome_tecnico VARCHAR(255),
    ADD COLUMN IF NOT EXISTS unidade_comercial_id VARCHAR(26) REFERENCES unidades_medida(id),
    ADD COLUMN IF NOT EXISTS unidade_tributaria_id VARCHAR(26) REFERENCES unidades_medida(id),
    ADD COLUMN IF NOT EXISTS fator_conversao DECIMAL(18,6) DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS peso_bruto DECIMAL(18,4) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS peso_liquido DECIMAL(18,4) DEFAULT 0.0,
    
    -- Venda / Precificacao
    ADD COLUMN IF NOT EXISTS preco_minimo INTEGER DEFAULT 0, -- centavos
    ADD COLUMN IF NOT EXISTS preco_custo_medio INTEGER DEFAULT 0, -- centavos
    ADD COLUMN IF NOT EXISTS margem_lucro DECIMAL(18,2) DEFAULT 0.0,
    
    -- Fiscal / Tributario
    ADD COLUMN IF NOT EXISTS cfop_padrao VARCHAR(10),
    ADD COLUMN IF NOT EXISTS grupo_imposto_id VARCHAR(26), -- Relacionamento futuro com regras fiscais
    
    -- Logistica / Estoque
    ADD COLUMN IF NOT EXISTS estoque_minimo DECIMAL(18,4) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS estoque_maximo DECIMAL(18,4) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS localizacao_fisica VARCHAR(255),
    ADD COLUMN IF NOT EXISTS altura DECIMAL(18,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS largura DECIMAL(18,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS comprimento DECIMAL(18,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS cross_docking_dias INTEGER DEFAULT 0,
    
    -- E-commerce / Marketing
    ADD COLUMN IF NOT EXISTS descricao_detalhada TEXT,
    ADD COLUMN IF NOT EXISTS link_video_youtube VARCHAR(255),
    ADD COLUMN IF NOT EXISTS link_externo VARCHAR(255),
    
    -- Fornecedores / Garantia
    ADD COLUMN IF NOT EXISTS fornecedor_padrao_id VARCHAR(26) REFERENCES pessoas(id),
    ADD COLUMN IF NOT EXISTS codigo_referencia_fornecedor VARCHAR(100),
    ADD COLUMN IF NOT EXISTS garantia_meses INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;

-- 3. Inserir Unidades Padrao (SEFAZ)
INSERT INTO unidades_medida (id, tenant_id, sigla, nome, padrao_sefaz) VALUES
('01JNBW6B8MZH9Y8MZM5Q5Q5Q51', 'SISTEMA', 'UN', 'UNIDADE', TRUE),
('01JNBW6B8MZH9Y8MZM5Q5Q5Q52', 'SISTEMA', 'KG', 'QUILOGRAMA', TRUE),
('01JNBW6B8MZH9Y8MZM5Q5Q5Q53', 'SISTEMA', 'MT', 'METRO', TRUE),
('01JNBW6B8MZH9Y8MZM5Q5Q5Q54', 'SISTEMA', 'CX', 'CAIXA', TRUE),
('01JNBW6B8MZH9Y8MZM5Q5Q5Q55', 'SISTEMA', 'LT', 'LITRO', TRUE),
('01JNBW6B8MZH9Y8MZM5Q5Q5Q56', 'SISTEMA', 'PC', 'PECA', TRUE)
ON CONFLICT DO NOTHING;
