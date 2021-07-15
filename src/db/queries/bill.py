import datetime
import logging
from typing import List, Optional, Tuple, Dict

from ...framework.errors import APIError
from ..models.bill import BillDoc
from ..models.user import UserDoc
from ..models.stitistic import StatisticDoc, StatisticDetail
from ..schemas.bill import InnerStatistic, BillPercentage
from ..clients.mongo import mgo_db as db
from ..clients.mongo import load_date


async def delete_bill(user: UserDoc, bill_id: int) -> BillDoc:
    bill = await BillDoc.get_by_id(db, bill_id)
    if not bill:
        raise APIError(f"Bill id-{bill_id} does not existed")
    if bill.user_id != user.id:
        raise APIError(f"Bill id-{bill_id} does not belongs to you")
    await bill.delete(db)
    return bill


async def create_or_update_bill_record(
        user: UserDoc,
        amount: int,
        extra: str,
        expenditure: bool,
        book: int,
        account: int,
        category: int,
        create_time: datetime.datetime,
        bill_id: Optional[int] = None,
) -> BillDoc:
    # check book
    if book not in [bk.id for bk in user.books if not bk.is_deleted]:
        raise APIError(f"账本: id-{book} 不存在或已停用")
    if account not in [ac.id for ac in user.accounts if not ac.is_deleted]:
        raise APIError(f"账户 id-{account} 不存在或已停用")
    cat_range = user.expenditure_cats if expenditure else user.income_cats
    if category not in [cat.id for cat in cat_range if not cat.is_deleted]:
        raise APIError(f"类别 id-{category} 不存在或已停用")

    if bill_id:
        # update
        bill = await BillDoc.get_by_id(db, bill_id)
        if not bill:
            raise APIError(f"Bill id-{bill_id} does not existed")

        bill.is_expenditure = expenditure
        bill.amount = amount
        bill.extra = extra
        bill.user_id = user.id
        bill.account = account
        bill.book = book
        bill.category = category
        bill.create_time = create_time
        await bill.save(db)

    else:
        # create
        bill = BillDoc(
            is_expenditure=expenditure,
            amount=amount,
            extra=extra,
            user_id=user.id,
            account=account,
            book=book,
            category=category,
            create_time=create_time,
        )
        await bill.save(db)
    return bill


async def list_bills(
        user: UserDoc,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
        books: Optional[List[int]],
        accounts: Optional[List[int]],
        categories: Optional[List[int]],
        is_expenditure: Optional[bool],
        page: int,
        pagesize: int,
) -> Tuple[int, List[Dict]]:
    start: int = (page - 1) * pagesize
    limit: int = pagesize

    query = {
        "user_id": user.id,
        "create_time": {"$gte": start_time, "$lt": end_time},
    }
    if books is not None:
        query["book"] = {"$in": books}
    if accounts is not None:
        query["account"] = {"$in": accounts}
    if categories is not None:
        query["category"] = {"$in": categories}
    if is_expenditure is not None:
        query["is_expenditure"] = is_expenditure

    total: int = await BillDoc.count(db, query)
    data_list: List[Dict] = await BillDoc.find_docs(
        db,
        query=query,
        sort_field="create_time",
        start=start,
        limit=limit,
    )
    return total, data_list


async def get_or_create_statistics(
        user_id: int,
        calc_cyc: str,
        book_id: int,
        year: int,
        month: int = 0,
) -> StatisticDoc:
    query = {
        "statistic_type": "book",
        "calc_cyc": calc_cyc,
        "year": year,
        "user_id": user_id,
        "book_id": book_id,
    }
    if calc_cyc == "month":
        query["month"] = month
    bk_sta: StatisticDoc = await StatisticDoc.find_one(db, query=query)
    if bk_sta is None:
        bk_sta = StatisticDoc(**query)
        await bk_sta.save(db)
    return bk_sta


