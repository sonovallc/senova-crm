"""Feature flag helper services"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_flag import FeatureFlag


async def is_flag_enabled(db: AsyncSession, key: str) -> bool:
    result = await db.execute(select(FeatureFlag.enabled).where(FeatureFlag.key == key))
    value = result.scalar_one_or_none()
    return bool(value)


async def require_flag(db: AsyncSession, key: str) -> None:
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Feature flag '{key}' not found")
    if not flag.enabled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Feature flag '{key}' is disabled")
