from fastapi import APIRouter, HTTPException
from utils.sat_fetcher import pobierz_satelite_mapbox

router = APIRouter(prefix="/api/geo", tags=["Geolokalizacja i Satelita"])

@router.get("/fetch-satellite")
async def pobierz_zdjecie_satelitarne(lat: float = 50.5826, lon: float = 22.0536, zoom: int = 16):
    """
    Pobiera zdjęcie satelitarne z kosmosu dla wskazanych współrzędnych (lat, lon).
    Domyślnie ustawione na centrum Stalowej Woli.
    """
    try:
        sciezka = await pobierz_satelite_mapbox(lat, lon, zoom)
        return {
            "status": "sukces",
            "wiadomosc": "Zdjęcie satelitarne pobrane pomyślnie!",
            "zapisano_w": sciezka
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))