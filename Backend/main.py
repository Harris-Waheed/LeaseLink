from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from Admin_Routers import a_users, a_property
from Tenant_Routers import tenants
from database import db_pool
from fastapi import FastAPI
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):

    pool = await db_pool()
    app.state.db_pool = pool

    yield
    await app.state.db_pool.close()

app = FastAPI(lifespan=lifespan, lifespan_timeout=120)

app.add_middleware(CORSMiddleware,
                   allow_origins=['*'],
                   allow_headers=['*'],
                   allow_credentials=False,
                   allow_methods=['*'],
                   )

app.include_router(a_users.router)
app.include_router(a_property.router)
app.include_router(tenant.router)


if __name__ == '__main__':
    uvicorn.run('main:app', host='localhost', reload=True, port=8000)