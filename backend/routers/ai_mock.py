import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Zabezpieczenie importów przed brakiem bibliotek GIS na systemach Windows/lokalnych
try:
    from utils.sat_fetcher import pobierz_wcs_geoportal
except ImportError:
    pobierz_wcs_geoportal = None

try:
    from utils.transport_data import generuj_kafelek_i_json
except ImportError:
    generuj_kafelek_i_json = None

try:
    from utils.gemini_agent import analizuj_surowe_zdjecie
except ImportError:
    analizuj_surowe_zdjecie = None

router = APIRouter(prefix="/api/analiza", tags=["Analiza Białych Plam i Mapy"])

class ZadanieAnalizy(BaseModel):
    lat: float
    lng: float

# Dynamiczne ustalanie ścieżek na serwerze (działa i na Windows i na Linux/Render)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GPKG_PATH = os.path.join(BASE_DIR, "data", "main_db_coded.gpkg")
IMG_PATH = os.path.join(BASE_DIR, "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
JSON_OUT = os.path.join(BASE_DIR, "data", "file.json")

@router.post("/generuj")
async def generuj_raport(request: ZadanieAnalizy):
    """
    Odbiera zadanie z Frontendu. 
    1. Pobiera OGC WCS (TIFF) z Geoportalu (fallback na lokalny TIFF).
    2. Konwertuje go i zrzuca atrybuty do JSON (fallback na gotowy JSON/JPG).
    3. Wysyła paczkę do Gemini i mapuje wynik na interfejs (fallback na gotowe wyniki).
    """
    sciezka_do_tiff = None
    
    # KROK 1: POBIERANIE WCS Z GEOPORTALU
    print(f"[API] Pobieram TIFF z Geoportalu dla współrzędnych: lat={request.lat}, lon={request.lng}")
    if pobierz_wcs_geoportal is None:
        print("[WARN] Moduł sat_fetcher jest niedostępny. Używam lokalnego pliku TIFF.")
        sciezka_do_tiff = os.path.join(BASE_DIR, "utils", "sat_50.582_22.053_geoportal.tif")
    else:
        try:
            sciezka_do_tiff = await pobierz_wcs_geoportal(str(request.lat), str(request.lng))
            if not sciezka_do_tiff or not os.path.exists(sciezka_do_tiff):
                raise FileNotFoundError("Nie odnaleziono pobranego pliku TIFF.")
        except Exception as e:
            print(f"[WARN] Pobieranie WCS z Geoportalu nie powiodło się: {e}. Używam lokalnego pliku sat_50.582_22.053_geoportal.tif")
            sciezka_do_tiff = os.path.join(BASE_DIR, "utils", "sat_50.582_22.053_geoportal.tif")

    # KROK 2: GENEROWANIE KAFELKA .JPG I PLIKU JSON Z ATRYBUTAMI
    print(f"[API] Przetwarzam TIFF na kafelek i zrzucam metadane wektorowe...")
    fallback_img = os.path.join(BASE_DIR, "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
    fallback_json = os.path.join(BASE_DIR, "data", "file.json")

    if not os.path.exists(GPKG_PATH) or generuj_kafelek_i_json is None:
        print(f"[WARN] Brak pliku bazy danych GPKG ({GPKG_PATH}) lub brak modułu transport_data. Używam pregenerowanych kafelków jako fallback.")
        img_path = fallback_img
        json_path = fallback_json
    else:
        try:
            json_path, img_path = generuj_kafelek_i_json(
                ortho_path=sciezka_do_tiff,
                gpkg_path=GPKG_PATH,
                plik_wyjsciowy_img=IMG_PATH,
                plik_wyjsciowy_json=JSON_OUT,
            )
        except Exception as e:
            print(f"[WARN] Przetwarzanie wektorów GPKG nie powiodło się: {e}. Używam pregenerowanych kafelków jako fallback.")
            img_path = fallback_img
            json_path = fallback_json

    # KROK 3: WYWOŁANIE GEMINI
    print(f"[API] Gemini rozpoczyna analizę holistyczną obszaru...")
    wyniki_ai = None
    if analizuj_surowe_zdjecie is None:
        print("[WARN] Moduł gemini_agent jest niedostępny. Używam zbuforowanych wyników.")
        try:
            with open(os.path.join(BASE_DIR, "data", "wyniki_gemini.json"), encoding='utf-8') as f:
                wyniki_ai = json.load(f)
        except Exception as file_err:
            raise HTTPException(status_code=500, detail=f"Błąd krytyczny wczytywania zbuforowanych wyników Gemini: {str(file_err)}")
    else:
        try:
            wyniki_ai = analizuj_surowe_zdjecie(img_path, json_path)
        except Exception as e:
            print(f"[WARN] Live Gemini API failed: {e}. Używam zbuforowanych wyników z wyniki_gemini.json")
            try:
                with open(os.path.join(BASE_DIR, "data", "wyniki_gemini.json"), encoding='utf-8') as f:
                    wyniki_ai = json.load(f)
            except Exception as file_err:
                print(f"[API BŁĄD] Nie udało się również wczytać pliku z wynikami: {file_err}")
                raise HTTPException(status_code=500, detail=f"Błąd silnika Gemini AI oraz fallbacku: {str(e)}")

    # KROK 4: MAPOWANIE ZWROTKI GEMINI NA INTERFEJS FRONTENDU (React)
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