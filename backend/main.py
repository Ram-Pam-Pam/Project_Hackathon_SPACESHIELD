from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import map_api, ai_mock, export_api

app = FastAPI(title="Space Pathwarden API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3004/", "https://spacepathwarden-api.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"], # Zezwala na POST, GET, OPTIONS i inne
    allow_headers=["*"],
)

app.include_router(map_api.router)
app.include_router(ai_mock.router)
app.include_router(export_api.router)

@app.get("/")
def home():
    return {"status": "Backend działa!"}


