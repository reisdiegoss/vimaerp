"""
VimaERP 2.0 - BaseActiveRecord: Abstração Active Record sobre SQLAlchemy 2.0 Async.

██████████████████████████████████████████████████████████████
█  REGRA DE OURO: Toda model herda de BaseActiveRecord.     █
█  Métodos: save(), delete(), find(), where(), all()        █
█  Injeção automática de tenant_id em TODAS as queries.     █
██████████████████████████████████████████████████████████████

Uso:
    produto = await Produto.find(42)          # SELECT ... WHERE id=42 AND tenant_id=?
    produto.preco = Decimal("19.90")
    await produto.save()                       # UPDATE ...

    novos = await Produto.where(ativo=True)   # SELECT ... WHERE ativo=true AND tenant_id=?
    await Produto.delete_by_id(42)            # DELETE ... WHERE id=42 AND tenant_id=?
"""

from __future__ import annotations

from typing import Any, Optional, Sequence, TypeVar, Type

from sqlalchemy import select, delete as sa_delete, inspect, String
from sqlalchemy.ext.asyncio import AsyncSession
import ulid

from app.core.database import AsyncSessionFactory
from app.core.middleware import get_tenant_id, get_filial_id
from app.models.base import Base

T = TypeVar("T", bound="BaseActiveRecord")


