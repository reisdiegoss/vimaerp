# VimaERP Models — Import centralizado para resolver relationships do SQLAlchemy
from app.models.base import Base  # noqa: F401

# Domínio: Core
from app.models.tenant import Tenant  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.filial import Filial  # noqa: F401

# Domínio: Produtos & Estoque
# Domínio: Produtos & Estoque
from app.models.categoria import Categoria  # noqa: F401
from app.models.produto import Produto  # noqa: F401
from app.models.produto_variacao import ProdutoVariacao # noqa: F401
from app.models.ficha_tecnica import FichaTecnica # noqa: F401
from app.models.estoque_lote import EstoqueLote  # noqa: F401
from app.models.unidade_medida import UnidadeMedida  # noqa: F401
from app.models.movimentacao_estoque import MovimentacaoEstoque  # noqa: F401

# Domínio: Vendas & PDV
from app.models.caixa_sessao import CaixaSessao  # noqa: F401
from app.models.venda import Venda  # noqa: F401
from app.models.venda_item import VendaItem  # noqa: F401

# Domínio: Pessoas
from app.models.pessoa import Pessoa  # noqa: F401

# Domínio: Financeiro
from app.models.cobranca import Cobranca  # noqa: F401
from app.models.financeiro import ContaBancaria, CategoriaFinanceira, LancamentoFinanceiro  # noqa: F401

# Domínio: Fiscal
from app.models.nota_fiscal import NotaFiscal  # noqa: F401
from app.models.certificado_filial import CertificadoFilial  # noqa: F401

# Domínio: Ordem de Serviço
from app.models.ordem_servico import OrdemServico  # noqa: F401
from app.models.ordem_servico_item import OrdemServicoItem  # noqa: F401

# Domínio: RBAC
from app.models.rbac import Role, Permission, PasswordResetToken  # noqa: F401
from app.models.rbac import filial_user, role_has_permissions  # noqa: F401
from app.models.rbac import model_has_roles, model_has_permissions  # noqa: F401
