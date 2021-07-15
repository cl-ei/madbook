from typing import Any
from src.db.schemas.base import RWSchema


class BaseResponse(RWSchema):
    err_code: int = 0
    msg: str = "success"
    data: Any
