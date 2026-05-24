import os
from dotenv import load_dotenv
from PIL import Image
from google import genai
from sat_fetcher import pobierz_wcs_geoportal
from transport_data import generuj_kafelek_i_json
import asyncio
# ładowanie .env
load_dotenv()

# klient Gemini
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analizuj_surowe_zdjecie(sciezka_do_zdjecia: str, json) -> str:
    """
    Analiza zdjęcia satelitarnego / miejskiego przez Gemini
    """
    # wczytanie obrazu
    img = Image.open(sciezka_do_zdjecia)
    json_str = json.dumps(json)
    prompt = """
jesteś profesjoanlnym analitykiem danych, ten obszar został wyznaczony jako wykluczony komunikacyujnie - z różnych względów, czerwony kolor to drogi, niebskie to linie kolejkowe, labelki na obiektach to ich id, zsórć mi wynik analityczny, budynki mają pomarańczowy back, w pliku json masz szczegóły wiążące labelki z danymi, zwróć mi wynik a nalityczny wiążący sytuację z danymi opisowymi 


    """

    print(f"[AI] Analiza obrazu: {sciezka_do_zdjecia}")

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=[prompt, img, json_str]
    )

    return response.text


sciezka_do_tiff = asyncio.run(pobierz_wcs_geoportal("50.582", "22.053"))
json, img  = generuj_kafelek_i_json(sciezka_do_tiff, r"C:\Studia\HACKHATHON_STALOWA\DATA\polygons\main_db.gpkg")
analizuj_surowe_zdjecie(sciezka_do_tiff, json)