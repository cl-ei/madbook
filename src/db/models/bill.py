import datetime
from typing import Optional
from ..clients.mongo import RWModel


class BillDoc(RWModel):
    __collection__ = "bill"

    id: Optional[int]
    is_expenditure: bool
    amount: int
    extra: str = ""

    user_id: int
    account: int
    book: int
    category: int
    create_time: datetime.datetime
