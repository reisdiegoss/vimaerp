import pandas as pd
import re
import io
from sqlalchemy import text
from app.core.database import engine

class FiscalService:
    @staticmethod
    def sanitizar_codigo(codigo: str) -> str:
        """Remove qualquer caractere não numérico para manter apenas os dígitos."""
        if not codigo or pd.isna(codigo):
            return ""
        # Remove pontos, traços, barras e espaços
        return re.sub(r'[^0-9]', '', str(codigo))

    @staticmethod
    async def processar_importacao(
        file_content: bytes, 
        file_ext: str, 
        tipo: str, 
        mapeamento: dict
    ) -> dict:
        """
        Processa NCM, CEST ou CFOP a partir de um DataFrame Pandas.
        mapeamento = {"codigo": "Nome Na Planilha", "descricao": "Outro Nome"}
        """
        try:
            # Ler o arquivo conforme a extensão
            if file_ext == "csv":
                # Tenta detectar separador automaticamente
                df = pd.read_csv(io.BytesIO(file_content), sep=None, engine='python')
            elif file_ext in ["xls", "xlsx"]:
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                return {"error": f"Extensão '{file_ext}' não suportada."}

            col_cod = mapeamento.get("codigo")
            col_desc = mapeamento.get("descricao")
            col_ncm = mapeamento.get("ncm")

            if col_cod not in df.columns or col_desc not in df.columns:
                return {"error": f"Colunas '{col_cod}' ou '{col_desc}' não encontradas no arquivo. Colunas disponíveis: {list(df.columns)}"}
            
            if tipo.upper() == "CEST" and col_ncm and col_ncm not in df.columns:
                return {"error": f"Coluna NCM '{col_ncm}' não encontrada."}

            novos = 0
            atualizados = 0
            erros = 0

            # Determinar a tabela destino
            tipo_map = {
                "NCM": "fiscal_ncm",
                "CEST": "fiscal_cest",
                "CFOP": "fiscal_cfop"
            }
            tabela = tipo_map.get(tipo.upper(), f"fiscal_{tipo.lower()}")
            
            async with engine.begin() as conn:
                if tabela == "fiscal_cest":
                    # --- PRE-PROCESSAMENTO DE CEST ---
                    # 1. Forward Fill: preenche codigos CEST vazios com o anterior (celulas mescladas/linhas multiplas)
                    df[col_cod] = df[col_cod].ffill()
                    
                    cest_dict = {}
                    for _, row in df.iterrows():
                        cod_bruto = str(row.get(col_cod, ""))
                        cod_limpo = FiscalService.sanitizar_codigo(cod_bruto)[:7]
                        desc = str(row.get(col_desc, "")).strip()

                        if not cod_limpo or cod_limpo == "":
                            continue
                        
                        if cod_limpo not in cest_dict:
                            cest_dict[cod_limpo] = {"desc": desc, "ncms": set()}
                        
                        # Se tiver descricao preenchida, atualiza
                        if desc and desc.lower() != "nan":
                            cest_dict[cod_limpo]["desc"] = desc
                            
                        # Extrair multiplos NCMs da string
                        if col_ncm and col_ncm in df.columns:
                            val_ncm = str(row.get(col_ncm, ""))
                            if val_ncm.lower() != "nan" and val_ncm.strip():
                                # Substitui separadores comuns por espaço
                                val_ncm = val_ncm.replace(',', ' ').replace(';', ' ').replace('\n', ' ')
                                for piece in val_ncm.split():
                                    p_limpo = FiscalService.sanitizar_codigo(piece)
                                    if p_limpo: 
                                        cest_dict[cod_limpo]["ncms"].add(p_limpo)
                    
                    # 2. Bulk Insert agrupado (Upsert)
                    for cod_limpo, data in cest_dict.items():
                        try:
                            desc = data["desc"]
                            # Transforma de volta para CSV (Text)
                            ncm_str = ",".join(sorted(data["ncms"])) if data["ncms"] else None
                            
                            query = text(f"""
                                INSERT INTO {tabela} (codigo, descricao, ncm, created_at)
                                VALUES (:c, :d, :n, now())
                                ON CONFLICT (codigo) DO UPDATE 
                                SET descricao = EXCLUDED.descricao, ncm = EXCLUDED.ncm
                                RETURNING (xmax = 0) AS inserido
                            """)
                            params = {"c": cod_limpo, "d": desc, "n": ncm_str}
                            result = await conn.execute(query, params)
                            row_res = result.fetchone()
                            if row_res and row_res[0]: novos += 1
                            else: atualizados += 1
                        except Exception as e:
                            import logging
                            logging.error(f"Erro no CEST {cod_limpo}: {e}")
                            erros += 1

                else:
                    # --- NCM E CFOP (PADRAO) ---
                    for _, row in df.iterrows():
                        try:
                            cod_bruto = str(row[col_cod])
                            cod_limpo = FiscalService.sanitizar_codigo(cod_bruto)
                            desc = str(row[col_desc]).strip()
    
                            if not cod_limpo:
                                continue
    
                            # Limitar os tamanhos para respeitar estritamente o Schema do Banco (VARCHAR)
                            if tabela == "fiscal_ncm":
                                cod_limpo = cod_limpo[:8]
                            elif tabela == "fiscal_cfop":
                                cod_limpo = cod_limpo[:4]
    
                            query = text(f"""
                                INSERT INTO {tabela} (codigo, descricao, created_at)
                                VALUES (:c, :d, now())
                                ON CONFLICT (codigo) DO UPDATE 
                                SET descricao = EXCLUDED.descricao
                                RETURNING (xmax = 0) AS inserido
                            """)
                            params = {"c": cod_limpo, "d": desc}
                            
                            result = await conn.execute(query, params)
                            row_res = result.fetchone()
                            
                            if row_res and row_res[0]:
                                novos += 1
                            else:
                                atualizados += 1
                        except Exception as e:
                            import logging
                            logging.error(f"Erro linha Importacao: {e}")
                            erros += 1

            return {
                "status": "success",
                "novos": novos,
                "atualizados": atualizados,
                "erros": erros,
                "total": len(df)
            }
        except Exception as e:
            return {"error": str(e)}
