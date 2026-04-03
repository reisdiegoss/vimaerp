import re

path = r'c:\Users\Diego Reis\Documents\DEV\VimaERP\frontend\src\features\cadastros\components\ProdutoFormSheet.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remover 'fieldState' e 'error' dos FiscalAutocomplete
# Padrao: render={({ field, fieldState }) => ( <FiscalAutocomplete ... error={fieldState.error?.message} /> )}
pattern_fiscal = r'render=\{\s*\(\{\s*field,\s*fieldState\s*\}\)\s*=>\s*\(\s*<FiscalAutocomplete([\s\S]*?)error=\{fieldState\.error\?\.message\}\s*\/>\s*\)\s*\}'
replacement_fiscal = r'render={({ field }) => ( <FiscalAutocomplete\1/> )}'
content = re.sub(pattern_fiscal, replacement_fiscal, content)

# 2. Refinar tabHasErrors para ser mais resiliente
# Se houver algo no schema que ainda esta disparando erro, vamos garantir que campos vazios opcionais nao contem
# Mas o ideal e o schema estar certo (ja refinei o schema com preprocess)

# 3. Remover mensagens de erro locais que sobraram nos campos obrigatorios
# Padrao: {fieldState.error && <p ...>{fieldState.error.message}</p>}
pattern_msg = r'\{fieldState\.error\s*&&\s*<p class[^>]*?>\{fieldState\.error\.message\}</p>\}'
content = re.sub(pattern_msg, '', content)

# 4. Remover bordas vermelhas que sobraram
# Padrao: fieldState.error ? 'border-rose-500' : 'border-transparent'
pattern_border = r'fieldState\.error\s*\?\s*\'border-rose-500\'\s*:\s*\'border-transparent\''
content = re.sub(pattern_border, "'border-transparent'", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Sucesso: Limpeza de UI e componentes fiscais concluida.")
