"""Script para insertar datos de prueba completos en la BD."""

import asyncio
import os
import sys
from datetime import datetime, timezone

# Asegurar que src está en el path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from sqlalchemy import select
from decdata_api.db import async_session_maker
from decdata_api.models.user import User
from decdata_api.models.contract_type import ContractType
from decdata_api.models.fundo import Fundo
from decdata_api.models.owner import Owner
from decdata_api.models.contract import Contract
from decdata_api.core.security import hash_password

async def seed():
    async with async_session_maker() as session:
        print("Iniciando inyección de datos de prueba...")
        
        # 1. Admin
        result = await session.execute(select(User).where(User.email == "admin@fundo.com"))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(email="admin@fundo.com", password_hash=hash_password("admin123"), full_name="Administrador Fundo", role="ADMIN")
            session.add(admin)
            await session.flush()

        # 2. Tipos de contrato
        result = await session.execute(select(ContractType))
        types = result.scalars().all()
        if len(types) == 0:
            types = [
                ContractType(code="ARREND", name="Arrendamiento de Tierras", description="Contrato para arrendar parcelas por temporada."),
                ContractType(code="COMPRAVENTA", name="Compra-Venta de Cosecha", description="Acuerdo de venta de la producción agrícola."),
            ]
            session.add_all(types)
            await session.flush()

        # 3. Fundos
        fundos = [
            Fundo(name="Hacienda El Paraíso", region="Ica", total_hectares=150.5),
            Fundo(name="Valle Verde", region="Piura", total_hectares=80.0),
            Fundo(name="Finca Los Andes", region="Arequipa", total_hectares=45.2)
        ]
        session.add_all(fundos)
        await session.flush()
        print(f"🌱 {len(fundos)} Fundos creados.")

        # 4. Dueños
        owners = [
            Owner(first_name="Juan", last_name="Pérez Gomez", document_number="12345678", email="juan@elparaiso.com", phone="+51999888777", fundo_id=fundos[0].id),
            Owner(first_name="María", last_name="Silva Rojas", document_number="87654321", email="maria@valleverde.com", phone="+51999111222", fundo_id=fundos[1].id),
            Owner(first_name="Carlos", last_name="Ruiz Díaz", document_number="11223344", email="carlos@losandes.com", phone="+51999333444", fundo_id=fundos[2].id)
        ]
        session.add_all(owners)
        await session.flush()
        print(f"👨‍🌾 {len(owners)} Dueños creados.")

        # 5. Contratos
        contracts = [
            Contract(
                contract_type_id=types[0].id,
                fundo_id=fundos[0].id,
                code="ARR-2026-001",
                title="Arrendamiento El Paraíso",
                start_date=datetime.now(timezone.utc).date(),
                end_date=datetime.now(timezone.utc).date(),
                status="PENDING_SIGNATURE",
                metadata_json={"precio_hectarea": 5000, "cultivo": "Uva"},
                created_by=admin.id
            ),
            Contract(
                contract_type_id=types[1].id,
                fundo_id=fundos[1].id,
                code="CV-2026-001",
                title="Compra-Venta Valle Verde",
                start_date=datetime.now(timezone.utc).date(),
                end_date=datetime.now(timezone.utc).date(),
                status="PENDING_SIGNATURE",
                metadata_json={"precio_hectarea": 3000, "cultivo": "Mango"},
                created_by=admin.id
            )
        ]
        session.add_all(contracts)
        print(f"📝 {len(contracts)} Contratos creados en estado PENDING_SIGNATURE.")

        await session.commit()
        print("✅ Base de datos lista para pruebas intensivas.")

if __name__ == "__main__":
    asyncio.run(seed())