async def get_total_statistic(user_id: int, books: Optional[List[int]], year: int, month: int = None) -> Dict:
    start = load_date(year, month or 1)
    if month is None:
        end = load_date(year + 1, 1)
    else:
        end_month = (month + 1) % 12
        end_year = year if month < 12 else year + 1
        end = load_date(end_year, end_month)
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "create_time": {"$gte": start, "$lt": end}
        }},
        {"$group": {
            "_id": "$is_expenditure",
            "total": {"$sum": "$amount"},
        }}
    ]
    if books is not None:
        pipeline[0]["$match"]["book"] = {"$in": books}
    sta_data = await db[BillDoc.__collection__].aggregate(pipeline).to_list(length=None)

    result = {"expenditure": 0, "income": 0}
    for doc in sta_data:
        if doc["_id"] is True:
            result["expenditure"] = doc["total"]
        else:
            result["income"] = doc["total"]
    return result


async def get_statistic_group_by_time(
        user_id: int,
        books: Optional[List[int]],
        start: datetime.datetime,
        end: datetime.datetime,
) -> Dict:
    days = (end - start).total_seconds() / 3600 / 24
    data_index = []
    tmp = start
    if days > 800:
        format_str = "%Y"
        st_y, end_y = start.year, end.year
        data_index = [f"{y:04d}" for y in range(st_y, end_y + 1)]
    elif days > 40:
        format_str = "%Y-%m"
        while tmp <= end:
            data_index.append(f"{tmp.year:04d}-{tmp.month:02d}")
            year, month = tmp.year, tmp.month
            month += 1
            if month == 13:
                month = 1
                year += 1
            tmp = datetime.datetime(year=year, month=month, day=1)
    else:
        format_str = "%Y-%m-%d"
        while tmp < end:
            data_index.append(f"{tmp.year:04d}-{tmp.month:02d}-{tmp.day:02d}")
            tmp += datetime.timedelta(days=1)

    pipeline = [
        {"$match": {
            "user_id": user_id,
            "create_time": {"$gte": start, "$lt": end}
        }},
        {"$group": {
            "_id": {
                "ex": "$is_expenditure",
                "dt": {"$dateToString": {"format": format_str, "date": "$create_time"}},
            },
            "t": {"$sum": "$amount"},
        }}
    ]
    if books is not None:
        pipeline[0]["$match"]["book"] = {"$in": books}
    sta_data = await db[BillDoc.__collection__].aggregate(pipeline).to_list(length=None)

    ex_map = {d["_id"]["dt"]: d["t"] for d in sta_data if d["_id"]["ex"] is True}
    in_map = {d["_id"]["dt"]: d["t"] for d in sta_data if d["_id"]["ex"] is False}
    expenditure = sum(ex_map.values())
    income = sum(in_map.values())
    ex_list = [ex_map.get(index, 0) for index in data_index]
    in_list = [in_map.get(index, 0) for index in data_index]
    result = {
        "expenditure": expenditure,
        "income": income,
        "ex_list": ex_list,
        "in_list": in_list,
        "index": data_index,
    }
    return result


async def get_statistic_group_by_category(
        user_id: int,
        books: Optional[List[int]],
        start: datetime.datetime,
        end: datetime.datetime,
) -> Dict:

    pipeline = [
        {"$match": {
            "user_id": user_id,
            "create_time": {"$gte": start, "$lt": end}
        }},
        {"$group": {
            "_id": {
                "ex": "$is_expenditure",
                "c": "$category",
            },
            "t": {"$sum": "$amount"},
            "c": {"$sum": 1},
        }},
        {"$sort": {"t": -1}}
    ]
    if books is not None:
        pipeline[0]["$match"]["book"] = {"$in": books}
    sta_data = await db[BillDoc.__collection__].aggregate(pipeline).to_list(length=None)
    ex_list = []
    in_list = []
    expenditure = income = 0
    for doc in sta_data:
        ex = doc["_id"]["ex"]
        category = doc["_id"]["c"]
        total = doc["t"]
        count = doc["c"]

        if ex is True:
            ex_list.append([category, total, count])
            expenditure += total
        elif ex is False:
            in_list.append([category, total, count])
            income += total

    result = {
        "expenditure": expenditure,
        "income": income,
        "raw_ex": ex_list,
        "raw_in": in_list,
    }
    return result


async def export(user_id) -> List[Dict]:
    bills = await BillDoc.find_docs(db, query={"user_id": user_id})
    return bills
