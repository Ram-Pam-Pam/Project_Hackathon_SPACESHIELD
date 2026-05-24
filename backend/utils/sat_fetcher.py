import asyncio
import httpx
from pyproj import Transformer
from transport_data import generuj_kafelek_i_json


async def pobierz_wcs_geoportal(lat: str, lon: str, wielkosc_obszaru_m: float = 400.0) -> str:
    """
    Pobiera wycinek ortofotomapy z Geoportalu (używając stabilnego WMS) jako GeoTIFF.
    """
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True)
    x, y = transformer.transform(float(lon), float(lat))

    polowa = wielkosc_obszaru_m / 2
    minx = x - polowa
    miny = y - polowa
    maxx = x + polowa
    maxy = y + polowa

    # Przełączamy z WCS na potężny i stabilny WMS Geoportalu
    wms_url = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution"

    params = {
        "SERVICE": "WMS",
        "VERSION": "1.1.1",  # 1.1.1 jest najbezpieczniejsze dla układu BBOX (X,Y)
        "REQUEST": "GetMap",
        "LAYERS": "Raster",
        "BBOX": f"{minx},{miny},{maxx},{maxy}",
        "SRS": "EPSG:2180",  # Układ 1992
        "WIDTH": "1000",  # Rozdzielczość 1000x1000 px
        "HEIGHT": "1000",
        "STYLES": "",
        "FORMAT": "image/tiff"  # Chcemy GeoTIFFa
    }

    print(f"Pobieranie obrazu z Geoportalu WMS (obszar {wielkosc_obszaru_m}x{wielkosc_obszaru_m}m)...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(wms_url, params=params)

    # ZABEZPIECZENIE: Sprawdzamy czy Geoportal nie wysłał znowu pliku tekstowego z błędem
    content_type = response.headers.get("Content-Type", "")
    if "xml" in content_type.lower() or "text" in content_type.lower():
        print("UWAGA! Geoportal zwrócił błąd zamiast zdjęcia:")
        print(response.text)
        raise ValueError("Awaria Geoportalu - pobrano XML zamiast TIFF.")

    if response.status_code == 200:
        sciezka_do_tiffa = f"sat_{lat}_{lon}_geoportal.tif"
        with open(sciezka_do_tiffa, "wb") as f:
            f.write(response.content)

        # Ostatni test w locie (czy plik na pewno coś waży, >10KB)
        import os
        if os.path.getsize(sciezka_do_tiffa) < 10000:
            raise ValueError("Pobrany plik to fejkowy TIFF (jest za mały!).")

        print(f"Pobrano i zapisano prawdziwy GeoTIFF: {sciezka_do_tiffa}")
        return sciezka_do_tiffa
    else:
        raise Exception(f"Błąd HTTP {response.status_code}")




if __name__ == "__main__":# MA BYĆ: lat = 50.582, lon = 22.053
    asyncio.run(pobierz_wcs_geoportal("50.582", "22.053"))