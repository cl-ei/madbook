from typing import Dict
from fastapi import APIRouter, Depends, Body, Path
from src.resources.base import BaseResponse
from src.resources import auth
from src.resources.account import AccountResource
router = APIRouter()


@router.post("/account", tags=["book"], dependencies=[Depends(auth.login_required)])
async def create_book(
        name: str = Body(..., embed=True),
        resource: AccountResource = Depends(AccountResource),
) -> BaseResponse:
    data: Dict = await resource.create(name)
    return BaseResponse(data=data)


@router.put("/account/{account_id}", tags=["book"], dependencies=[Depends(auth.login_required)])
async def create_book(
        account_id: int = Path(..., embed=True),
        name: str = Body(..., embed=True),
        is_deleted: bool = Body(..., embed=True),
        resource: AccountResource = Depends(AccountResource),
) -> BaseResponse:
    data: Dict = await resource.edit(account_id, name, is_deleted)
    return BaseResponse(data=data)
