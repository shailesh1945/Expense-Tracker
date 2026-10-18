from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_url: str = "mongodb+srv://shaileshkhandate2002:Shailesh@2002@cluster0.qa8hm.mongodb.net/expense_tracker?retryWrites=true&w=majority"
    db_name: str = "expense_tracker"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()