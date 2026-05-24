import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/map", tags=["Mapa i Dane"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

@router.get("/layers/{filename}")
def pobierz_warstwe(filename: str):
    """Zwraca pliki GeoJSON dla warstw analitycznych"""
    file_path = os.path.join(DATA_DIR, f"{filename}.geojson")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Plik warstwy nie istnieje w folderze data.")
    
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/problems")
def pobierz_problemy():
    """Wysyła zidentyfikowane Białe Plamy, które frontend generuje jako listę anomalii"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [22.052, 50.569]}, 
                "properties": {"id": 1, "opis": "Korytarz Al. Jana Pawła II. Dublowanie tras autobusowych i niskie napełnienie."}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [22.062, 50.555]},
                "properties": {"id": 2, "opis": "Strefa Przemysłowa HSW. Niedopasowanie godzin kursów do zmian pracowniczych."}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [22.049, 50.590]},
                "properties": {"id": 3, "opis": "Dzielnica Rozwadów. Teren obsługiwany wozami 12m pomimo niskiej gęstości zabudowy."}
            }
        ]
    }