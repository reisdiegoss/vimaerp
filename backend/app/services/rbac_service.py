"""
VimaERP 2.0 - Service: RBAC.
Gerenciamento de roles e permissions baseado nas tabelas do Spatie.
Status: Migrado para ULID (String(26)).
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from ulid import ULID

from app.schemas.rbac import UserPermissionsResponse


class RbacService:
    """Service para operações de RBAC (Spatie-compatible)."""

    @staticmethod
    async def assign_role(
        db: AsyncSession,
        user_id: str,
        role_id: str,
    ) -> None:
        """
        Atribui uma role a um usuário.
        Insere em model_has_roles (compatível com Spatie).
        """
        # Verificar se já tem a role
        existing = await db.execute(
            text("""
                SELECT 1 FROM model_has_roles
                WHERE role_id = :role_id
                AND model_type = 'App\\Models\\User'
                AND model_id = :model_id
            """),
            {"role_id": role_id, "model_id": user_id},
        )
        if existing.scalar():
            return  # Já tem a role

        await db.execute(
            text("""
                INSERT INTO model_has_roles (role_id, model_type, model_id)
                VALUES (:role_id, 'App\\Models\\User', :model_id)
            """),
            {"role_id": role_id, "model_id": user_id},
        )
        await db.commit()

    @staticmethod
    async def create_role(
        db: AsyncSession,
        tenant_id: str,
        name: str,
        permission_ids: list[str]
    ) -> str:
        """Cria um novo Role (Perfil) para o Tenant e atrela suas permissões."""
        # 1. Inserir Role (Usando ORM)
        from app.models.rbac import Role
        nova_role = Role(
            id=str(ULID()),
            tenant_id=tenant_id,
            name=name,
            guard_name="web"
        )
        db.add(nova_role)
        await db.flush() # Para garantir que os dados estão no contexto

        # 2. Inserir na tabela associativa role_has_permissions
        if permission_ids:
            # Proteção contra SQL injection via parâmetros seria melhor, 
            # mas mantendo o padrão do projeto com strings formatadas para bulk insert
            # porém aqui vamos usar parâmetros individuais para segurança
            for p_id in permission_ids:
                await db.execute(text("""
                    INSERT INTO role_has_permissions (permission_id, role_id)
                    VALUES (:p_id, :r_id)
                """), {"p_id": p_id, "r_id": nova_role.id})
            
        await db.commit()
        return nova_role.id

    @staticmethod
    async def update_role(
        db: AsyncSession,
        role_id: str,
        tenant_id: str,
        name: str | None,
        permission_ids: list[str] | None
    ) -> None:
        """Atualiza nome e permissões de um Role do Tenant."""
        from app.models.rbac import Role
        from sqlalchemy import select
        
        # Obter Role garantindo contexto de tenant
        result = await db.execute(select(Role).where(Role.id == role_id, Role.tenant_id == tenant_id))
        role = result.scalar_one_or_none()
        if not role:
            raise ValueError("Role não encontrada ou não pertence ao Tenant.")
            
        if name:
            role.name = name
            
        if permission_ids is not None:
            # Apagar permissões antigas
            await db.execute(text("DELETE FROM role_has_permissions WHERE role_id = :role_id"), {"role_id": role_id})
            
            # Inserir novas
            if permission_ids:
                for p_id in permission_ids:
                    await db.execute(text("""
                        INSERT INTO role_has_permissions (permission_id, role_id)
                        VALUES (:p_id, :r_id)
                    """), {"p_id": p_id, "r_id": role_id})
                
        await db.commit()

    @staticmethod
    async def sync_user_permissions(
        db: AsyncSession,
        user_id: str,
        role_id: str | None,
        extra_permission_ids: list[str]
    ) -> None:
        """
        Sincroniza o Perfil Principal (Role) e Permissões Avulsas (Extra)
        do usuário.
        """
        # 1. Limpar Roles Antigas do Usuário
        await db.execute(text("""
            DELETE FROM model_has_roles
            WHERE model_id = :user_id AND model_type = 'App\\Models\\User'
        """), {"user_id": user_id})

        # 2. Inserir Nova Role (se enviada)
        if role_id:
            await db.execute(text("""
                INSERT INTO model_has_roles (role_id, model_type, model_id)
                VALUES (:role_id, 'App\\Models\\User', :user_id)
            """), {"role_id": role_id, "user_id": user_id})

        # 3. Limpar Permissões Diretas do Usuário
        await db.execute(text("""
            DELETE FROM model_has_permissions
            WHERE model_id = :user_id AND model_type = 'App\\Models\\User'
        """), {"user_id": user_id})

        # 4. Inserir Novas Permissões Diretas Extras
        if extra_permission_ids:
            for p_id in extra_permission_ids:
                await db.execute(text("""
                    INSERT INTO model_has_permissions (permission_id, model_type, model_id)
                    VALUES (:p_id, 'App\\Models\\User', :user_id)
                """), {"p_id": p_id, "user_id": user_id})

        await db.commit()

    @staticmethod
    async def remove_role(
        db: AsyncSession,
        user_id: str,
        role_id: str,
    ) -> None:
        """Remove uma role de um usuário."""
        await db.execute(
            text("""
                DELETE FROM model_has_roles
                WHERE role_id = :role_id
                AND model_type = 'App\\Models\\User'
                AND model_id = :model_id
            """),
            {"role_id": role_id, "model_id": user_id},
        )
        await db.commit()

    @staticmethod
    async def get_user_permissions(
        db: AsyncSession,
        user_id: str,
    ) -> UserPermissionsResponse:
        """
        Retorna todas as roles e permissions de um usuário.
        Combina permissões diretas + permissões via role.
        """
        # Roles do usuário
        roles_result = await db.execute(
            text("""
                SELECT r.name
                FROM roles r
                INNER JOIN model_has_roles mhr ON r.id = mhr.role_id
                WHERE mhr.model_type = 'App\\Models\\User'
                AND mhr.model_id = :user_id
            """),
            {"user_id": user_id},
        )
        roles = [row[0] for row in roles_result.fetchall()]

        # Permissões via role
        perm_result = await db.execute(
            text("""
                SELECT DISTINCT p.name
                FROM permissions p
                INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id
                INNER JOIN model_has_roles mhr ON rhp.role_id = mhr.role_id
                WHERE mhr.model_type = 'App\\Models\\User'
                AND mhr.model_id = :user_id

                UNION

                SELECT p.name
                FROM permissions p
                INNER JOIN model_has_permissions mhp ON p.id = mhp.permission_id
                WHERE mhp.model_type = 'App\\Models\\User'
                AND mhp.model_id = :user_id
            """),
            {"user_id": user_id},
        )
        permissions = [row[0] for row in perm_result.fetchall()]

        return UserPermissionsResponse(
            user_id=user_id,
            roles=roles,
            permissions=permissions,
        )

    @staticmethod
    async def has_permission(
        db: AsyncSession,
        user_id: str,
        permission_name: str,
    ) -> bool:
        """Verifica se um usuário tem uma permissão específica."""
        result = await RbacService.get_user_permissions(db=db, user_id=user_id)
        return permission_name in result.permissions
