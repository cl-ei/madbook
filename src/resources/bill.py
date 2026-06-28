import datetime
from typing import Dict, Optional, List
from fastapi.requests import Request
from starlette.responses import Response

from src.db.clients.mongo import convert_datetime_to_dt_str
from src.db.models.bill import BillDoc
from src.db.models.user import UserDoc
from src.db.queries import bill


class BillResource:
    def __init__(self, req: Request):
        self.user: UserDoc = req.state.user

    async def delete_bill(self, bill_id: int) -> Dict:
        bill_doc: Optional[BillDoc] = await bill.delete_bill(self.user, bill_id)
        return bill_doc.dict() if bill_doc else {}

    async def create_or_update_bill(
            self,
            amount: int,
            extra: str,
            expenditure: bool,
            book: int,
            account: int,
            category: int,
            create_time: datetime.datetime,
            bill_id: Optional[int] = None,
    ) -> Dict:
        bill_doc = await bill.create_or_update_bill_record(
            user=self.user,
            amount=amount,
            extra=extra,
            expenditure=expenditure,
            book=book,
            account=account,
            category=category,
            create_time=create_time,
            bill_id=bill_id
        )
        return bill_doc.dict()

    async def list_bill(
            self,
            start_time: datetime.datetime,
            end_time: datetime.datetime,
            books: Optional[List[int]] = None,
            accounts: Optional[List[int]] = None,
            categories: Optional[List[int]] = None,
            is_expenditure: Optional[bool] = None,
            page: int = 1,
            pagesize: int = 15,
    ) -> Dict:
        all_books = {b.id: b for b in self.user.books}

        total, bills = await bill.list_bills(
            user=self.user,
            start_time=start_time,
            end_time=end_time,
            books=books,
            accounts=accounts,
            categories=categories,
            is_expenditure=is_expenditure,
            page=page,
            pagesize=pagesize,
        )
        result = {
            "pagination": {
                "page": page,
                "pagesize": pagesize,
                "total": total,
            },
            "list": bills,
            "user": self.user.dict(),
            "books": [all_books.get(book_id) for book_id in books or []],
        }
        return result

    async def get_statistic(
            self,
            start_time: datetime.datetime,
            end_time: datetime.datetime,
            books: Optional[List[int]] = None,
            **kwargs,
    ) -> Dict:
        all_books = {b.id: b for b in self.user.books}
        statistic = await bill.get_statistic_group_by_time(
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
            "books": [all_books.get(book_id) for book_id in books or []],
        }
        return result

    async def export(self) -> Response:
        bills = await bill.export(self.user.id)
        a_map = {b.id: b.name for b in self.user.accounts}
        b_map = {b.id: b.name for b in self.user.books}
        ce_map = {b.id: b.name for b in self.user.expenditure_cats}
        ci_map = {b.id: b.name for b in self.user.income_cats}

        now = datetime.datetime.now()
        data = ["序号,账单id,创建时间,类型,数额,账户,账本,分类,备注"]
        for i, doc in enumerate(bills):
            bill_id = doc["_id"]
            create_time = doc["create_time"]
            bill_type = "支出" if doc['is_expenditure'] else "收入"
            amount = f"{doc['amount'] / 1000:.2f}"
            account = a_map.get(doc["account"], "-")
            book = b_map.get(doc["book"], "-")

            c_map = ce_map if doc['is_expenditure'] else ci_map
            category = c_map.get(doc["category"], "-")

            extra = doc["extra"].replace(",", "&dot")
            this_line = [i, bill_id, create_time, bill_type, amount, account, book, category, extra]
            data.append(",".join([str(e) for e in this_line]))

        headers = {"Content-Disposition": f"attachment; filename=bills_{now}.csv"}
        return Response(content="\n".join(data).encode("utf-8"), media_type="application/octet-stream", headers=headers)
