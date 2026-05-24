import os
import json
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# 1. Ładowanie kluczy
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 2. Baza 6 instrukcji dopasowanych do opcji z zadania
PROMPTY_KATEGORII = {
    "opcja_1": """
        Skup się na MOŻLIWYCH ZMIANACH W UKŁADZIE LINII AUTOBUSOWYCH. 
        Wskaż, gdzie brakuje połączeń, gdzie autobusy dublują trasy oraz jak zoptymalizować siatkę, by wyeliminować puste przebiegi na widocznym obszarze.
    """,
    "opcja_2": """
        Skup się na LOKALIZACJI NOWYCH ELEMENTÓW INFRASTRUKTURY. 
        Wskaż precyzyjnie (bazując na zdjęciu), gdzie należałoby umieścić nowe stacje roweru miejskiego, dodatkowe bezpieczne przejścia dla pieszych oraz nowe przystanki.
    """,
    "opcja_3": """
        Wygeneruj REKOMENDACJE ZWIĄZANE Z BEZPIECZEŃSTWEM RUCHU. 
        Zidentyfikuj na zdjęciu niebezpieczne skrzyżowania, szerokie proste i punkty kolizyjne. Zaproponuj konkretne środki uspokojenia ruchu (progi, azyle).
    """,
    "opcja_4": """
        Zidentyfikuj POTENCJALNE MIEJSCA POSZERZEŃ LUB ZWĘŻEŃ DRÓG. 
        Sprawdź geometrię dróg na zdjęciu. Wskaż, gdzie "dieta drogowa" (zwężenie) uwolniłaby przestrzeń, a gdzie brakuje pasów do skrętów.
    """,
    "opcja_5": """
        Zaproponuj DZIAŁANIA POPRAWIAJĄCE PŁYNNOŚĆ RUCHU PIESZYCH I ROWERZYSTÓW. 
        Poszukaj barier przestrzennych. Skup się na ciągłości ścieżek, eliminacji wąskich gardeł i integracji z węzłami przesiadkowymi.
    """,
    "opcja_6": """
        Opracuj PROPOZYCJE LEPSZEJ KOORDYNACJI TRANSPORTU W SKALI MIASTA. 
        Jakie elastyczne linie dowozowe powinny obsługiwać ten obszar? Jakie zmiany w rozkładzie rozwiążą problem tego miejsca w godzinach szczytu?
    """
}

# 3. Model wymuszający odpowiedź w JSON
model = genai.GenerativeModel(
    model_name='gemini-3.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

def analizuj_biala_plame(id_opcji: str, sciezka_do_zdjecia: str, kontekst_czasowy: str) -> dict:
    wybrana_instrukcja = PROMPTY_KATEGORII.get(id_opcji, PROMPTY_KATEGORII["opcja_1"])
    
    prompt_bazowy = f"""
    Jesteś Głównym Analitykiem Urbanistyki systemu GeoAnalytica.
    Analizujesz zdjęcie satelitarne "białej plamy" lub wskazanego przez użytkownika punktu.
    
    WAŻNY KONTEKST CZASOWY: To zdjęcie/obszar jest analizowane dla sytuacji: {kontekst_czasowy}
    
    TWOJE ZADANIE:
    {wybrana_instrukcja}
    
    MUSISZ ZWRÓCIĆ WYŁĄCZNIE STRUKTURĘ JSON (do wyświetlenia na naszym Dashboardzie):
    {{
        "tytul_raportu": "Krótki, profesjonalny tytuł (np. Analiza infrastruktury - Wyjazd do pracy)",
        "diagnoza_problemu": "Co tu jest nie tak w kontekście podanej pory dnia (2-3 zdania).",
        "rekomendacja_dzialan": "Konkretna inżynieryjna propozycja naprawy.",
        "dane_do_wykresu": [
            {{"kategoria": "Wpływ na płynność (%)", "wartosc": 25}},
            {{"kategoria": "Koszty wdrożenia (1-100)", "wartosc": 40}},
            {{"kategoria": "Poprawa bezpieczeństwa (%)", "wartosc": 75}}
        ]
    }}
    """
    
    try:
        img = Image.open(sciezka_do_zdjecia)
        print(f"[AI] Gemini analizuje opcję: {id_opcji} w kontekście: {kontekst_czasowy}...")
        response = model.generate_content([prompt_bazowy, img])
        return json.loads(response.text)
    except Exception as e:
        print(f"Błąd AI: {e}")
        return {
            "tytul_raportu": "Błąd Analizy",
            "diagnoza_problemu": f"Nie udało się połączyć z AI: {e}",
            "rekomendacja_dzialan": "Sprawdź pliki zdjęć i spróbuj ponownie.",
            "dane_do_wykresu": [{"kategoria": "Błąd", "wartosc": 0}]
        }