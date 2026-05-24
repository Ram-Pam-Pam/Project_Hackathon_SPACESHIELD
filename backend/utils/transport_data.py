import json
import pandas as pd
import geopandas as gpd
import pyogrio
import rasterio
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import itertools
from rasterio.plot import show
from shapely.geometry import box
from adjustText import adjust_text
import traceback
from pyproj import CRS


def generuj_kafelek_i_json(
        ortho_path: str,
        gpkg_path: str,
        plik_wyjsciowy_img: str = 'kafelek_do_analizy_ostateczny_kolory.jpg',
        plik_wyjsciowy_json: str = 'file.json',
        nazwa_warstwy_budynkow: str = 'budynki'
):
    print("Rozpoczęcie przetwarzania danych...")

    layer_info = pyogrio.list_layers(gpkg_path)
    layers = [layer[0] for layer in layer_info]
    print(f"Znalezione warstwy w pliku GPKG: {layers}")

    lista_kolorow = [
        '#FF0000',  # Czerwony
        '#00FF00',  # Zielony
        '#0000FF',  # Niebieski
        '#FFFF00',  # Żółty
        '#FF00FF',  # Magenta
        '#00FFFF',  # Cyjan
        '#FF8000',  # Pomarańczowy
        '#8000FF',  # Fioletowy
        '#FF6666',  # Jasna czerwień
        '#66FF66'  # Jasna zieleń
    ]
    kolory_iterator = itertools.cycle(lista_kolorow)

    wczytane_warstwy = {}
    slownik_kolorow_kategorii = {}

    # --- 1. WCZYTYWANIE CAŁEJ BAZY (Kody są już zintegrowane) ---
    print("\nWczytywanie warstw (kody 'kod_ai' odczytywane z bazy)...")
    for layer_name in layers:
        try:
            layer = gpd.read_file(gpkg_path, layer=layer_name)
            if layer.empty:
                print(f"  -> Warstwa '{layer_name}': pusta, pomijam.")
                continue

            # Bezpiecznik: jeśli odpalisz na starej bazie bez kodów, wywali jasny błąd
            if 'kod_ai' not in layer.columns:
                raise ValueError(
                    f"Brak kolumny 'kod_ai' w warstwie {layer_name}! Uruchom najpierw skrypt 'nadaj_kody_db.py'.")

            wczytane_warstwy[layer_name] = layer
            print(f"  -> Warstwa '{layer_name}': załadowano {len(layer)} obiektów z kodami.")

        except Exception as e:
            print(f"  -> Pominięto warstwę '{layer_name}': {e}")
            traceback.print_exc()

    if not wczytane_warstwy:
        raise ValueError(f"Brak danych wektorowych! Sprawdź ścieżkę: {gpkg_path}")

    # --- 2. DOPASOWANIE CRS I FILTROWANIE DO RASTRA ---
    fig, ax = plt.subplots(figsize=(12, 12), dpi=150)

    with rasterio.open(ortho_path) as src:
        raster_crs = CRS.from_epsg('2180')

        if src.crs is None:
            print(f"\n!! Raster nie ma CRS — używam domyślnego EPSG:2180")
        else:
            print(f"\nCRS rastra: {raster_crs}")

        wycinek_box = box(*src.bounds)
        print("Dopasowywanie układów współrzędnych do ortofotomapy...")

        for layer_name, layer_data in wczytane_warstwy.items():
            if layer_data.crs is None:
                print(f"  !! Warstwa '{layer_name}' nie ma CRS — przypisuję {raster_crs}")
                wczytane_warstwy[layer_name] = layer_data.set_crs('EPSG:2180')
            elif layer_data.crs != raster_crs:
                wczytane_warstwy[layer_name] = layer_data.to_crs('EPSG:2180')

            wczytane_warstwy[layer_name] = wczytane_warstwy[layer_name][
                wczytane_warstwy[layer_name].intersects(wycinek_box)
            ].copy()
            print(f"  -> Warstwa '{layer_name}': {len(wczytane_warstwy[layer_name])} obiektów w zasięgu.")

        try:
            img_array = src.read([1,2,3])
            show(img_array, transform=src.transform, ax=ax)
        except Exception:
            # Gdyby obrazek był nietypowy, wracamy do domyślnego czytania
            show(src, ax=ax)

    # --- 3. RYSOWANIE WIZUALIZACJI WEKTORÓW ---
    wszystkie_etykiety_na_mapie = []
    przyciete_warstwy_do_jsona = {}

    print("\nPrzycinanie do kafelka i rysowanie...")
    for layer_name, layer_data in wczytane_warstwy.items():
        if layer_data.empty:
            continue

        layer_clipped = gpd.clip(layer_data, wycinek_box).copy()
        if layer_clipped.empty:
            continue

        kolory_dla_obiektow = []

        if layer_name == nazwa_warstwy_budynkow:
            potencjalne_kolumny = ['funkcja', 'rodzaj', 'typ', 'category', 'klasa', 'fclass']
            kolumna_kategorii = next(
                (col for col in potencjalne_kolumny if col in layer_clipped.columns), None
            )
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

        typ_geometrii = layer_clipped.iloc[0].geometry.geom_type

        if 'Polygon' in typ_geometrii or 'LineString' in typ_geometrii:
            layer_clipped.plot(ax=ax, facecolor='none', edgecolor=kolory_bezpieczne, linewidth=2.0)
        else:
            layer_clipped.plot(ax=ax, color=kolory_bezpieczne, markersize=30)

        # NAKŁADANIE ZAMROŻONYCH ETYKIET
        for idx, row in layer_clipped.iterrows():
            geom = row['geometry']
            if geom is None:
                continue

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
                text=row['kod_ai'],  # Teraz korzysta z trwałej wartości w GeoPackage
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
    print(f"\nRozsuwanie {len(wszystkie_etykiety_na_mapie)} etykiet (anti-overlap)...")
    if wszystkie_etykiety_na_mapie:
        adjust_text(
            wszystkie_etykiety_na_mapie,
            ax=ax,
            arrowprops=dict(arrowstyle='-', color='gray', lw=0.7)
        )

    ax.set_axis_off()
    plt.savefig(plik_wyjsciowy_img, bbox_inches='tight', pad_inches=0)
    plt.close()
    print(f"Obrazek kafelka zapisano jako: {plik_wyjsciowy_img}")

    # --- 5. ZRZUT DANYCH DO JSONA BEZ GEOMETRII ---
    print("\nPrzygotowywanie zrzutu danych atrybutowych do JSON...")
    wielki_slownik_json = {}

    for layer_name, layer_gdf in przyciete_warstwy_do_jsona.items():
        try:
            if not layer_gdf.empty:
                nazwa_kolumny_geom = layer_gdf.geometry.name
                df_bez_geometrii = layer_gdf.drop(columns=[nazwa_kolumny_geom])
                df_bez_geometrii = df_bez_geometrii.where(pd.notnull(df_bez_geometrii), None)
                wielki_slownik_json[layer_name] = df_bez_geometrii.to_dict(orient='records')
        except Exception as e:
            print(f"  -> Błąd przy warstwie '{layer_name}': {e}")
            traceback.print_exc()

    with open(plik_wyjsciowy_json, 'w', encoding='utf-8') as f:
        json.dump(wielki_slownik_json, f, ensure_ascii=False, indent=2)

    print(f"Gotowe! JSON zapisano do: {plik_wyjsciowy_json}")
    return plik_wyjsciowy_json, plik_wyjsciowy_img


