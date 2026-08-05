from fastapi import Request
from dotenv import load_dotenv
import asyncpg
import os

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
URL = f"postgresql://{DB_USER}:{DB_PASS}@ep-orange-lab-azpli8dh-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


async def db_pool():

    return await asyncpg.create_pool(  # type: ignore
        dsn=URL, min_size=2, max_size=11, timeout=60
    )


async def get_db(request: Request):

    pool = request.app.state.db_pool
    connection = await pool.acquire()

    try:
        "Database Connected"
        yield connection

    finally:
        await pool.release(connection)
