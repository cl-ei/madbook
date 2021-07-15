from typing import *
from pydantic import validator
from ..clients.mongo import RWModel
from ..schemas.bill import StatisticDetail


class StatisticDoc(RWModel):
    """
    统计

    note
    ----
    按时间维度分为两种，年度统计 或 月度统计
        - 年度统计：
            - calc_cyc = "year"
            - month = 0
            - records 记录 12 个月的记录，key 为月份
        - 月度统计：
            - calc_cyc = "month"
            - month 为当月的月份
            - records 记录 当月每天的总额，key 为日期的日数

    percentage 字段统计占比：
        Tuple[int, float]: 第0个值标识 BillCategory 的 id，value为百分比， 0 ~ 1 之间.
    """
    __collection__ = "book_statistic"

    id: Optional[int]
    statistic_type: str
    calc_cyc: str
    year: int
    month: int = 0

    user_id: int
    book_id: Optional[int]

    expenditure: StatisticDetail = StatisticDetail()
    income: StatisticDetail = StatisticDetail()

    @validator("statistic_type")
    def valid_statistic_type(cls, v) -> str:
        if v in ("book", "account"):
            return v
        raise ValueError(f"Error statistic_type value: {v}")

    @validator("calc_cyc")
    def valid_calc_cyc(cls, v) -> str:
        if v in ("year", "month"):
            return v
        raise ValueError(f"Error calc_cyc value: {v}")
