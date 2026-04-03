"""
VimaERP 2.0 - Segurança: Criptografia Simétrica (Fernet).
Usado para proteger chaves de API externas (ex: Asaas) no banco de dados.
"""

from cryptography.fernet import Fernet
from app.core.config import settings

# Chave de derivação para Fernet (deve ser 32 bytes base64)
# Em produção, deve vir do .env
_key = settings.FERNET_KEY.encode()

# Se a chave for apenas um placeholder, geramos uma temporária para não quebrar o dev
# Mas o ideal é que o usuário configure o .env corretamente.
try:
    _cipher_suite = Fernet(_key)
except ValueError:
    # Fallback apenas para desenvolvimento se a chave no .env for inválida
    import base64
    import hashlib
    # Derivamos uma chave válida a partir da string curta para evitar crash
    key_32bytes = base64.urlsafe_b64encode(hashlib.sha256(_key).digest())
    _cipher_suite = Fernet(key_32bytes)

def encrypt_value(value: str) -> str:
    """Criptografa uma string e retorna o hash base64."""
    if not value:
        return ""
    encrypted_text = _cipher_suite.encrypt(value.encode())
    return encrypted_text.decode()

def decrypt_value(encrypted_value: str) -> str:
    """Descriptografa uma string base64 original."""
    if not encrypted_value:
        return ""
    try:
        decrypted_text = _cipher_suite.decrypt(encrypted_value.encode())
        return decrypted_text.decode()
    except Exception:
        # Se falhar (ex: troca de chave), retorna vazio para segurança
        return ""
