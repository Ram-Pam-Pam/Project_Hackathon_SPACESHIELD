import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Importujemy funkcje do AI i pobierania zdjęć z Waszych utilsów
from utils.gemini_agent import analizuj_biala_plame
from utils.sat_fetcher import pobierz_satelite_mapbox

router = APIRouter(prefix="/api/analiza", tags=["Analiza Białych Plam i Mapy"])

class ZadanieAnalizy(BaseModel):
    id_opcji: str
    kontekst_czasowy: str = "Brak specyficznej pory"
    id_plamy: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

@router.post("/generuj")
async def generuj_raport(request: ZadanieAnalizy):
    """
    Odbiera zadanie z Frontendu. Obsługuje i gotowe Białe Plamy, i kliknięcia gdziekolwiek.
    Teraz pociągnie PRAWDZIWE zdjęcie satelitarne!
    """
    sciezka_zdjecia = None
    
    # 1. Pobieranie zdjęcia satelitarnego (jeśli mamy koordynaty)
    if request.lat is not None and request.lng is not None:
        print(f"[API] Analiza dynamiczna dla współrzędnych: {request.lat}, {request.lng}")
        try:
            # Używamy Waszego pobieracza - ważne żeby klucz Mapbox był w .env!
            sciezka_zdjecia = await pobierz_satelite_mapbox(request.lat, request.lng)
            print(f"[API] Zdjęcie satelitarne pobrane i zapisane: {sciezka_zdjecia}")
        except Exception as e:
            print(f"[API BŁĄD] Nie udało się pobrać zdjęcia z Mapbox: {e}")
            raise HTTPException(status_code=500, detail=f"Błąd Mapbox API: {str(e)}")
            
    # 2. Fallback na z góry zapisaną plamę (awaryjnie, gdyby nie było lat/lng)
    elif request.id_plamy:
        print(f"[API] Analiza predefiniowanej Białej Plamy bez koordynatów: {request.id_plamy}")
        sciezka_zdjecia = "data/images/sat_50.5826_22.0536.jpg"
        
    if not sciezka_zdjecia or not os.path.exists(sciezka_zdjecia):
         raise HTTPException(status_code=404, detail="Zdjęcie do analizy nie zostało znalezione ani pobrane.")
        
    # 3. Odpalamy AI z dynamicznym zdjęciem i kontekstem
    print(f"[API] Wysyłam zdjęcie {sciezka_zdjecia} do Gemini...")
    wynik_json = analizuj_biala_plame(request.id_opcji, sciezka_zdjecia, request.kontekst_czasowy)
    
    return wynik_json