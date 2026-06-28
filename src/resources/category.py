import datetime
from typing import Dict, List, Optional
from fastapi.requests import Request

from src.framework.errors import APIError
from src.framework.config import LIMIT_CATEGORIES_CNT
from src.db.models.user import UserDoc
from src.db.models.bill import BillDoc
from src.db.schemas.bill import BillCategory
from src.db.clients.mongo import mgo_db as db
from src.db.clients.mongo import convert_datetime_to_dt_str
from src.db.queries.bill import get_statistic_group_by_category


class CategoryResource:
    def __init__(self, req: Request):
        self.user: UserDoc = req.state.user

    async def create(self, name: str, icon: int, sub_name: str, is_expenditure: bool) -> Dict:
        # if str(icon) not in ICON_MAP:
        #     raise APIError("图标不存在")

        target = self.user.expenditure_cats if is_expenditure else self.user.income_cats
        if len(target) >= LIMIT_CATEGORIES_CNT:
            raise APIError("类别数量已超出限制")

        max_id = max([c.id for c in target])
        cat = BillCategory(id=max_id + 1, is_expenditure=is_expenditure, name=name, sub=sub_name, icon=icon)
        target.insert(0, cat)
        filed_name = "expenditure_cats" if is_expenditure else "income_cats"
        await self.user.save(db, fields=(filed_name,))
        return self.user.dict()

    async def delete(self, cat_id: int, is_expenditure: bool) -> Dict:
        cats = self.user.expenditure_cats if is_expenditure else self.user.income_cats
        cat_index = -1
        for i, c in enumerate(cats):
            if c.id == cat_id:
                cat_index = i
                break
        if cat_index == -1:
            raise APIError("分类不存在")
        query = {"user_id": self.user.id, "category": cat_id}
        total: int = await BillDoc.count(db, query)
        cat = cats.pop(cat_index)
        if total > 0:
            cat.is_deleted = True
            cats.append(cat)

        filed_name = "expenditure_cats" if is_expenditure else "income_cats"
        await self.user.save(db, fields=(filed_name,))
        data = self.user.dict()
        data["is_deleted"] = total == 0
        return data

    async def edit(self, cat_id: int, name: str, icon: int, sub_name: str, is_expenditure: bool) -> Dict:
        # if str(icon) not in ICON_MAP:
        #     raise APIError("图标不存在")

        cats = self.user.expenditure_cats if is_expenditure else self.user.income_cats
        target = None
        for cat in cats:
            if cat.id != cat_id:
                continue
            cat.is_deleted = False
            cat.name = name
            cat.icon = icon
            cat.sub = sub_name
            target = cat

        if target is None:
            raise APIError("分类不存在")

        cats = [c for c in cats if c.is_deleted is False] + [c for c in cats if c.is_deleted is True]
        if is_expenditure:
            filed_name = "expenditure_cats"
            self.user.expenditure_cats = cats
        else:
            filed_name = "income_cats"
            self.user.income_cats = cats

        await self.user.save(db, fields=(filed_name,))
        return self.user.dict()

    async def sort(self, cat_id_list: List[int], is_expenditure: bool) -> Dict:
        cat_id_set = set(cat_id_list)
        if len(cat_id_set) != len(cat_id_list):
            raise APIError("类别id不允许重复")

        cats = self.user.expenditure_cats if is_expenditure else self.user.income_cats
        data_map = {c.id: c for c in cats}
        if cat_id_set != set(data_map):
            raise APIError("类别id列表不正确")

        result: List[BillCategory] = []
        for cat_id in cat_id_list:
            result.append(data_map[cat_id])

        if is_expenditure:
            self.user.expenditure_cats = result
            filed_name = "expenditure_cats"
        else:
            self.user.income_cats = result
            filed_name = "income_cats"
        await self.user.save(db, fields=(filed_name,))
        return self.user.dict()

    async def get_statistic(
            self,
            start_time: datetime.datetime,
            end_time: datetime.datetime,
            books: Optional[List[int]] = None,
            **kwargs,
    ) -> Dict:
        all_books = {b.id: b for b in self.user.books}
        statistic = await get_statistic_group_by_category(
            user_id=self.user.id,
            books=books,
            start=start_time,
            end=end_time,
        )

        result = {
            "user": self.user.dict(),
            "statistic": statistic,
            "query": {
                "start_time": convert_datetime_to_dt_str(start_time),
                "end_time": convert_datetime_to_dt_str(end_time),
                "books": books,
            },
            "books": [all_books[book_id] for book_id in books or []],
        }
        return result
