import json
import string
import itertools
import pandas as pd
import geopandas as gpd
import pyogrio
import rasterio
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from rasterio.plot import show
from shapely.geometry import box
from adjustText import adjust_text


def generuj_kafelek_i_json(
        ortho_path: str,
        gpkg_path: str,
        plik_wyjsciowy_img: str = 'kafelek_do_analizy_ostateczny_kolory.jpg',
        plik_wyjsciowy_json: str = 'file.json',
        nazwa_warstwy_budynkow: str = 'budynki',
        wielkosc_bufora: float = 150.0
):
    """
    Funkcja generująca wizualizację (kafelek) z danymi wektorowymi nałożonymi
    na ortofotomapę oraz eksportująca widoczne atrybuty do pliku JSON.
    """
    print("Rozpoczęcie przetwarzania danych...")

    # --- PRZYGOTOWANIE ZMIENNYCH POMOCNICZYCH ---
    layer_info = pyogrio.list_layers(gpkg_path)
    layers = [layer[0] for layer in layer_info]

    kombinacje = itertools.product(string.ascii_uppercase, repeat=4)
    generator_kodow = (''.join(k) for k in kombinacje)

    cmap = plt.get_cmap('tab20')
    lista_kolorow = [mcolors.to_hex(cmap(i)) for i in range(20)]
    kolory_iterator = itertools.cycle(lista_kolorow)

    wczytane_warstwy = {}
    slownik_kolorow_kategorii = {}

    # --- 1. WCZYTYWANIE CAŁEJ BAZY I NADAWANIE KODÓW "Z BOMBY" ---
    print("\nWczytywanie warstw i nadawanie globalnych kodów AI...")
    for layer_name in layers:
        try:
            layer = gpd.read_file(gpkg_path, layer=layer_name)
            if layer.empty:
                continue

            kody = [next(generator_kodow) for _ in range(len(layer))]
            layer['kod_ai'] = kody
            wczytane_warstwy[layer_name] = layer
            print(f"  -> Warstwa '{layer_name}': przypisano {len(layer)} kodów.")

        except Exception as e:
            print(f"Pominięto warstwę {layer_name}: {e}")

    if not wczytane_warstwy:
        raise ValueError("Brak danych wektorowych!")

    # --- 2. DOPASOWANIE CRS I FILTROWANIE DO RASTRA ---
    fig, ax = plt.subplots(figsize=(12, 12), dpi=150)

    with rasterio.open(ortho_path) as src:
        raster_crs = src.crs
        # Definiujemy obszar kafelka na podstawie całego pobranego pliku TIFF
        wycinek_box = box(*src.bounds)

        print("\nDopasowywanie układów współrzędnych do ortofotomapy...")
        for layer_name, layer_data in wczytane_warstwy.items():
            if layer_data.crs != raster_crs:
                wczytane_warstwy[layer_name] = layer_data.to_crs(raster_crs)

            wczytane_warstwy[layer_name] = wczytane_warstwy[layer_name][
                wczytane_warstwy[layer_name].intersects(wycinek_box)].copy()

        # Rysujemy pełny podkład rastrowy od razu
        show(src, ax=ax)

    # --- 3. RYSOWANIE WIZUALIZACJI WEKTORÓW ---
    wszystkie_etykiety_na_mapie = []
    przyciete_warstwy_do_jsona = {}

    print("\nPrzycinanie do kafelka i rysowanie...")
    for layer_name, layer_data in wczytane_warstwy.items():
        if layer_data.empty:
            continue

        # Tutaj brakowało drugiego argumentu (wycinek_box) w Twoim kodzie!
        layer_clipped = gpd.clip(layer_data, wycinek_box).copy()
        if layer_clipped.empty:
            continue

        kolory_dla_obiektow = []

        # SMART FILTR KATEGORII DLA BUDYNKÓW
        if layer_name == nazwa_warstwy_budynkow:
            potencjalne_kolumny = ['funkcja', 'rodzaj', 'typ', 'category', 'klasa', 'fclass']
            kolumna_kategorii = next((col for col in potencjalne_kolumny if col in layer_clipped.columns), None)

            if kolumna_kategorii:
                for kat in layer_clipped[kolumna_kategorii]:
                    kat_str = str(kat) if kat is not None else "nieznany"
                    if kat_str not in slownik_kolorow_kategorii:
                        slownik_kolorow_kategorii[kat_str] = next(kolory_iterator)
                    kolory_dla_obiektow.append(slownik_kolorow_kategorii[kat_str])
            else:
                kolor_warstwy = next(kolory_iterator)
                kolory_dla_obiektow = [kolor_warstwy] * len(layer_clipped)
        else:
            kolor_warstwy = next(kolory_iterator)
            kolory_dla_obiektow = [kolor_warstwy] * len(layer_clipped)

        layer_clipped['kolor_rysowania'] = kolory_dla_obiektow
        kolory_bezpieczne = layer_clipped['kolor_rysowania'].tolist()
        przyciete_warstwy_do_jsona[layer_name] = layer_clipped

        # RYSOWANIE GEOMETRII
        typ_geometrii = layer_clipped.iloc[0].geometry.geom_type

        if 'Polygon' in typ_geometrii or 'LineString' in typ_geometrii:
            layer_clipped.plot(ax=ax, facecolor='none', edgecolor=kolory_bezpieczne, linewidth=2.0)
        else:
            layer_clipped.plot(ax=ax, color=kolory_bezpieczne, markersize=30)

        # NAKŁADANIE ETYKIET TEKSTOWYCH
        for idx, row in layer_clipped.iterrows():
            geom = row['geometry']

            if geom.geom_type == 'MultiPolygon':
                geom = max(geom.geoms, key=lambda a: a.area)
            elif geom.geom_type == 'MultiLineString':
                geom = max(geom.geoms, key=lambda a: a.length)

            if 'LineString' in geom.geom_type:
                pt = geom.interpolate(0.5, normalized=True)
                x, y = pt.x, pt.y
            else:
                x, y = geom.centroid.x, geom.centroid.y

            txt = ax.annotate(
                text=row['kod_ai'],
                xy=(x, y),
                ha='center',
                va='center',
                fontsize=4,
                fontweight='bold',
                color='black',
                bbox=dict(boxstyle="round,pad=0.01", fc="white", ec="white", lw=1.8, alpha=0.5)
            )
            wszystkie_etykiety_na_mapie.append(txt)

    # --- 4. ROZSUWANIE ETYKIET ---
    print(f"Rozsuwanie {len(wszystkie_etykiety_na_mapie)} etykiet (anti-overlap)...")
    if wszystkie_etykiety_na_mapie:  # Zabezpieczenie jakby nie było etykiet
        adjust_text(
            wszystkie_etykiety_na_mapie,
            ax=ax,
            arrowprops=dict(arrowstyle='-', color='gray', lw=0.7)
        )

    ax.set_axis_off()
    plt.savefig(plik_wyjsciowy_img, bbox_inches='tight', pad_inches=0)
    plt.close()

    # --- 5. ZRZUT DANYCH DO JSONA BEZ GEOMETRII ---
    print("\nPrzygotowywanie zrzutu danych atrybutowych do JSON (tylko widoczne obiekty)...")
    wielki_slownik_json = {}

    for layer_name, layer_gdf in przyciete_warstwy_do_jsona.items():
        print(f" -> Przetwarzanie przyciętej warstwy: {layer_name}")
        try:
            if not layer_gdf.empty:
                nazwa_kolumny_geom = layer_gdf.geometry.name
                df_bez_geometrii = layer_gdf.drop(columns=[nazwa_kolumny_geom])
                df_bez_geometrii = df_bez_geometrii.where(pd.notnull(df_bez_geometrii), None)
                dane_opisowe = df_bez_geometrii.to_dict(orient='records')
                wielki_slownik_json[layer_name] = dane_opisowe
        except Exception as e:
            print(f"Błąd przy przygotowaniu warstwy {layer_name}: {e}")

    print("\nZapisywanie JSON na dysk...")
    with open(plik_wyjsciowy_json, 'w', encoding='utf-8') as f:
        json.dump(wielki_slownik_json, f, ensure_ascii=False, indent=2)

    print(f"Gotowe! Odfiltrowane atrybuty z kafelka zrzucono do: {plik_wyjsciowy_json}")
    print(f"Obrazek kafelka zapisano jako: {plik_wyjsciowy_img}")
    return plik_wyjsciowy_json, plik_wyjsciowy_img


# --- WYWOŁANIE FUNKCJI ---
if __name__ == "__main__":
    generuj_kafelek_i_json(
        ortho_path=r'C:\Studia\HACKHATHON_STALOWA\DATA\Raster\ortho.tif',
        gpkg_path=r"C:\Studia\HACKHATHON_STALOWA\DATA\data_complete\main_db.gpkg",
        plik_wyjsciowy_img='final.jpg',
        plik_wyjsciowy_json=r'C:\Studia\HACKHATHON_STALOWA\Project_Hackathon_SPACESHIELD\backend\data\file.json',
        nazwa_warstwy_budynkow='budynki',
        wielkosc_bufora=150.0
    )