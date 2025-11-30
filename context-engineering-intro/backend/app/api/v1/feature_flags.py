"""Feature flag management endpoints"""

import re
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import CurrentUser, DatabaseSession
from app.models.user import UserRole
from app.models.feature_flag import FeatureFlag
from app.schemas.feature_flag import (
    FeatureFlagCreate,
    FeatureFlagUpdate,
    FeatureFlagRead,
    FeatureFlagList,
)

router = APIRouter(prefix="/feature-flags", tags=["Feature Flags"])


def _role_value(user: CurrentUser) -> str:
    return user.role.value if isinstance(user.role, UserRole) or hasattr(user.role, 'value') else str(user.role)


async def _ensure_admin_or_owner(current_user: CurrentUser) -> None:
    if _role_value(current_user) not in {UserRole.OWNER.value, UserRole.ADMIN.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


async def _ensure_owner(current_user: CurrentUser) -> None:
    if _role_value(current_user) != UserRole.OWNER.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owners may manage feature flags")


@router.get("/", response_model=FeatureFlagList)
async def list_feature_flags(
    db: DatabaseSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    await _ensure_admin_or_owner(current_user)

    stmt = (
        select(FeatureFlag)
        .order_by(FeatureFlag.key)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()

    total = await db.scalar(select(func.count(FeatureFlag.id)))

    return FeatureFlagList(
        items=[FeatureFlagRead.model_validate(flag) for flag in items],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


def _normalize_key(key: str) -> str:
    cleaned = key.strip().lower()
    cleaned = re.sub(r"[^a-z0-9]+", "-", cleaned)
    cleaned = re.sub(r"-+", "-", cleaned).strip('-')
    return cleaned or "flag"


@router.post("/", response_model=FeatureFlagRead, status_code=status.HTTP_201_CREATED)
async def create_feature_flag(
    payload: FeatureFlagCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    await _ensure_owner(current_user)

    flag = FeatureFlag(
        key=_normalize_key(payload.key),
        name=payload.name,
        description=payload.description,
        enabled=False,
        created_by=current_user.id,
        updated_by=current_user.id,
    )

    db.add(flag)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Feature flag key must be unique") from exc

    await db.refresh(flag)
    return FeatureFlagRead.model_validate(flag)


async def _get_flag_or_404(db: AsyncSession, flag_id: UUID) -> FeatureFlag:
    flag = await db.get(FeatureFlag, flag_id)
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature flag not found")
    return flag


@router.patch("/{flag_id}", response_model=FeatureFlagRead)
async def update_feature_flag(
    flag_id: UUID,
    payload: FeatureFlagUpdate,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    await _ensure_owner(current_user)
    flag = await _get_flag_or_404(db, flag_id)

    if payload.name is not None:
        flag.name = payload.name
    if payload.description is not None:
        flag.description = payload.description
    if payload.enabled is not None:
        flag.enabled = payload.enabled

    flag.updated_by = current_user.id

    await db.commit()
    await db.refresh(flag)
    return FeatureFlagRead.model_validate(flag)


@router.delete("/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature_flag(
    flag_id: UUID,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    await _ensure_owner(current_user)
    flag = await _get_flag_or_404(db, flag_id)
    await db.delete(flag)
    await db.commit()
    return None
