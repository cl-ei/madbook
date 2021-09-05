import jwt
import json
import time
from typing import *

from fastapi import Response, Security, requests
from fastapi.security import APIKeyCookie, APIKeyHeader

from src.framework.config import (
    TOKEN_ENCRYPT_SALT,
    TOKEN_KEY,
    TOKEN_ALGORITHM,
    TOKEN_EXPIRE,
    REG_KEY,
)
from src.framework.log4 import logger
from src.framework.encryption import Encryptor
from src.framework.errors import APIError, AuthError
from src.db.models.user import UserDoc
from src.db.queries.user import create_user, get_user, get_user_by_id, set_user_password
from src.resources.base import BaseResponse


class JWT:
    @staticmethod
    def gen(data: Dict) -> str:
        data["e"] = int(time.time() + TOKEN_EXPIRE)
        return jwt.encode(data, TOKEN_ENCRYPT_SALT, algorithm=TOKEN_ALGORITHM)

    @staticmethod
    def parse(value: str) -> Dict:
        data = jwt.decode(value, TOKEN_ENCRYPT_SALT, algorithms=[TOKEN_ALGORITHM])
        if data.pop("e") < time.time():
            raise APIError("登录已过期")
        return data


class RWAPIKeyCookie(APIKeyCookie):
    async def __call__(self, request: requests.Request) -> Optional[str]:
        try:
            return await super().__call__(request)
        except Exception as e:
            _ = e
            return ""


class RWAPIKeyHeader(APIKeyHeader):
    async def __call__(self, request: requests.Request) -> Optional[str]:
        try:
            return await super().__call__(request)
        except Exception as e:
            _ = e
            return ""


async def login_required(
        request: requests.Request,
        cookie_token: str = Security(RWAPIKeyCookie(name=TOKEN_KEY)),
        header_token: str = Security(RWAPIKeyHeader(name=TOKEN_KEY)),
) -> None:
    try:
        data = JWT.parse(cookie_token or header_token)
        user: UserDoc = await get_user_by_id(data["user_id"])
    except Exception as e:
        raise AuthError(msg=str(e))

    user.password = None
    request.state.user = user


async def __make_auth_response(user: UserDoc) -> Response:
    jwt_token = JWT.gen({"user_id": user.id})
    data = user.dict()
    data.pop("password")
    data["token"] = jwt_token

    resp = Response(
        content=json.dumps(BaseResponse(data=data).dict(), ensure_ascii=False).encode("utf-8"),
        media_type="application/json",
    )
    resp.set_cookie(key=TOKEN_KEY, value=jwt_token, expires=TOKEN_EXPIRE)
    return resp


async def reg(username: str, password: str, reg_key: str) -> Response:
    # TODO: change reg_key
    if reg_key != REG_KEY:
        raise APIError("邀请码错误")

    encrypt_password = Encryptor().encode(password)
    user: UserDoc = await create_user(username=username, encrypt_password=encrypt_password)
    logger.info(f"New user created: {user}")
    return await __make_auth_response(user)


async def login(username: str, password: str) -> Response:
    encrypt_password = Encryptor().encode(password)
    user: UserDoc = await get_user(username=username, encrypt_password=encrypt_password)
    return await __make_auth_response(user)


async def logout(user: UserDoc) -> Response:
    data: Dict = user.dict()
    data.pop("password")
    resp = Response(content=json.dumps(data, ensure_ascii=False).encode("utf-8"), media_type="application/json")
    resp.delete_cookie(key=TOKEN_KEY)
    return resp


async def change_password(username: str, new_password: str, old_password: str) -> Response:
    e = Encryptor()
    user: UserDoc = await set_user_password(username, e.encode(old_password), e.encode(new_password))
    # TODO: need re-login
    return await __make_auth_response(user)
