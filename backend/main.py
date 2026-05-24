from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Usunąłem stąd ai_mock!
from routers import map_api, sat_api, export_api, ai_chat

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
app.include_router(export_api.router)
app.include_router(ai_chat.router)
# Usunąłem stąd app.include_router(ai_mock.router) !

@app.get("/")
def home():
    return {"status": "Backend działa!"}