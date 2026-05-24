import os
import sys

# Dodaj folder utils do ścieżki
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from utils.gemini_agent import analizuj_surowe_zdjecie

img_path = os.path.join(os.path.dirname(__file__), "utils", "kafelek_do_analizy_ostateczny_kolory.jpg")
json_path = os.path.join(os.path.dirname(__file__), "data", "file.json")

print("Testowanie agenta Gemini...")
try:
    wyniki = analizuj_surowe_zdjecie(img_path, json_path, "ZMIANY_LINII", 50.582, 22.053)
    print("Sukces!")
    print(wyniki)
except Exception as e:
    import traceback
    print("Błąd Gemini:")
    traceback.print_exc()
