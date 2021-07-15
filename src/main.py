from fastapi import FastAPI
from starlette.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.middleware.cors import CORSMiddleware

from src.framework.asynchronous import AsyncExecutor
from src.framework.config import PROJECT_NAME, VERSION
from src.framework.errors import ErrorCatcherMiddleware, request_validation_exception_handler
from src.routes.api import router as api_router
from src.frontend.api import router as frontend_router


def get_application() -> FastAPI:
    application = FastAPI(title=PROJECT_NAME, debug=True, version=VERSION)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_exception_handler(RequestValidationError, request_validation_exception_handler)
    application.add_middleware(ErrorCatcherMiddleware)
    application.include_router(api_router, prefix="/madbook/api")
    application.include_router(frontend_router, prefix="/madbook")

    application.mount("/madbook/static", StaticFiles(directory="src/frontend/static"), name="static")

    application.state.AE = AsyncExecutor()
    # application.add_event_handler("startup", application.state.AE.startup)
    # application.add_event_handler("shutdown", application.state.AE.shutdown)
    return application


app = get_application()