def polacz_wyniki_z_baza(
        wyniki_gemini: list,
        gpkg_path: str,
        plik_wyjsciowy: str = 'wyniki_na_mapie.gpkg'
) -> gpd.GeoDataFrame:

    layer_info = pyogrio.list_layers(gpkg_path)
    layers = [layer[0] for layer in layer_info]

    wszystkie = []
    for layer_name in layers:
        try:
            gdf = gpd.read_file(gpkg_path, layer=layer_name)
            if gdf.empty:
                continue
            if 'kod_ai' not in gdf.columns:
                print(f"  -> '{layer_name}': brak kolumny kod_ai, pomijam.")
                continue
            gdf['warstwa'] = layer_name
            wszystkie.append(gdf)
            print(f"  -> Wczytano '{layer_name}': {len(gdf)} obiektów.")
        except Exception as e:
            print(f"  -> Pominięto '{layer_name}': {e}")

    if not wszystkie:
        raise ValueError("Brak warstw z kolumną kod_ai! Upewnij się że generuj_kafelek_i_json był wywołany na tym samym GPKG.")

    baza = pd.concat(wszystkie, ignore_index=True)
    print(f"Łączna liczba obiektów w bazie: {len(baza)}")
    print(f"Wyniki Gemini do połączenia: {len(wyniki_gemini)}")
    print(f"Przykładowe id z Gemini: {[o['id'] for o in wyniki_gemini[:5]]}")
    print(f"Przykładowe kod_ai z bazy: {baza['kod_ai'].head().tolist()}")

    wyniki_df = pd.DataFrame([
        {
            'kod_ai': obj['id'],
            'status': obj['status'],
            'wnioski': obj['wnioski']
        }
        for obj in wyniki_gemini
    ])

    wynik_gdf = baza.merge(wyniki_df, on='kod_ai', how='inner')
    print(f"Połączono {len(wynik_gdf)} obiektów.")

    if wynik_gdf.empty:
        print("UWAGA: Merge zwrócił 0 wyników!")
        print("Sprawdź czy id z Gemini odpowiadają kodom z bazy.")
        # Zwróć pustą GeoDataFrame zamiast crashować
        return gpd.GeoDataFrame(columns=baza.columns)

    wynik_gdf = _sanitize_gdf(wynik_gdf)
    wynik_gdf.to_file(plik_wyjsciowy, driver='GPKG', layer='wyniki_analizy')
    print(f"Zapisano do: {plik_wyjsciowy}")

    return wynik_gdf


