import motor
import datetime
from typing import List, Union, Any, Iterable, Optional, Dict, Type, TypeVar
from pymongo import ReturnDocument, ASCENDING, DESCENDING
from pydantic import BaseConfig, BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from src.framework.config import MAD_BOOK_MONGODB_URL, PROJECT_DATABASE_NAME


class DB(AsyncIOMotorDatabase):
    ...


mongodb_client = motor.motor_asyncio.AsyncIOMotorClient(MAD_BOOK_MONGODB_URL)
mgo_db: DB = mongodb_client[PROJECT_DATABASE_NAME]


async def acquire_id(db: DB, seq_name: str, count: int = 1) -> range:
    """ 用于创建自增id """

    if count < 1:
        raise ValueError(f"Bad parameter: count, {count}")

    collection = db["counters"]
    result = await collection.find_one_and_update(
        {"_id": seq_name},
        {"$inc": {"seq": count}},
        projection={'seq': True, '_id': True},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    start = result["seq"] - count + 1
    end = start + count
    return range(start, end)


def convert_datetime_to_dt_str(dt: datetime.datetime) -> str:
    return datetime.datetime.strftime(dt, '%Y-%m-%d %H:%M:%S')


def load_date(y, m, d=1):
    return datetime.datetime.strptime(f"{y:04d}-{m:02d}-{d:02d} 00:00:00", '%Y-%m-%d %H:%M:%S')


T = TypeVar('T', bound='RWModel')


class RWModel(BaseModel):
    id: Optional[int]

    __collection__: str = ""
    __indexes__: Iterable[Union[str, dict]] = []

    def __repr__(self):
        return f"<{self.__class__.__name__} id: {self.id}>"

    def __str__(self):
        return self.__repr__()

    class Config(BaseConfig):
        json_encoders = {datetime.datetime: convert_datetime_to_dt_str}

    async def save(self: T, db: DB, fields: Iterable[str] = None) -> T:
        """
        创建或者更新一条记录。

        note
        ----
        这一步处理三个特殊字段，id，created_time，updated_time。
        存储时会判断 self.id:
        - None:
            创建一条新记录，created_time 和 updated_time 为 self 的值，强制更新到数据库
        - int:
            更新记录。此时判断 fields 参数，如果
            - 传入 "created_time" 和 "updated_time"，则更新 self 中对应字段的值到数据库中
            - 否则，updated_time 自动更新为 now，created_time 不更新

        """
        if fields is None:
            fields = []

        if self.id is None:
            # 创建
            self.id = (await acquire_id(db=db, seq_name=self.__collection__))[0]
            doc = self.dict()

        else:
            # 更新
            update_fields = fields or self.__fields__

            doc = {}
            source = self.dict()
            for field in update_fields:
                doc[field] = source[field]

            # 对时间的字段进行特殊的处理
            if "updated_time" in self.__fields__:
                if "updated_time" not in fields:
                    doc["updated_time"] = datetime.datetime.now()

            if "created_time" in self.__fields__:
                if "created_time" not in fields and "created_time" in doc:
                    doc.pop("created_time")

        if "id" in doc:
            doc.pop("id")
        await db[self.__collection__].find_one_and_update(
            filter={'_id': self.id},
            update={'$set': doc},
            upsert=True,
            projection={},
        )
        return self

    async def delete(self, db) -> bool:
        return await self.__class__.delete_by_id(db, self.id)

    @classmethod
    async def batch_delete(cls, db: DB, query: dict) -> int:
        result = await db[cls.__collection__].delete_many(query)
        return result.deleted_count

    @classmethod
    async def get_by_id(cls: Type[T], db: DB, id: int) -> Union[T, None]:
        result = await db[cls.__collection__].find_one({"_id": id})
        if not result:
            return None
        result["id"] = result["_id"]
        return cls(**result)

    @classmethod
    async def delete_by_id(cls, db: DB, id: int) -> bool:
        if "is_deleted" in cls.__fields__:
            result = await db[cls.__collection__].find_one_and_update(
                {'_id': id},
                {'$set': {"is_deleted": True, "updated_time": datetime.datetime.now()}},
                return_document=ReturnDocument.AFTER,
                projection={},
            )
            result["id"] = result["_id"]
        else:
            # 没有 is_deleted 字段的对象，此时应该真删
            result = await db[cls.__collection__].find_one_and_delete(
                {"_id": id},
                projection={},
            )
        return bool(result)

    @classmethod
    async def count(cls, db: DB, query: dict = None) -> int:
        if query is None:
            query = {}
        if "is_deleted" in cls.__fields__ and query.get("is_deleted") is None:
            query["is_deleted"] = False
        return await db[cls.__collection__].count_documents(query)

    @classmethod
    async def find(
        cls: Type[T],
        db: DB,
        query: Dict[str, Any],
        sort_field: str = None,
        asc: bool = False,
        start: int = 0,
        limit: int = None,
    ) -> List[T]:

        documents = await cls.find_docs(
            db=db, query=query, sort_field=sort_field,
            asc=asc, start=start, limit=limit
        )
        result = []
        for p in documents:
            p["id"] = p["_id"]
            result.append(cls(**p))
        return result

    @classmethod
    async def find_docs(
        cls: Type[T],
        db: DB,
        query: Dict[str, Any],
        sort_field: str = None,
        asc: bool = False,
        start: int = 0,
        limit: int = None,
        projection: Dict[str, bool] = None
    ) -> List[Dict[str, Any]]:

        if "id" in query:
            query["_id"] = query.pop("id")
        if "is_deleted" in cls.__fields__ and query.get("is_deleted") is None:
            query["is_deleted"] = False
        if sort_field in ("id", None):
            sort_field = "_id"
        sort_value = ASCENDING if asc else DESCENDING

        condition = {
            "filter": query,
            "skip": start,
            "sort": ((sort_field, sort_value),),
        }
        if limit is not None:
            condition["limit"] = limit
        if projection is not None:
            condition["projection"] = projection

        cursor = db[cls.__collection__]
        return await cursor.find(**condition).to_list(length=None)

    @classmethod
    async def find_one(cls: Type[T], db: DB, query: dict) -> Union[None, T]:
        p = await db[cls.__collection__].find_one(query)
        if not p:
            return None
        p["id"] = p["_id"]
        return cls(**p)

    @classmethod
    async def batch_create(
        cls: Type[T],
        db: DB,
        objects: List[T],
        batch_size: int = 5000,
    ) -> List[T]:
        """
        批量创建

        外部调用此方法时不需要考虑分批创建的问题。分批创建大小由参数 batch_size 指定。
        """
        if not objects:
            return []

        acquired_id_range = await acquire_id(db, cls.__collection__, count=len(objects))

        create_docs = []
        collection = db[cls.__collection__]
        for i, acquired_id in enumerate(acquired_id_range):
            obj = objects[i]
            obj.id = acquired_id
            doc = obj.dict()
            doc["_id"] = doc.pop("id")

            create_docs.append(doc)
            if len(create_docs) >= batch_size:
                await collection.insert_many(create_docs)
                create_docs = []

        if create_docs:
            await collection.insert_many(create_docs)

        return objects

    @classmethod
    async def batch_update(
        cls: Type[T],
        db: DB,
        objects: List[T],
        fields: Iterable[str],
        batch_size: int = 5000,
    ) -> int:
        """ 批量更新 """
        from pymongo import UpdateOne

        valid_fields = {f for f in fields if f in cls.__fields__ and f != "id"}
        if not valid_fields:
            raise ValueError(f"批量更新时传入了错误的参数：fields：{fields}")

        requests: List[UpdateOne] = []
        modified_count = 0
        for obj in objects:
            update = {"$set": obj.dict(include=valid_fields)}
            requests.append(UpdateOne(filter={"_id": obj.id}, update=update))

            if len(requests) >= batch_size:
                result = await db[cls.__collection__].bulk_write(requests)
                modified_count += result.modified_count
                requests = []

        if requests:
            result = await db[cls.__collection__].bulk_write(requests)
            modified_count += result.modified_count
        return modified_count
