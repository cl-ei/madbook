from typing import List
from pydantic import validator
from .base import RWSchema


CALC_CYC_VALUES = ("week", "month", "quarter_year", "half_year", "year")


class Book(RWSchema):
    id: int
    name: str
    calc_cyc: str = "month"
    budget: int = 0
    amount: int = 0
    is_deleted: bool = False

    @validator("calc_cyc")
    def validate_calc_cyc(cls, v) -> str:
        if v not in CALC_CYC_VALUES:
            raise ValueError(f"错误的calc_cyc值: {v}")
        return v


class BillCategory(RWSchema):
    id: int
    is_expenditure: bool = True
    name: str
    sub: str = ""
    icon: int = 0
    is_deleted: bool = False


class Account(RWSchema):
    id: int
    name: str
    balance: int = 0
    is_deleted: bool = False


class BillPercentage(RWSchema):
    cat_id: int
    amount: int


class InnerStatistic(RWSchema):
    index: int
    amount: int


class StatisticDetail(RWSchema):
    amount: int = 0
    records: List[InnerStatistic] = []
    percentage: List[BillPercentage] = []
