from typing import Dict
from fastapi import APIRouter, Depends, Body, Path
from src.resources.base import BaseResponse
from src.resources import auth
from src.resources.book import BookResource
router = APIRouter()


@router.post("/book", tags=["book"], dependencies=[Depends(auth.login_required)])
async def create_book(
        name: str = Body(..., embed=True),
        calc_cyc: str = Body("month", embed=True, regex="^(month|year)$"),
        resource: BookResource = Depends(BookResource),
) -> BaseResponse:
    data: Dict = await resource.create(name, calc_cyc)
    return BaseResponse(data=data)


@router.put("/book/{book_id}", tags=["book"], dependencies=[Depends(auth.login_required)])
async def update_book(
        book_id: int = Path(..., embed=True),
        name: str = Body(..., embed=True),
        resource: BookResource = Depends(BookResource),
) -> BaseResponse:
    data: Dict = await resource.edit(book_id, name)
    return BaseResponse(data=data)


@router.delete("/book/{book_id}", tags=["book"], dependencies=[Depends(auth.login_required)])
async def delete_book(
        book_id: int = Path(..., embed=True),
        resource: BookResource = Depends(BookResource),
) -> BaseResponse:
    data: Dict = await resource.delete_book(book_id)
    return BaseResponse(data=data)
