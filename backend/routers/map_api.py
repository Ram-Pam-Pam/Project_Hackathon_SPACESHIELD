import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/map", tags=["Mapa i Dane"])

# Ścieżka do folderu z danymi
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# 1. RURA NA DANE OD LAURY
@router.get("/layers/{filename}")
def pobierz_warstwe(filename: str):
    """Odczytuje prawdziwe pliki np. z folderu data (np. /api/map/layers/przystanki)"""
    file_path = os.path.join(DATA_DIR, f"{filename}.geojson")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Plik nie istnieje. Niech Laura go wrzuci!")
    
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# 2. MOCK DLA AGI (Białe Plamy)
@router.get("/problems")
def pobierz_problemy():
    """Wysyła sztuczne problemy, żeby Aga mogła narysować czerwone pinezki na mapie"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [22.053, 50.582]}, # Stalowa Wola
                "properties": {"id": 1, "opis": "Brak przystanku w promieniu 800m"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [22.060, 50.575]},
                "properties": {"id": 2, "opis": "Niebezpieczne przejście przez tory"}
            }
        ]
    }