from fastapi import APIRouter
from pydantic import BaseModel
from utils.gemini_agent import analizuj_biala_plame

# Zmieniamy prefix i tagi, żeby w Swaggerze (docs) ładnie to wyglądało
router = APIRouter(prefix="/api/analiza", tags=["Analiza Białych Plam"])

# 1. Definiujemy nową strukturę danych dostosowaną do Waszego konceptu
class ZadanieAnalizy(BaseModel):
    id_plamy: str   # Frontend prześle np. "plama_centrum"
    id_opcji: str   # Frontend prześle np. "opcja_3" (w zależności od klikniętego przycisku)

@router.post("/generuj")
async def generuj_raport_z_plamy(request: ZadanieAnalizy):
    """
    Odbiera informacje o klikniętej białej plamie i wybranej opcji (z 6 możliwych).
    Wysyła odpowiednie instrukcje wraz ze zdjęciem do Gemini i zwraca czysty JSON dla dashboardu.
    """
    # 2. Na razie na sztywno podpinamy to surowe zdjęcie Stalowej Woli, które masz już w folderze.
    # Kiedy Karol przygotuje olabelowane zdjęcia, zmienimy tę ścieżkę, np. na:
    # sciezka_zdjecia = f"data/labeled_images/{request.id_plamy}.jpg"
    sciezka_zdjecia = "data/images/sat_50.5826_22.0536.jpg"
    
    # 3. Wywołujemy funkcję z nowego gemini_agent.py
    wynik_json = analizuj_biala_plame(request.id_opcji, sciezka_zdjecia)
    
    return wynik_json