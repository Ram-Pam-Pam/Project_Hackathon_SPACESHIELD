import os
import httpx
from dotenv import load_dotenv

# Ładujemy klucz z pliku .env
load_dotenv()

# Ustalany ścieżkę do zapisu obrazków: data/images
IMAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "images")
os.makedirs(IMAGE_DIR, exist_ok=True)

async def pobierz_satelite_mapbox(lat: float, lon: float, zoom: int = 16) -> str:
    """
    Pobiera zdjęcie satelitarne z Mapboxa dla podanych współrzędnych
    i zapisuje je na dysku w folderze data/images/.
    Zwraca ścieżkę do zapisanego pliku pliku.
    """
    api_key = os.getenv("MAPBOX_API_KEY")
    if not api_key:
        raise ValueError("Brak klucza MAPBOX_API_KEY w pliku .env! Sprawdź czy plik istnieje i czy klucz jest poprawny.")

    # API Mapbox wymaga formatu: długość (lon), szerokość (lat)
    # Pobieramy kwadratowy obrazek o rozmiarze 600x600 pikseli w trybie satelitarnym
    url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lon},{lat},{zoom},0/600x600?access_token={api_key}"
    
    nazwa_pliku = f"sat_{lat}_{lon}.jpg"
    sciezka_zapisu = os.path.join(IMAGE_DIR, nazwa_pliku)

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        
        if response.status_code == 200:
            with open(sciezka_zapisu, "wb") as plik:
                plik.write(response.content)
            return sciezka_zapisu
        else:
            raise Exception(f"Mapbox API zwrócił błąd! Kod: {response.status_code}, Treść: {response.text}")