import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Body, Path, Query
from src.db.schemas.base import RWSchema
from src.resources.base import BaseResponse
from src.resources import auth
from src.resources.bill import BillResource
router = APIRouter()


class CommonParam(RWSchema):
    start_time: datetime.datetime
    end_time: datetime.datetime
    books: Optional[List[int]]
    accounts: Optional[List[int]]
    categories: Optional[List[int]]
    is_expenditure: Optional[bool]


def _load_common_param(
        start_time: str = Query(""),
        end_time: str = Query(""),
        books: str = Query(""),
        accounts: str = Query(""),
        categories: str = Query(""),
        is_expenditure: str = Query(""),
) -> CommonParam:
    now = datetime.datetime.now()
    three_days_ago = now - datetime.timedelta(days=3)
    start_time = datetime.datetime.strptime(start_time, r"%Y-%m-%d %H:%M:%S") if start_time else three_days_ago
    end_time = datetime.datetime.strptime(end_time, r"%Y-%m-%d %H:%M:%S") if end_time else now

    books = [int(i) for i in books.split(",")] if books else None
    accounts = [int(i) for i in accounts.split(",")] if accounts else None
    categories = [int(i) for i in categories.split(",")] if categories else None
    is_expenditure = bool(is_expenditure == "1") if is_expenditure else None

    return CommonParam(
        start_time=start_time,
        end_time=end_time,
        books=books,
        accounts=accounts,
        categories=categories,
        is_expenditure=is_expenditure,
    )


@router.get("/bill", tags=["bill"], dependencies=[Depends(auth.login_required)])
async def list_bill(
        common: CommonParam = Depends(_load_common_param),
        page: int = Query(1, ge=1),
        pagesize: int = Query(30, ge=1, le=100),
        resource: BillResource = Depends(BillResource),
) -> BaseResponse:
    data = await resource.list_bill(page=page, pagesize=pagesize, **common.dict())
    return BaseResponse(data=data)


@router.get("/bill/statistic", tags=["bill"], dependencies=[Depends(auth.login_required)])
async def get_statistic(
        common: CommonParam = Depends(_load_common_param),
        resource: BillResource = Depends(BillResource),
) -> BaseResponse:
    data = await resource.get_statistic(**common.dict())
    return BaseResponse(data=data)


@router.post("/bill", tags=["bill"], dependencies=[Depends(auth.login_required)])
async def create_bill(
        amount: int = Body(..., embed=True),
        extra: str = Body("", embed=True, max_length=200),
        expenditure: bool = Body(..., embed=True),
        book: int = Body(..., embed=True),
        account: int = Body(..., embed=True),
        category: int = Body(..., embed=True),
        create_time: str = Body(..., embed=True),
        bill_id: int = Body(0, embed=True),
        resource: BillResource = Depends(BillResource),
) -> BaseResponse:
    create_time = datetime.datetime.strptime(create_time, r"%Y-%m-%d %H:%M:%S")
    data = await resource.create_or_update_bill(
        amount, extra, expenditure, book,
        account, category, create_time, bill_id,
    )
    return BaseResponse(data=data)


@router.delete("/bill/{bill_id}", tags=["bill"], dependencies=[Depends(auth.login_required)])
async def delete_bill(
        bill_id: int = Path(..., gt=0),
        resource: BillResource = Depends(BillResource),
) -> BaseResponse:
    data = await resource.delete_bill(bill_id)
    return BaseResponse(data=data)


@router.get("/bill/export", tags=["bill"], dependencies=[Depends(auth.login_required)])
async def export(resource: BillResource = Depends(BillResource)) -> BaseResponse:
    return await resource.export()