class BaseActiveRecord(Base):
    """
    Classe abstrata que implementa o padrão Active Record.
    Todas as models de domínio DEVEM herdar desta classe.
    """

    __abstract__ = True

    # ──────────────────────────────────────────
    # Helpers internos
    # ──────────────────────────────────────────

    @classmethod
    def _inject_tenant_filter(cls, stmt: Any) -> Any:
        """
        Injeta WHERE tenant_id = ? e filial_id = ? automaticamente se a model
        possuir as colunas e houver valores no contexto.
        """
        mapper = inspect(cls)
        columns = {col.key for col in mapper.columns}

        # 1. Tenant ID (Obrigatório em 99% das tabelas)
        tenant_id = get_tenant_id()
        if tenant_id is not None and "tenant_id" in columns:
            stmt = stmt.where(cls.tenant_id == tenant_id)  # type: ignore[attr-defined]

        # 2. Filial ID (Se a tabela for segmentada por unidade)
        if "filial_id" in columns:
            filial_id = get_filial_id()
            if filial_id is not None:
                stmt = stmt.where(cls.filial_id == filial_id)  # type: ignore[attr-defined]
            else:
                # █ SEGURANCA: Se a model exige filial mas o contexto esta vazio, 
                # █ forçamos um filtro que não retorna nada para evitar vazamento do Tenant.
                stmt = stmt.where(cls.filial_id == "FILIAL_NAO_SELECIONADA") # type: ignore[attr-defined]

        return stmt

    @classmethod
    def _get_session_factory(cls):
        """Retorna a session factory padrão."""
        return AsyncSessionFactory

    # ──────────────────────────────────────────
    # CRUD: find (por PK)
    # ──────────────────────────────────────────

    @classmethod
    async def find(
        cls: Type[T],
        id: Any,
        session: AsyncSession | None = None,
        db: AsyncSession | None = None,
    ) -> Optional[T]:
        """
        Busca um registro pelo ID (primary key).
        Injeta tenant_id automaticamente.

        Uso:
            produto = await Produto.find(42)
        """
        async def _execute(s: AsyncSession) -> Optional[T]:
            stmt = select(cls).where(cls.id == id)  # type: ignore[attr-defined]
            stmt = cls._inject_tenant_filter(stmt)
            result = await s.execute(stmt)
            return result.scalar_one_or_none()

        _s = session or db
        if _s:
            return await _execute(_s)

        async with cls._get_session_factory()() as s:
            return await _execute(s)

    # ──────────────────────────────────────────
    # CRUD: where (filtros)
    # ──────────────────────────────────────────

    @classmethod
    async def where(
        cls: Type[T],
        session: AsyncSession | None = None,
        db: AsyncSession | None = None,
        limit: int = 100,
        offset: int = 0,
        **filters: Any,
    ) -> Sequence[T]:
        """
        Busca registros com filtros de igualdade.
        Injeta tenant_id automaticamente.

        Uso:
            ativos = await Produto.where(ativo=True)
            lote = await EstoqueLote.where(produto_id=5, filial_id=1)
        """
        async def _execute(s: AsyncSession) -> Sequence[T]:
            stmt = select(cls)
            for key, value in filters.items():
                stmt = stmt.where(getattr(cls, key) == value)
            stmt = cls._inject_tenant_filter(stmt)
            stmt = stmt.limit(limit).offset(offset)
            result = await s.execute(stmt)
            return result.scalars().all()

        _s = session or db
        if _s:
            return await _execute(_s)

        async with cls._get_session_factory()() as s:
            return await _execute(s)

    # ──────────────────────────────────────────
    # CRUD: all
    # ──────────────────────────────────────────

    @classmethod
    async def all(
        cls: Type[T],
        session: AsyncSession | None = None,
        db: AsyncSession | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[T]:
        """
        Retorna todos os registros (com paginação).
        Injeta tenant_id automaticamente.

        Uso:
            produtos = await Produto.all(limit=50, offset=0)
        """
        async def _execute(s: AsyncSession) -> Sequence[T]:
            stmt = select(cls)
            stmt = cls._inject_tenant_filter(stmt)
            stmt = stmt.limit(limit).offset(offset)
            result = await s.execute(stmt)
            return result.scalars().all()

        _s = session or db
        if _s:
            return await _execute(_s)

        async with cls._get_session_factory()() as s:
            return await _execute(s)

    # ──────────────────────────────────────────
    # CRUD: save (INSERT ou UPDATE)
    # ──────────────────────────────────────────

    def _generate_ulid(self) -> str:
        """Gera um ULID de 26 caracteres (Síncrono)."""
        return str(ulid.ULID())

    async def _generate_smart_code(self, s: AsyncSession) -> Optional[str]:
        """
        Gera o código de negócio baseado na filial e entidade.
        Ex: Categoria na Filial 1 -> CT000001
        """
        from sqlalchemy import text
        
        # 1. Identificar a entidade (nome da tabela/model)
        entidade = self.__class__.__name__.lower()
        filial_id = get_filial_id()
        tenant_id = get_tenant_id()
        
        if not filial_id or not tenant_id:
            return None

        # 2. Buscar o prefixo da filial
        # Fazemos query manual para evitar circular import de Filial
        stmt_filial = text("SELECT prefixo_categoria, prefixo_produto, prefixo_pessoa, prefixo_venda, prefixo_os FROM filiais WHERE id = :id")
        res_filial = await s.execute(stmt_filial, {"id": filial_id})
        filial_row = res_filial.fetchone()
        
        if not filial_row:
            return None

        # Mapeamento simples de entidade -> campo de prefixo
        prefixos = {
            "categoria": filial_row[0] or "CT",
            "produto": filial_row[1] or "P",
            "pessoa": filial_row[2] or "C",
            "venda": filial_row[3] or "V",
            "ordemservico": filial_row[4] or "OS"
        }
        prefixo = prefixos.get(entidade, "IND") # IND de Indefinido se não mapeado

        # 3. Buscar/Incrementar o Sequenciador
        # Usamos SELECT FOR UPDATE para evitar race conditions no código sequencial
        # Desativamos o autoflush explicitamente para evitar FlushError
        with s.no_autoflush:
            stmt_seq = text("SELECT ultimo_numero FROM sequenciadores WHERE tenant_id = :tid AND filial_id = :fid AND entidade = :ent FOR UPDATE")
            res_seq = await s.execute(stmt_seq, {"tid": tenant_id, "fid": filial_id, "ent": entidade})
            row_seq = res_seq.fetchone()
    
            novo_numero = 1
            if row_seq:
                novo_numero = row_seq[0] + 1
                await s.execute(
                    text("UPDATE sequenciadores SET ultimo_numero = :num WHERE tenant_id = :tid AND filial_id = :fid AND entidade = :ent"),
                    {"num": novo_numero, "tid": tenant_id, "fid": filial_id, "ent": entidade}
                )
            else:
                # Primeiro registro desta entidade na filial
                await s.execute(
                    text("INSERT INTO sequenciadores (tenant_id, filial_id, entidade, ultimo_numero) VALUES (:tid, :fid, :ent, :num)"),
                    {"tid": tenant_id, "fid": filial_id, "ent": entidade, "num": novo_numero}
                )

        # 4. Formata o código (Ex: CT000001)
        return f"{prefixo}{str(novo_numero).zfill(6)}"

    async def save(self, session: AsyncSession | None = None, db: AsyncSession | None = None) -> None:
        """
        Salva o registro no banco (INSERT se novo, UPDATE se existente).
        Injeta tenant_id, filial_id, id (ULID) e código de negócio automaticamente.
        """
        async def _apply_injections(s: AsyncSession):
            state = inspect(self)
            if state.pending or state.transient:
                mapper = inspect(self.__class__)
                columns = {col.key for col in mapper.columns}

                # Injeção de Segurança (Tenant/Filial)
                tenant_id = get_tenant_id()
                if tenant_id is not None and "tenant_id" in columns:
                    if getattr(self, "tenant_id", None) is None:
                        self.tenant_id = tenant_id

                filial_id = get_filial_id()
                if filial_id is not None and "filial_id" in columns:
                    if getattr(self, "filial_id", None) is None:
                        self.filial_id = filial_id

                # Injeção de ID Técnico (ULID) se for String(26)
                if "id" in columns and getattr(self, "id", None) is None:
                    # Verifica se o ID é do tipo String
                    if isinstance(mapper.columns["id"].type, (String, type(String))):
                        self.id = self._generate_ulid()

                # Injeção de Código de Negócio (ex: CT0001)
                if "codigo" in columns and getattr(self, "codigo", None) is None:
                    self.codigo = await self._generate_smart_code(s)

        async def _execute(s: AsyncSession) -> None:
            await _apply_injections(s)
            s.add(self)
            await s.commit()
            await s.refresh(self)

        _s = session or db
        if _s:
            await _apply_injections(_s)
            _s.add(self)
            await _s.flush()
            return

        async with self._get_session_factory()() as s:
            await _execute(s)

    # ──────────────────────────────────────────
    # CRUD: delete
    # ──────────────────────────────────────────

    async def delete(self, session: AsyncSession | None = None, db: AsyncSession | None = None) -> None:
        """
        Remove o registro do banco.

        Uso:
            produto = await Produto.find(42)
            await produto.delete()
        """
        async def _execute(s: AsyncSession) -> None:
            await s.delete(self)
            await s.commit()

        _s = session or db
        if _s:
            await _s.delete(self)
            await _s.flush()
            return

        async with self._get_session_factory()() as s:
            merged = await s.merge(self)
            await s.delete(merged)
            await s.commit()

    @classmethod
    async def delete_by_id(
        cls: Type[T],
        id: Any,
        session: AsyncSession | None = None,
        db: AsyncSession | None = None,
    ) -> None:
        """
        Remove um registro pelo ID.
        Injeta tenant_id automaticamente.

        Uso:
            await Produto.delete_by_id(42)
        """
        async def _execute(s: AsyncSession) -> None:
            stmt = sa_delete(cls).where(cls.id == id)  # type: ignore[attr-defined]
            stmt = cls._inject_tenant_filter(stmt)
            await s.execute(stmt)
            await s.commit()

        _s = session or db
        if _s:
            stmt = sa_delete(cls).where(cls.id == id)  # type: ignore[attr-defined]
            stmt = cls._inject_tenant_filter(stmt)
            await _s.execute(stmt)
            await _s.flush()
            return

        async with cls._get_session_factory()() as s:
            await _execute(s)

    # ──────────────────────────────────────────
    # CRUD: count
    # ──────────────────────────────────────────

    @classmethod
    async def count(
        cls: Type[T],
        session: AsyncSession | None = None,
        db: AsyncSession | None = None,
        **filters: Any,
    ) -> int:
        """
        Conta registros com filtros opcionais.
        Injeta tenant_id automaticamente.

        Uso:
            total = await Produto.count(ativo=True)
        """
        from sqlalchemy import func

        async def _execute(s: AsyncSession) -> int:
            stmt = select(func.count()).select_from(cls)
            for key, value in filters.items():
                stmt = stmt.where(getattr(cls, key) == value)
            stmt = cls._inject_tenant_filter(stmt)
            result = await s.execute(stmt)
            return result.scalar_one()

        _s = session or db
        if _s:
            return await _execute(_s)

        async with cls._get_session_factory()() as s:
            return await _execute(s)

    # ──────────────────────────────────────────
    # CRUD: first
    # ──────────────────────────────────────────

    @classmethod
    async def first(
        cls: Type[T],
        session: AsyncSession | None = None,
        db: AsyncSession | None = None,
        **filters: Any,
    ) -> Optional[T]:
        """
        Retorna o primeiro registro que atende aos filtros.

        Uso:
            admin = await User.first(email="admin@vima.com")
        """
        async def _execute(s: AsyncSession) -> Optional[T]:
            stmt = select(cls)
            for key, value in filters.items():
                stmt = stmt.where(getattr(cls, key) == value)
            stmt = cls._inject_tenant_filter(stmt)
            stmt = stmt.limit(1)
            result = await s.execute(stmt)
            return result.scalar_one_or_none()

        _s = session or db
        if _s:
            return await _execute(_s)

        async with cls._get_session_factory()() as s:
            return await _execute(s)
