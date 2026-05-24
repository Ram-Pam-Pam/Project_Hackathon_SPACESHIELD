from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from utils.gemini_agent import analizuj_biala_plame

# Nazwa w dokumentacji nadal będzie ładna, mimo nazwy pliku
router = APIRouter(prefix="/api/analiza", tags=["Analiza Białych Plam i Mapy"])

class ZadanieAnalizy(BaseModel):
    id_opcji: str
    kontekst_czasowy: str = "Brak specyficznej pory"
    id_plamy: Optional[str] = None  # Wypełniane, gdy klikną gotową plamę
    lat: Optional[float] = None     # Wypełniane, gdy klikną "gdziekolwiek" na mapie
    lng: Optional[float] = None     # Wypełniane, gdy klikną "gdziekolwiek" na mapie

@router.post("/generuj")
async def generuj_raport(request: ZadanieAnalizy):
    """
    Odbiera zadanie z Frontendu. Obsługuje i gotowe Białe Plamy, i kliknięcia gdziekolwiek.
    """
    # Tymczasowe zdjęcie awaryjne - do testów z frontendem (później tu wepniecie Geoportal)
    sciezka_zdjecia = "data/images/sat_50.5826_22.0536.jpg" 
    
    if request.lat and request.lng:
        print(f"[API] Analiza dynamiczna dla współrzędnych: {request.lat}, {request.lng}")
        # TUTAJ PÓŹNIEJ DODAMY: sciezka_zdjecia = pobierz_wcs_geoportal(request.lat, request.lng)
    elif request.id_plamy:
        print(f"[API] Analiza predefiniowanej Białej Plamy: {request.id_plamy}")
        # TUTAJ PÓŹNIEJ DODAMY: sciezka_zdjecia = f"data/labeled_images/{request.id_plamy}.jpg"
        
    # Odpalamy AI z nowymi instrukcjami i kontekstem czasowym
    wynik_json = analizuj_biala_plame(request.id_opcji, sciezka_zdjecia, request.kontekst_czasowy)
    
    return wynik_json