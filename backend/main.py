from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import map_api, sat_api

app = FastAPI(title="Space Pathwarden API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_api.router)
app.include_router(sat_api.router)

@app.get("/")
def home():
    return {"status": "Backend działa!"}