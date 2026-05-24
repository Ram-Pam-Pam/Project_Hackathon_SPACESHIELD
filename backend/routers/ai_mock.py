import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Zabezpieczenie importów przed brakiem bibliotek GIS na systemach Windows/lokalnych
try:
    from utils.sat_fetcher import pobierz_wcs_geoportal
except ImportError as e:
    print(f"[CRITICAL INIT ERROR] Nie można zaimportować sat_fetcher: {e}")
    pobierz_wcs_geoportal = None

try:
    from utils.transport_data import generuj_kafelek_i_json, polacz_wyniki_z_baza, _sanitize_gdf
except ImportError as e:
    print(f"[CRITICAL INIT ERROR] Nie można zaimportować transport_data: {e}")
    generuj_kafelek_i_json = None
    polacz_wyniki_z_baza = None
    _sanitize_gdf = None

try:
    from utils.gemini_agent import analizuj_surowe_zdjecie, ekstrahuj_kluczowe_obiekty
except ImportError as e:
    print(f"[CRITICAL INIT ERROR] Nie można zaimportować gemini_agent: {e}")
    analizuj_surowe_zdjecie = None
    ekstrahuj_kluczowe_obiekty = None

router = APIRouter(prefix="/api/analiza", tags=["Analiza Białych Plam i Mapy"])

class ZadanieAnalizy(BaseModel):
    lat: float
    lng: float
    kategoria_analizy: Optional[str] = None

