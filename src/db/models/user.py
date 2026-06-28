from typing import Optional, List
from ..clients.mongo import RWModel
from ..schemas.bill import Book, BillCategory, Account


default_expenditure_cat = [
    BillCategory(id=0, icon=0, name="餐饮"),
    BillCategory(id=1, icon=1, name="零食烟酒"),
    BillCategory(id=2, icon=2, name="住房"),
    BillCategory(id=3, icon=3, name="交通"),
    BillCategory(id=4, icon=4, name="娱乐"),
    BillCategory(id=5, icon=5, name="旅游玩乐"),
    BillCategory(id=6, icon=6, name="文教"),
    BillCategory(id=7, icon=7, name="汽车"),
    BillCategory(id=8, icon=8, name="水电网"),
    BillCategory(id=9, icon=9, name="育儿"),
    BillCategory(id=10, icon=10, name="医疗"),
    BillCategory(id=11, icon=11, name="清洁"),
    BillCategory(id=12, icon=12, name="人情"),
    BillCategory(id=13, icon=13, name="购物", sub="鞋服"),
    BillCategory(id=14, icon=14, name="购物", sub="数码"),
    BillCategory(id=15, icon=15, name="购物", sub="家居"),
    BillCategory(id=16, icon=16, name="其它"),
]


default_income_cat = [
    BillCategory(id=0, icon=1000, is_expenditure=False, name="薪资"),
    BillCategory(id=1, icon=1001, is_expenditure=False, name="奖金"),
    BillCategory(id=2, icon=1002, is_expenditure=False, name="借入"),
    BillCategory(id=3, icon=1003, is_expenditure=False, name="收债"),
    BillCategory(id=4, icon=1004, is_expenditure=False, name="利息收入"),
    BillCategory(id=5, icon=1005, is_expenditure=False, name="意外所得"),
    BillCategory(id=6, icon=1006, is_expenditure=False, name="投资回收"),
    BillCategory(id=7, icon=1007, is_expenditure=False, name="投资收益"),
    BillCategory(id=8, icon=1008, is_expenditure=False, name="报销收入"),
    BillCategory(id=9, icon=1009, is_expenditure=False, name="其他收入"),
]


class UserDoc(RWModel):
    __collection__ = "user"
    __indexes__ = {"username": "unique"}

    id: Optional[int]
    username: Optional[str]
    password: Optional[str]

    books: List[Book] = [Book(id=0, name="默认账本")]
    accounts: List[Account] = [Account(id=0, name="默认账户")]
    expenditure_cats: List[BillCategory] = default_expenditure_cat
    income_cats: List[BillCategory] = default_income_cat
