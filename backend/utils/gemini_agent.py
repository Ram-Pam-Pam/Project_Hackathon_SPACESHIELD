import os
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# Ładowanie kluczy
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Główna instrukcja dla modelu
INSTRUKCJA_DLA_AI = """
Jesteś Głównym Inżynierem Urbanistyki i ekspertem ds. transportu w Stalowej Woli.
Odpowiadasz na zapytania z systemu GeoAnalytica.
Zasady:
1. Bądź ekstremalnie konkretny i używaj technicznego słownictwa.
2. Formatyzuj tekst używając punktów i krótkich akapitów.
3. Nigdy nie dodawaj ogólnikowych wstępów typu "Oto analiza".
"""

# Inicjalizacja modelu
model = genai.GenerativeModel(
    model_name='gemini-3.5-flash',
    system_instruction=INSTRUKCJA_DLA_AI
)

def analizuj_surowe_zdjecie(sciezka_do_zdjecia: str) -> str:
    """Funkcja do analizy obrazów satelitarnych"""
    img = Image.open(sciezka_do_zdjecia)
    response = model.generate_content([img])
    return response.text

def generuj_odpowiedz_czatu(prompt_uzytkownika: str) -> str:
    """Funkcja do obsługi czatu z frontendowego dashboardu"""
    print(f"[AI] Przetwarzam zapytanie: {prompt_uzytkownika}")
    response = model.generate_content(prompt_uzytkownika)
    return response.text