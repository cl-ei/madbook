from fastapi import APIRouter
from src.routes.auth import router as auth_router
from src.routes.bill import router as bill_router
from src.routes.category import router as cat_router
from src.routes.book import router as book_router
from src.routes.hitokoto import router as hitokoto_router


router = APIRouter()

router.include_router(auth_router)
router.include_router(bill_router)
router.include_router(cat_router)
router.include_router(book_router)
router.include_router(hitokoto_router)
