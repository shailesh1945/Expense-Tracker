from pymongo import AsyncMongoClient

from app.core.config import settings

client = AsyncMongoClient(settings.mongo_url)
db = client[settings.db_name]