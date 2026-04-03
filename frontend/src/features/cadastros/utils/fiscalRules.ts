/**
 * VimaERP 2.0 - Regras Fiscais (NT 2016.001)
 * Mapeamento de NCM para Unidade Tributável (uTrib) da SEFAZ.
 */

export const NCM_TRIBUTAVEL_MAP: Record<string, string> = {
  '02': 'KG', // Carnes e miudezas comestíveis
  '04': 'KG', // Laticínios; ovos de aves; mel natural
  '10': 'KG', // Cereais
  '22': 'LT', // Bebidas, líquidos alcoólicos e vinagres
  '30': 'KG', // Produtos farmacêuticos (Muitos usam KG como uTrib base)
  '61': 'UN', // Vestuário e seus acessórios, de malha
  '62': 'UN', // Vestuário e seus acessórios, exceto de malha
  '64': 'PAR', // Calçados, polainas e artigos semelhantes
  '72': 'KG', // Ferro e aço
  '73': 'KG', // Obras de ferro ou aço
  '84': 'UN', // Reatores nucleares, caldeiras, máquinas e aparelhos
  '85': 'UN', // Máquinas, aparelhos e materiais elétricos
};

/**
 * Retorna a Unidade Tributável (uTrib) recomendada pela SEFAZ com base no NCM.
 * @param ncm Código NCM (8 dígitos)
 * @returns Sigla da unidade (KG, UN, LT, etc) ou null se não mapeado.
 */
export const getUnidadeTributavel = (ncm: string | undefined): string | null => {
  if (!ncm || ncm.length < 2) return null;
  const prefix = ncm.substring(0, 2);
  return NCM_TRIBUTAVEL_MAP[prefix] || null;
};