def _sanitize_gdf(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Sanitize column names and data types for GPKG compatibility."""
    import re

    # 1. Truncate column names to 10 chars and remove special chars (GPKG/Shapefile limit)
    rename_map = {}
    seen = {}
    for col in gdf.columns:
        if col == gdf.geometry.name:
            continue
        clean = re.sub(r'[^a-zA-Z0-9_]', '_', col)[:10]
        # Handle duplicates after truncation
        if clean in seen:
            seen[clean] += 1
            clean = clean[:8] + str(seen[clean])
        else:
            seen[clean] = 0
        if clean != col:
            rename_map[col] = clean

    if rename_map:
        print(f"  -> Zmiana nazw kolumn: {rename_map}")
        gdf = gdf.rename(columns=rename_map)

    # 2. Convert problematic types to string
    for col in gdf.columns:
        if col == gdf.geometry.name:
            continue
        try:
            dtype = gdf[col].dtype
            if dtype == object:
                # Convert lists/dicts to string
                gdf[col] = gdf[col].apply(
                    lambda x: json.dumps(x, ensure_ascii=False)
                    if isinstance(x, (list, dict)) else x
                )
            # Convert any remaining complex types
            if gdf[col].dtype == object:
                gdf[col] = gdf[col].astype(str).replace('None', '')
        except Exception as e:
            print(f"  -> Usuwam problematyczną kolumnę '{col}': {e}")
            gdf = gdf.drop(columns=[col])

    return gdf



if __name__ == "__main__":
    generuj_kafelek_i_json(
        ortho_path=r'C:\Studia\HACKHATHON_STALOWA\DATA\Raster\ortho.tif',

        # WAŻNE: Tu wczytujemy już bazę z zapisanymi na stałe kodami _coded
        gpkg_path=r"C:\Studia\HACKHATHON_STALOWA\Project_Hackathon_SPACESHIELD\backend\data\main_db_coded.gpkg",

        plik_wyjsciowy_img='final.jpg',
        plik_wyjsciowy_json=r'C:\Studia\HACKHATHON_STALOWA\Project_Hackathon_SPACESHIELD\backend\data\file.json',
        nazwa_warstwy_budynkow='budynki'
    )



