from typing import Dict
from fastapi.requests import Request
from src.db.schemas.bill import Account
from src.db.models.user import UserDoc
from src.db.clients.mongo import mgo_db as db
from src.framework.errors import APIError


class AccountResource:
    def __init__(self, req: Request):
        self.user: UserDoc = req.state.user

    async def create(self, name: str) -> Dict:
        max_account_id = max([ac.id for ac in self.user.accounts])
        self.user.accounts.insert(1, Account(id=max_account_id + 1, name=name))
        await self.user.save(db, fields=("accounts", ))
        return self.user.dict()

    async def edit(self, account_id: int, name: str, is_deleted: bool) -> Dict:
        valid_id = False
        for ac in self.user.accounts:
            if ac.id == account_id:
                ac.is_deleted = is_deleted
                ac.name = name
                valid_id = True
                break
        if not valid_id:
            raise APIError("账户不存在")
        await self.user.save(db, fields=("accounts", ))
        return self.user.dict()
