from fastapi import APIRouter, Depends, Body, Response, Request
from src.resources.base import BaseResponse
from src.resources import auth
router = APIRouter()


@router.post("/auth/reg", tags=["auth"])
async def reg(
        username: str = Body(..., embed=True),
        password: str = Body(..., embed=True, max_length=20, min_length=6),
        reg_key: str = Body(..., embed=True),
) -> Response:
    return await auth.reg(username, password, reg_key)


@router.post("/auth/login", tags=["auth"])
async def login(
        username: str = Body(..., embed=True),
        password: str = Body(..., embed=True),
) -> Response:
    return await auth.login(username, password)


@router.post(
    "/auth/change_password",
    tags=["auth"],
    dependencies=[Depends(auth.login_required)],
)
async def change_password(
        username: str = Body(..., embed=True),
        password: str = Body(..., embed=True),
        old_password: str = Body(..., embed=True),
) -> Response:
    return await auth.change_password(username, password, old_password)


@router.post(
    "/auth/logout",
    tags=["auth"],
    dependencies=[Depends(auth.login_required)],
)
async def logout(request: Request) -> Response:
    return await auth.logout(request.state.user)


@router.get(
    "/auth/info",
    tags=["auth"],
    dependencies=[Depends(auth.login_required)],
)
async def info(request: Request) -> BaseResponse:
    return BaseResponse(data=request.state.user.dict())
