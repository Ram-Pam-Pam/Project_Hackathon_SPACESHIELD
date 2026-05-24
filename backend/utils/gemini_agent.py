import os

# Dynamic path configuration for both Windows local and Render Linux
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Optional: set pyproj paths only if they exist locally on Windows
PROJ_DIR_MOCK = r'C:\Studia\HACKHATHON_STALOWA\venv\Lib\site-packages\pyproj\proj_dir\share\proj'
if os.name == 'nt' and os.path.exists(PROJ_DIR_MOCK):
    os.environ['PROJ_DATA'] = PROJ_DIR_MOCK
    os.environ['PROJ_LIB'] = PROJ_DIR_MOCK

from dotenv import load_dotenv
from PIL import Image
from google import genai
from google.genai import types

try:
    from utils.sat_fetcher import pobierz_wcs_geoportal
    from utils.transport_data import generuj_kafelek_i_json, polacz_wyniki_z_baza, _sanitize_gdf
except ModuleNotFoundError:
    from sat_fetcher import pobierz_wcs_geoportal
    from transport_data import generuj_kafelek_i_json, polacz_wyniki_z_baza, _sanitize_gdf

import asyncio
import json
from pydantic import BaseModel
from typing import List

# --- SCHEMAT ODPOWIEDZI ---
class ObiektAnalityczny(BaseModel):
    id: str
    status: str
    wnioski: str

class RaportAnalityczny(BaseModel):
    podsumowanie_obszaru: str
    wykryte_anomalie: List[str]
    szczegoly_obiektow: List[ObiektAnalityczny]

# --- ŚCIEŻKI ---
GPKG_PATH = os.path.join(BASE_DIR, "data", "main_db_coded.gpkg")
IMG_PATH = os.path.join(BASE_DIR, "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
JSON_OUT = os.path.join(BASE_DIR, "data", "file.json")
WYNIKI_GPKG = os.path.join(BASE_DIR, "data", "wyniki_na_mapie.gpkg")
WYNIKI_GEOJSON = os.path.join(BASE_DIR, "data", "wyniki_dashboard.geojson")
WYNIKI_JSON = os.path.join(BASE_DIR, "data", "wyniki_gemini.json")

# --- KLIENT ---
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analizuj_surowe_zdjecie(sciezka_do_zdjecia: str, json_path: str) -> dict:
    img = Image.open(sciezka_do_zdjecia)

    # Wczytaj JSON z atrybutami
    with open(json_path, encoding='utf-8') as f:
        dane_json = json.load(f)

    prompt = """
Jesteś profesjonalnym analitykiem danych przestrzennych.
Ten obszar został wyznaczony jako wykluczony komunikacyjnie.
- Czerwony kolor = budynki niemieszkalne
- Niebieski kolor = chodniki
- Fioletowy = drogi
- Labelki na obiektach = ich id (kod_ai)
- Plik JSON zawiera szczegółowe atrybuty każdego obiektu powiązane z labelką

Analizuj holistycznie — nie skupiaj się na pojedynczych małych obiektach.
W przypadku budynków ze znaną nazwą podawaj ją.

Zwróć wynik TYLKO jako JSON (bez markdown, bez komentarzy) w formacie:
{
  "podsumowanie_obszaru": "...",
  "wykryte_anomalie": ["...", "..."],
  "szczegoly_obiektow": [
    {"id": "XXXX", "status": "...", "wnioski": "..."}
  ]
}

Uwzględnij tylko obiekty o największym negatywnym wpływie, możliwe do poprawy na poziomie miasta.
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",  # gemini-3.5-flash nie istnieje
        contents=[
            prompt,
            img,
            f"Dane atrybutowe obiektów:\n{json.dumps(dane_json, ensure_ascii=False)}"
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        )
    )

    wyniki = json.loads(response.text)
    return wyniki


if __name__ == "__main__":
    # 1. Pobierz ortofotomapę
    print("Pobieranie ortofotomapy...")
    sciezka_do_tiff = asyncio.run(pobierz_wcs_geoportal("50.582", "22.053"))

    # 2. Generuj kafelek + JSON atrybutów
    print("Generowanie kafelka i JSON...")
    json_path, img_path = generuj_kafelek_i_json(
        ortho_path=sciezka_do_tiff,
        gpkg_path=GPKG_PATH,
        plik_wyjsciowy_img=IMG_PATH,
        plik_wyjsciowy_json=JSON_OUT,
    )

    # 3. Analiza Gemini
    print("Analiza Gemini...")
    wyniki = analizuj_surowe_zdjecie(img_path, json_path)
    print("Wyniki Gemini:")
    print(json.dumps(wyniki, indent=2, ensure_ascii=False))

    # 4. Zapisz wyniki Gemini do JSON
    with open(WYNIKI_JSON, 'w', encoding='utf-8') as f:
        json.dump(wyniki, f, ensure_ascii=False, indent=2)
    print(f"Wyniki zapisane do: {WYNIKI_JSON}")

    # 5. Połącz z geometrią z GPKG po kod_ai
    print("Łączenie z bazą geometrii...")
    gdf_wyniki = polacz_wyniki_z_baza(
        wyniki_gemini=wyniki['szczegoly_obiektow'],
        gpkg_path=GPKG_PATH,
        plik_wyjsciowy=WYNIKI_GPKG
    )

# 6. Eksport do GeoJSON dla dashboardu
    gdf_export = gdf_wyniki.to_crs(epsg=4326)
    gdf_export = _sanitize_gdf(gdf_export)  # sanitize again for GeoJSON
    gdf_export.to_file(WYNIKI_GEOJSON, driver='GeoJSON')
