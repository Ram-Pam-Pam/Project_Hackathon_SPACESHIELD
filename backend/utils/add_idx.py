import geopandas as gpd
import pyogrio
import itertools
import string
import os


def zaktualizuj_baze_o_kody(input_gpkg, output_gpkg):
    print(f"Otwieranie oryginalnej bazy: {input_gpkg}")

    layer_info = pyogrio.list_layers(input_gpkg)
    layers = [layer[0] for layer in layer_info]

    # Generator kodów (AAAA, AAAB, ..., ZZZZ)
    kombinacje = itertools.product(string.ascii_uppercase, repeat=4)
    generator_kodow = (''.join(k) for k in kombinacje)

    print(f"Znaleziono {len(layers)} warstw. Zaczynam przypisywanie kodów na stałe...")

    # Zapisujemy do NOWEGO pliku, żeby nie uszkodzić oryginału
    for layer_name in layers:
        print(f"  -> Przetwarzanie warstwy: {layer_name}")
        gdf = gpd.read_file(input_gpkg, layer=layer_name)

        if not gdf.empty:
            # Nadajemy unikalne kody dla wszystkich obiektów
            gdf['kod_ai'] = [next(generator_kodow) for _ in range(len(gdf))]

        # Zapis do nowej bazy (nawet puste warstwy zapisujemy, by zachować strukturę)
        gdf.to_file(output_gpkg, layer=layer_name, driver="GPKG")

    print(f"\nGOTOWE! Nowa baza z zamrożonymi kodami 'kod_ai' to: {output_gpkg}")
    print("Podepnij teraz tę nową bazę do swojego głównego skryptu!")


if __name__ == "__main__":
    baza_wejsciowa = r'C:\Studia\HACKHATHON_STALOWA\DATA\data_complete\main_db.gpkg'

    # Bezpiecznie tworzymy NOWY plik z kodami:
    baza_wyjsciowa = r"C:\Studia\HACKHATHON_STALOWA\Project_Hackathon_SPACESHIELD\backend\data\main_db_coded.gpkg"

    zaktualizuj_baze_o_kody(baza_wejsciowa, baza_wyjsciowa)