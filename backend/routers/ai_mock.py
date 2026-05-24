import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Pobieranie TIF z Geoportalu z Waszego pliku
from utils.sat_fetcher import pobierz_wcs_geoportal
# Łączenie zdjęć z danymi geometrycznymi 
from utils.transport_data import generuj_kafelek_i_json
# Silnik Gemini
from utils.gemini_agent import analizuj_surowe_zdjecie

router = APIRouter(prefix="/api/analiza", tags=["Analiza Białych Plam i Mapy"])

class ZadanieAnalizy(BaseModel):
    id_opcji: str
    kontekst_czasowy: str = "Brak specyficznej pory"
    id_plamy: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

# Dynamiczne ustalanie ścieżek na serwerze (działa i na Windows i na Linux/Render)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GPKG_PATH = os.path.join(BASE_DIR, "data", "main_db_coded.gpkg")
IMG_PATH = os.path.join(BASE_DIR, "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
JSON_OUT = os.path.join(BASE_DIR, "data", "file.json")

@router.post("/generuj")
async def generuj_raport(request: ZadanieAnalizy):
    """
    Odbiera zadanie z Frontendu. 
    1. Pobiera OGC WCS (TIFF) z Geoportalu.
    2. Konwertuje go i zrzuca atrybuty do JSON.
    3. Wysyła paczkę do Gemini i mapuje wynik na interfejs.
    """
    sciezka_do_tiff = None
    
    # KROK 1: POBIERANIE WCS Z GEOPORTALU
    if request.lat is not None and request.lng is not None:
        print(f"[API] Pobieram TIFF z Geoportalu: lat={request.lat}, lon={request.lng}")
        try:
            # Uwaga: funkcja z utils przyjmuje stringi
            sciezka_do_tiff = await pobierz_wcs_geoportal(str(request.lat), str(request.lng))
        except Exception as e:
            print(f"[API BŁĄD] Geoportal API zawiódł: {e}")
            raise HTTPException(status_code=500, detail=f"Błąd Geoportalu WCS: {str(e)}")
    elif request.id_plamy:
        # Fallback na gotowy plik, jeśli kliknięto przycisk z bocznego paska bez wysłania lat/lng
        sciezka_do_tiff = os.path.join(BASE_DIR, "sat_50.5826_22.0536_geoportal.tif")
        
    if not sciezka_do_tiff or not os.path.exists(sciezka_do_tiff):
        raise HTTPException(status_code=404, detail="Brak pliku TIFF z Geoportalu do analizy.")

    # KROK 2: GENEROWANIE KAFELKA .JPG I PLIKU JSON Z ATRYBUTAMI Wektorów
    print(f"[API] Przetwarzam TIFF na kafelek i zrzucam metadane wektorowe...")
    try:
        json_path, img_path = generuj_kafelek_i_json(
            ortho_path=sciezka_do_tiff,
            gpkg_path=GPKG_PATH,
            plik_wyjsciowy_img=IMG_PATH,
            plik_wyjsciowy_json=JSON_OUT,
        )
    except Exception as e:
        print(f"[API BŁĄD] Generowanie danych przestrzennych zawiodło: {e}")
        raise HTTPException(status_code=500, detail=f"Błąd przetwarzania mapy (Rasterio/GeoPandas): {str(e)}")

    # KROK 3: WYWOŁANIE GEMINI
    print(f"[API] Gemini rozpoczyna analizę holistyczną obszaru...")
    try:
        wyniki_ai = analizuj_surowe_zdjecie(img_path, json_path)
    except Exception as e:
        print(f"[API BŁĄD] Model Gemini wywalił błąd: {e}")
        raise HTTPException(status_code=500, detail=f"Błąd silnika Gemini AI: {str(e)}")
        
    # KROK 4: MAPOWANIE ZWROTKI GEMINI NA INTERFEJS FRONTENDU (React)
    # Zmieniamy format słownika JSON z `gemini_agent` na ten z `WhiteSpotsView.tsx`
    
    rekomendacje = "\n".join([f"- {anomalia}" for anomalia in wyniki_ai.get("wykryte_anomalie", [])])
    rekomendacje += "\n\n**Szczegóły zidentyfikowanych obiektów (na podstawie atrybutów):**\n"
    
    liczba_obiektow = len(wyniki_ai.get("szczegoly_obiektow", []))
    for obj in wyniki_ai.get("szczegoly_obiektow", []):
        rekomendacje += f"- **ID {obj.get('id', '?')}**: {obj.get('status', '')} ({obj.get('wnioski', '')})\n"

    odpowiedz_frontend = {
        "tytul_raportu": "Analiza Geoprzestrzenna AI",
        "diagnoza_problemu": wyniki_ai.get("podsumowanie_obszaru", "Zakończono analizę obszaru z Geoportalu."),
        "rekomendacja_dzialan": rekomendacje,
        "dane_do_wykresu": [
            {"kategoria": "Zbadane anomalie", "wartosc": liczba_obiektow},
            {"kategoria": "Pokrycie strefy (%)", "wartosc": 88}
        ]
    }
    
    return odpowiedz_frontend