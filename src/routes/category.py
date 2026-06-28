import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends, Body, Path, Query

from src.db.icon import ICON_MAP
from src.resources.base import BaseResponse
from src.resources import auth
from src.resources.category import CategoryResource

router = APIRouter()


@router.get("/category/icons", tags=["category"])
async def create_category() -> BaseResponse:
    return BaseResponse(data=ICON_MAP)


@router.get("/category/statistic", tags=["category"], dependencies=[Depends(auth.login_required)])
async def get_category_statistic(
        start_time: str = Query(""),
        end_time: str = Query(""),
        books: str = Query(""),
        resource: CategoryResource = Depends(CategoryResource),
) -> BaseResponse:
    start_time = datetime.datetime.strptime(start_time, r"%Y-%m-%d %H:%M:%S")
    end_time = datetime.datetime.strptime(end_time, r"%Y-%m-%d %H:%M:%S")
    books = [int(i) for i in books.split(",")] if books else None

    data: Dict = await resource.get_statistic(start_time, end_time, books)
    return BaseResponse(data=data)


@router.post("/category", tags=["category"], dependencies=[Depends(auth.login_required)])
async def create_category(
        name: str = Body(..., embed=True),
        icon: int = Body(..., embed=True),
        sub_name: str = Body("", embed=True),
        is_expenditure: bool = Body(..., embed=True),
        resource: CategoryResource = Depends(CategoryResource),
) -> BaseResponse:
    data: Dict = await resource.create(name, icon, sub_name, is_expenditure)
    return BaseResponse(data=data)


@router.put("/category/{cat_id}", tags=["category"], dependencies=[Depends(auth.login_required)])
async def edit_category(
        cat_id: int = Path(..., embed=True),
        name: str = Body(..., embed=True),
        icon: int = Body(..., embed=True),
        sub_name: str = Body("", embed=True),
        is_expenditure: bool = Body(..., embed=True),
        resource: CategoryResource = Depends(CategoryResource),
) -> BaseResponse:
    data: Dict = await resource.edit(cat_id, name, icon, sub_name, is_expenditure)
    return BaseResponse(data=data)


@router.delete("/category/{cat_id}", tags=["category"], dependencies=[Depends(auth.login_required)])
async def delete_category(
        cat_id: int = Path(..., embed=True),
        is_expenditure: bool = Body(..., embed=True),
        resource: CategoryResource = Depends(CategoryResource),
) -> BaseResponse:
    data: Dict = await resource.delete(cat_id, is_expenditure)
    return BaseResponse(data=data)


@router.post("/category/sort", tags=["category"], dependencies=[Depends(auth.login_required)])
async def sort_category(
        cat_id_list: List[int] = Body(..., embed=True),
        is_expenditure: bool = Body(..., embed=True),
        resource: CategoryResource = Depends(CategoryResource),
) -> BaseResponse:
    data: Dict = await resource.sort(cat_id_list, is_expenditure)
    return BaseResponse(data=data)
