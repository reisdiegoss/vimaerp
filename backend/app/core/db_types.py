from decimal import Decimal
from sqlalchemy.types import TypeDecorator, Integer

class CentsToDecimal(TypeDecorator):
    """
    Tipo SQLAlchemy que armazena Decimal como centavos (INTEGER) no banco,
    mas devolve instâncias de Decimal() para a aplicação.
    Evita arredondamentos de ponto flutuante, seguindo a regra 
    'matemática em centavos', mas mantendo a interface via Decimal na API.
    """
    impl = Integer
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            # Garante a conversão correta para centavos
            return int(Decimal(str(value)) * 100)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            # Devolve o valor como Decimal (reais)
            return Decimal(str(value)) / Decimal("100")
        return value
