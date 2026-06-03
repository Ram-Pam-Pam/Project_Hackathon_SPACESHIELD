from fastapi import APIRouter
import os
from utils.gemini_agent import analizuj_surowe_zdjecie

router = APIRouter(prefix="/api/test-ai", tags=["Testy AI"])

@router.get("/raw-vision")
async def testuj_wizje_gemini():
    """
    Bierze pierwsze lepsze zdjęcie z folderu data/images/ i wysyła do AI.
    """
    # Szukamy folderu ze zdjęciami
    IMAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "images")

    # Pobieramy pełne ścieżki do plików, by móc sprawdzić ich metadane
    pliki = [os.path.join(IMAGE_DIR, f) for f in os.listdir(IMAGE_DIR) if f.endswith(".jpg")]

    if not pliki:
        return {"błąd": "Najpierw pobierz jakieś zdjęcie mapboxem!"}

    # Sortujemy pliki od najnowszego do najstarszego
    pliki.sort(key=os.path.getmtime, reverse=True)

    pelna_sciezka = pliki[0]
    nazwa_pliku = os.path.basename(pelna_sciezka)
    
    
    # Uruchamiamy AI
    wynik_analizy = analizuj_surowe_zdjecie(pelna_sciezka)
    
    return {
        "analizowany_plik": pliki[0],
        "werdykt_ai": wynik_analizy
    }