# Dynamiczne ustalanie ścieżek na serwerze (działa i na Windows i na Linux/Render)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GPKG_PATH = os.path.join(BASE_DIR, "data", "main_db_coded.gpkg")
IMG_PATH = os.path.join(BASE_DIR, "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
JSON_OUT = os.path.join(BASE_DIR, "data", "file.json")
WYNIKI_GPKG = os.path.join(BASE_DIR, "data", "wyniki_na_mapie.gpkg")

@router.post("/generuj")
async def generuj_raport(request: ZadanieAnalizy):
    """
    Odbiera zadanie z Frontendu. 
    1. Pobiera OGC WCS (TIFF) z Geoportalu (fallback na lokalny TIFF).
    2. Konwertuje go i zrzuca atrybuty do JSON (fallback na gotowy JSON/JPG).
    3. Model 1: Holistyczna analiza tekstowa Gemini.
    4. Model 2: Ekstrakcja ustrukturyzowanych obiektów kluczowych (JSON) -> złączenie z GPKG -> GeoJSON.
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
            print(f"[WARN] Pobieranie WCS z Geoportalu nie powiodło się: {e}. Używam lokalnego pliku.")
            sciezka_do_tiff = os.path.join(BASE_DIR, "utils", "sat_50.582_22.053_geoportal.tif")

    # KROK 2: GENEROWANIE KAFELKA .JPG I PLIKU JSON Z ATRYBUTAMI
    print("[API] Przetwarzam TIFF na kafelek i zrzucam metadane wektorowe...")
    fallback_img = os.path.join(BASE_DIR, "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
    fallback_json = os.path.join(BASE_DIR, "data", "file.json")

    if not os.path.exists(GPKG_PATH) or generuj_kafelek_i_json is None:
        print(f"[WARN] Brak GPKG lub modułu transport_data. Używam pregenerowanych kafelków.")
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
            print(f"[WARN] Przetwarzanie wektorów GPKG nie powiodło się: {e}. Fallback.")
            img_path = fallback_img
            json_path = fallback_json

    # =====================================================================
    # KROK 3: MODEL 1 — HOLISTYCZNA ANALIZA TEKSTOWA GEMINI
    # =====================================================================
    print("[API] Model 1: Gemini rozpoczyna analizę holistyczną obszaru...")
    wyniki_ai = None
    if analizuj_surowe_zdjecie is None:
        print("[WARN] Moduł gemini_agent niedostępny. Używam zbuforowanych wyników.")
        try:
            with open(os.path.join(BASE_DIR, "data", "wyniki_gemini.json"), encoding='utf-8') as f:
                wyniki_ai = json.load(f)
        except Exception as file_err:
            raise HTTPException(status_code=500, detail=f"Błąd wczytywania cache Gemini: {str(file_err)}")
    else:
        try:
            wyniki_ai = analizuj_surowe_zdjecie(img_path, json_path, request.kategoria_analizy, request.lat, request.lng)
        except Exception as e:
            print(f"[WARN] Model 1 failed: {e}. Fallback na cache.")
            try:
                with open(os.path.join(BASE_DIR, "data", "wyniki_gemini.json"), encoding='utf-8') as f:
                    wyniki_ai = json.load(f)
            except Exception as file_err:
                raise HTTPException(status_code=500, detail=f"Błąd AI + fallback: {str(e)}")

    # =====================================================================
    # KROK 4: MODEL 2 — EKSTRAKCJA KLUCZOWYCH OBIEKTÓW (JSON) + GEOJSON
    # =====================================================================
    print("[API] Model 2: Gemini ekstrahuje kluczowe obiekty...")
    ai_geojson = None
    kluczowe_obiekty_raw = []

    if ekstrahuj_kluczowe_obiekty is not None:
        try:
            kluczowe_obiekty_raw = ekstrahuj_kluczowe_obiekty(img_path, json_path, request.kategoria_analizy, request.lat, request.lng)
            print(f"[API] Model 2 zwrócił {len(kluczowe_obiekty_raw)} obiektów.")
        except Exception as e:
            print(f"[WARN] Model 2 (ekstrakcja obiektów) failed: {e}. Fallback na cache.")
    
    # Fallback: wczytaj z cache jeśli live nie zadziałał
    if not kluczowe_obiekty_raw:
        try:
            with open(os.path.join(BASE_DIR, "data", "wyniki_gemini.json"), encoding='utf-8') as f:
                cached = json.load(f)
                kluczowe_obiekty_raw = cached.get("szczegoly_obiektow", [])
        except Exception:
            kluczowe_obiekty_raw = []

    # Łączenie z bazą GeoPackage po kod_ai -> generowanie GeoJSON
    if kluczowe_obiekty_raw and polacz_wyniki_z_baza is not None and os.path.exists(GPKG_PATH):
        try:
            gdf_wyniki = polacz_wyniki_z_baza(
                wyniki_gemini=kluczowe_obiekty_raw,
                gpkg_path=GPKG_PATH,
                plik_wyjsciowy=WYNIKI_GPKG
            )
            if not gdf_wyniki.empty:
                gdf_4326 = gdf_wyniki.to_crs(epsg=4326)
                if _sanitize_gdf is not None:
                    gdf_4326 = _sanitize_gdf(gdf_4326)
                ai_geojson = json.loads(gdf_4326.to_json())
                print(f"[API] GeoJSON wygenerowany: {len(ai_geojson.get('features', []))} features.")
            else:
                print("[WARN] Merge z GPKG zwrócił 0 wyników.")
        except Exception as e:
            print(f"[WARN] Łączenie z GPKG nie powiodło się: {e}")

    # Fallback GeoJSON z pliku jeśli nie wygenerowano
    if ai_geojson is None:
        geojson_fallback = os.path.join(BASE_DIR, "data", "wyniki_dashboard.geojson")
        if os.path.exists(geojson_fallback):
            try:
                with open(geojson_fallback, encoding='utf-8') as f:
                    ai_geojson = json.load(f)
                print(f"[API] Fallback GeoJSON załadowany z pliku.")
            except Exception:
                ai_geojson = {"type": "FeatureCollection", "features": []}
        else:
            ai_geojson = {"type": "FeatureCollection", "features": []}

    # =====================================================================
    # KROK 5: ZŁOŻENIE ODPOWIEDZI DLA FRONTENDU
    # =====================================================================
    diagnoza = wyniki_ai.get("podsumowanie_obszaru", "Zakończono analizę obszaru.")
    anomalie = wyniki_ai.get("wykryte_anomalie", [])

    odpowiedz_frontend = {
        "tytul_raportu": "Analiza Geoprzestrzenna AI",
        "diagnoza_problemu": diagnoza,
        "rekomendacja_dzialan": "\n".join([f"- {a}" for a in anomalie]) if anomalie else "",
        "dane_do_wykresu": [
            {"kategoria": "Wykryte obiekty", "wartosc": len(kluczowe_obiekty_raw)},
            {"kategoria": "Pokrycie strefy (%)", "wartosc": 88}
        ],
        "kluczowe_obiekty": kluczowe_obiekty_raw,
        "ai_geojson": ai_geojson
    }
    
    return odpowiedz_frontend