import re
import os

path = r'c:\Users\Diego Reis\Documents\DEV\VimaERP\frontend\src\features\cadastros\components\ProdutoFormSheet.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Padrao para o useEffect problemático
new_effect = """  // Carregar dados para edicao (fix)
  useEffect(() => {
    if (isOpen && produtoData && !isSaving) {
      reset({
        ...produtoData,
        tipo_produto: (produtoData.tipo_produto as any) || 'REVENDA',
        nome_tecnico: produtoData.nome_tecnico || '',
        codigo_barras: produtoData.codigo_barras || '',
        cest: produtoData.cest || '',
        cfop_padrao: produtoData.cfop_padrao || '',
        localizacao_fisica: produtoData.localizacao_fisica || '',
        descricao_detalhada: produtoData.descricao_detalhada || '',
        link_video_youtube: produtoData.link_video_youtube || '',
        link_externo: produtoData.link_externo || '',
        fornecedor_padrao_id: produtoData.fornecedor_padrao_id || '',
        codigo_referencia_fornecedor: produtoData.codigo_referencia_fornecedor || '',
        unidade_tributaria_id: produtoData.unidade_tributaria_id || '',
        unidade_comercial_id: produtoData.unidade_comercial_id || '',
        categoria_id: produtoData.categoria_id || '',
        ncm: produtoData.ncm || '',
        preco_venda: produtoData.preco_venda ?? 0,
      } as any);
      console.log('Dados do formulario carregados via fix:', produtoId);
    }
  }, [isOpen, produtoId, !!produtoData]);"""

# Procuro o useEffect que tem 'produtoData' e 'reset' no array de dependencias 
pattern = r'useEffect\(\(\) => \{[\s\S]*?reset\(\{[\s\S]*?\}\s*as\s*any\);[\s\S]*?\},\s*\[produtoData,\s*reset\]\);'

if re.search(pattern, content):
    new_content = re.sub(pattern, new_effect, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Sucesso: useEffect substituido.")
else:
    print("Erro: Padrao nao encontrado.")
