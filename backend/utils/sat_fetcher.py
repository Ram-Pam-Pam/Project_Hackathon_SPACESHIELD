import asyncio
import httpx
from pyproj import Transformer
import os


# Zakładam, że masz ten import w swoim środowisku:
# from transport_data import generuj_kafelek_i_json

async def pobierz_wcs_geoportal(lat: str, lon: str, wielkosc_obszaru_m: float = 400.0) -> str:
    """
    Pobiera wycinek ortofotomapy z Geoportalu używając czystego standardu OGC WCS 1.0.0.
    """
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True)
    x, y = transformer.transform(float(lon), float(lat))

    polowa = wielkosc_obszaru_m / 2
    minx = x - polowa
    miny = y - polowa
    maxx = x + polowa
    maxy = y + polowa

    # Endpoint WCS
    wcs_url = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WCS/StandardResolution"

    # ZGODNIE ZE SPECYFIKACJĄ OGC WCS 1.0.0
    params = {
        "SERVICE": "WCS",
        "VERSION": "1.0.0",  # Standard WCS to 1.0.0 (WMS używa 1.1.1)
        "REQUEST": "GetCoverage",
        "COVERAGE": "orthoimagery_StandardResolution",  # W WCS używamy COVERAGE, a nie LAYERS
        "BBOX": f"{minx},{miny},{maxx},{maxy}",
        "CRS": "EPSG:2180",
        "FORMAT": "image/tiff",  # Zgodnie z OGC dla Geoportalu to "GeoTIFF"
        "WIDTH": "2000",
        "HEIGHT": "2000"
    }

    print(f"Pobieranie obrazu z Geoportalu WCS (obszar {wielkosc_obszaru_m}x{wielkosc_obszaru_m}m)...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(wcs_url, params=params)

    # ZABEZPIECZENIE: Sprawdzamy czy Geoportal nie wysłał XML-a (ServiceExceptionReport)
    content_type = response.headers.get("Content-Type", "")
    if "xml" in content_type.lower() or "text" in content_type.lower():
        print("UWAGA! Geoportal zwrócił błąd OGC (XML) zamiast zdjęcia:")
        print(response.text)
        raise ValueError("Awaria Geoportalu - pobrano XML zamiast TIFF.")

    if response.status_code == 200:
        sciezka_do_tiffa = f"sat_{lat}_{lon}_geoportal.tif"

        try:
            import rasterio
            from rasterio.io import MemoryFile
            from rasterio.transform import from_bounds

            # Wczytujemy surowy TIFF jako MemoryFile i upewniamy się, że ma metadane przestrzenne
            with MemoryFile(response.content) as memfile:
                with memfile.open() as src:
                    profile = src.profile
                    profile.update(
                        crs="EPSG:2180",
                        transform=from_bounds(minx, miny, maxx, maxy, int(params["WIDTH"]), int(params["HEIGHT"]))
                    )
                    with rasterio.open(sciezka_do_tiffa, 'w', **profile) as dst:
                        dst.write(src.read())
        except Exception as e:
            print(f"Ostrzeżenie przy zapisie metadanych georeferencyjnych: {e}")
            with open(sciezka_do_tiffa, "wb") as f:
                f.write(response.content)

        # Ostatni test w locie (czy plik na pewno coś waży, np. >10KB)
        if os.path.getsize(sciezka_do_tiffa) < 10000:
            raise ValueError("Pobrany plik to fejkowy TIFF (jest za mały!).")

        print(f"Pobrano i zapisano prawdziwy GeoTIFF zgodny z OGC: {sciezka_do_tiffa}")
        return sciezka_do_tiffa
    else:
        raise Exception(f"Błąd HTTP {response.status_code}")


if __name__ == "__main__":
    # MA BYĆ: lat = 50.582, lon = 22.053
    asyncio.run(pobierz_wcs_geoportal("50.582", "22.053"))