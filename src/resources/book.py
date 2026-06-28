from typing import Dict
from fastapi.requests import Request
from src.db.schemas.bill import Book
from src.db.models.user import UserDoc
from src.db.models.bill import BillDoc
from src.db.clients.mongo import mgo_db as db
from src.framework.errors import APIError


class BookResource:
    def __init__(self, req: Request):
        self.user: UserDoc = req.state.user

    async def create(self, name: str, calc_cyc: str) -> Dict:
        max_book_id = max([b.id for b in self.user.books])
        book = Book(id=max_book_id + 1, name=name, calc_cyc=calc_cyc)
        self.user.books.insert(1, book)
        await self.user.save(db, fields=("books", ))
        return self.user.dict()

    async def edit(self, book_id: int, name: str) -> Dict:
        valid_book_id = False
        for book in self.user.books:
            if book.id == book_id:
                book.name = name
                valid_book_id = True
                break
        if not valid_book_id:
            raise APIError("账本不存在")
        await self.user.save(db, fields=("books", ))
        return self.user.dict()

    async def delete_book(self, book_id) -> Dict:
        target_books = [b for b in self.user.books if b.id == book_id]
        if not target_books:
            raise APIError("账本不存在")

        query = {
            "user_id": self.user.id,
            "book": book_id,
        }
        total: int = await BillDoc.count(db, query)
        self.user.books = [b for b in self.user.books if b.id != book_id]
        if total > 0:
            self.user.books.append(target_books[0])

        await self.user.save(db, fields=("books",))
        data = self.user.dict()
        data["is_deleted"] = total == 0
        return data
