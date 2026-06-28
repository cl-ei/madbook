import aiohttp
from fastapi import APIRouter
from src.resources.base import BaseResponse

router = APIRouter()


@router.get("/hitokoto", tags=["hitokoto"])
async def create_category() -> BaseResponse:
    timeout = aiohttp.ClientTimeout(total=0.8)
    async with aiohttp.request(
            method="get",
            url="https://v1.hitokoto.cn/?c=f&encode=text",
            timeout=timeout
    ) as response:
        content = await response.text()
    return BaseResponse(data={"sentence": content})
