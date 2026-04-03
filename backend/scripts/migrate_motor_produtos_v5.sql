-- VimaERP 2.0 - Migration: Motor de Produtos (Grade e Fiscal)
-- Data: 2026-03-31

-- 1. Definições de Atributos (Grade)
CREATE TABLE IF NOT EXISTS atributo_definicoes (
    id VARCHAR(26) PRIMARY KEY,
    tenant_id VARCHAR(26) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_atributo_def_tenant ON atributo_definicoes(tenant_id);

-- 2. Relacionamento Categoria x Atributos
CREATE TABLE IF NOT EXISTS categoria_atributos (
    categoria_id VARCHAR(26) NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    atributo_definicao_id VARCHAR(26) NOT NULL REFERENCES atributo_definicoes(id) ON DELETE CASCADE,
    PRIMARY KEY (categoria_id, atributo_definicao_id)
);

-- 3. Tabelas Fiscais Globais (NCM e CEST)
CREATE TABLE IF NOT EXISTS fiscal_ncm (
    codigo VARCHAR(8) PRIMARY KEY,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fiscal_cest (
    codigo VARCHAR(7) PRIMARY KEY,
    ncm VARCHAR(8), -- Pode ser nulo se for genérico, mas idealmente vinculado
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ncm_codigo ON fiscal_ncm(codigo);
CREATE INDEX IF NOT EXISTS idx_cest_codigo ON fiscal_cest(codigo);
