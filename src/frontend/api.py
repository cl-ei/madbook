import datetime
from typing import *
from jinja2 import Template
from fastapi import APIRouter, Query, Depends, Response
from src.framework.asynchronous import AsyncExecutor
from src.framework.errors import APIError


router = APIRouter()

tpl_cache: Dict[str, str] = {}


def render_to_response(tpl: str, context: Dict = None) -> Response:
    tpl_content = tpl_cache.get(tpl)
    if not tpl_content:
        try:
            with open(tpl, encoding="utf-8") as f:
                tpl_content = f.read()
            tpl_cache[tpl] = tpl_content
        except IOError:
            tpl_content = "<center><h3>Template Does Not Existed!</h3></center>"

    template = Template(tpl_content)
    content = template.render(context or {})
    return Response(content=content, media_type="text/html")


@router.get("")
def home_page() -> Response:
    return render_to_response("src/frontend/tpl/home.html", {})
