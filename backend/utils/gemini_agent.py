import os
import json
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# Ładowanie kluczy
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# -------------------------------------------------------------------
# BAZA 7 INSTRUKCJI (System Prompts)
# Tutaj później dopiszesz, co oznaczają konkretne kolory na zdjęciach.
# -------------------------------------------------------------------
PROMPTY_KATEGORII = {
    "opcja_1": """
        Skup się na MOŻLIWYCH ZMIANACH W UKŁADZIE LINII AUTOBUSOWYCH. 
        Przeanalizuj układ ulic widoczny na zdjęciu. Zwróć uwagę na to, gdzie brakuje połączeń, 
        gdzie autobusy dublują trasy oraz jak zoptymalizować siatkę, by wyeliminować puste przebiegi 
        i zachęcić mieszkańców "białej plamy" do korzystania z komunikacji.
    """,
    "opcja_2": """
        Skup się na LOKALIZACJI NOWYCH ELEMENTÓW INFRASTRUKTURY. 
        Wskaż precyzyjnie (bazując na zabudowie i układzie drogowym widocznym na zdjęciu), 
        gdzie należałoby umieścić nowe stacje roweru miejskiego, dodatkowe bezpieczne przejścia 
        dla pieszych oraz nowe przystanki autobusowe, aby zlikwidować wykluczenie przestrzenne.
    """,
    "opcja_3": """
        Wygeneruj REKOMENDACJE ZWIĄZANE Z BEZPIECZEŃSTWEM RUCHU. 
        Zidentyfikuj na zdjęciu niebezpieczne skrzyżowania, szerokie proste zachęcające do przekraczania 
        prędkości oraz punkty kolizyjne. Zaproponuj konkretne środki uspokojenia ruchu 
        (np. progi zwalniające, azyle dla pieszych, małe ronda).
    """,
    "opcja_4": """
        Zidentyfikuj POTENCJALNE MIEJSCA POSZERZEŃ LUB ZWĘŻEŃ DRÓG. 
        Sprawdź geometrię dróg na zdjęciu. Wskaż, gdzie zastosowanie "diety drogowej" (zwężenia) 
        mogłoby uwolnić przestrzeń dla mieszkańców, a gdzie absolutnie brakuje pasów do skrętów 
        powodujących tworzenie się zatorów na głównych arteriach.
    """,
    "opcja_5": """
        Zaproponuj DZIAŁANIA POPRAWIAJĄCE PŁYNNOŚĆ RUCHU PIESZYCH I ROWERZYSTÓW. 
        Poszukaj barier przestrzennych. Skup się na ciągłości ścieżek rowerowych, eliminacji 
        "wąskich gardeł" na chodnikach, dojściach do szkół/sklepów oraz integracji ruchu 
        aktywnego z pobliskimi węzłami przesiadkowymi.
    """,
    "opcja_6": """
        Opracuj PROPOZYCJE LEPSZEJ KOORDYNACJI TRANSPORTU PUBLICZNEGO W SKALI MIASTA. 
        Potraktuj ten obszar (białą plamę) jako element większej układanki. Jakie elastyczne 
        linie dowozowe (np. midibusy) powinny stąd dowozić pasażerów do głównych węzłów? 
        Jakie zmiany w rozkładzie rozwiążą problem tego obszaru?
    """
}

# 🚀 Ustawiamy model tak, aby ZAWSZE wypluwał czysty JSON (bez formatowania markdown ```json)
model = genai.GenerativeModel(
    model_name='gemini-3.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

def analizuj_biala_plame(id_opcji: str, sciezka_do_zdjecia: str) -> dict:
    """
    Funkcja łączy wybraną opcję z instrukcją, patrzy na zdjęcie 
    i zwraca ustrukturyzowany JSON do wyświetlenia na Dashboardzie.
    """
    
    # 1. Wyciągamy odpowiedni prompt dla wybranej opcji (zabezpieczenie na wypadek złego ID)
    wybrana_instrukcja = PROMPTY_KATEGORII.get(id_opcji, PROMPTY_KATEGORII["opcja_1"])
    
    # 2. Budujemy "Kanapkę" Promptową (Główna Rola + Specyficzne Zadanie + Wymuszona Struktura)
    prompt_bazowy = f"""
    Jesteś Głównym Analitykiem Urbanistyki w nowoczesnym systemie GeoAnalytica.
    Otrzymujesz olabelowane (zaznaczone kolorami) zdjęcie satelitarne "białej plamy" komunikacyjnej.
    
    TWOJE ZADANIE DLA TEGO PRZYPADKU (ZIGNORUJ INNE ASPEKTY):
    {wybrana_instrukcja}
    
    MUSISZ ZWRÓCIĆ WYŁĄCZNIE STRUKTURĘ JSON (BĘDZIE ONA PARSOWANA PRZEZ KOD REACT).
    Struktura musi wyglądać dokładnie tak:
    {{
        "tytul_raportu": "Krótki, profesjonalny tytuł (np. Analiza infrastruktury pieszej)",
        "diagnoza_problemu": "Krótki opis tego, co widzisz na zdjęciu (2-3 zdania). Używaj języka technicznego.",
        "rekomendacja_dzialan": "Konkretna inżynieryjna propozycja naprawy sytuacji.",
        "dane_do_wykresu": [
            {{"kategoria": "Szacowany wpływ na płynność (%)", "wartosc": 25}},
            {{"kategoria": "Poziom kosztów wdrożenia (1-100)", "wartosc": 40}},
            {{"kategoria": "Poprawa bezpieczeństwa (%)", "wartosc": 75}}
        ]
    }}
    Zwracaj w JSONie wylistowane, realistycznie wyglądające dane liczbowe dopasowane do Twojej analizy, 
    aby nasz Dashboard na frontendzie miał z czego wygenerować wykres (zawsze 3 kategorie statystyczne).
    """
    
    try:
        # Otwieramy zdjęcie z podanej ścieżki
        img = Image.open(sciezka_do_zdjecia)
        print(f"[AI] Gemini analizuje zdjęcie na podstawie wariantu: {id_opcji}...")
        
        # Wysyłamy paczkę do AI
        response = model.generate_content([prompt_bazowy, img])
        
        # Odbieramy tekst, który jest teraz gwarantowanym JSONem, i przerabiamy na obiekt Python (Dict)
        return json.loads(response.text)
        
    except Exception as e:
        print(f"⚠️ Błąd podczas analizy AI: {e}")
        # Awaryjny zwrot w przypadku np. braku internetu lub błędu zdjęcia
        return {
            "tytul_raportu": "Błąd Systemu",
            "diagnoza_problemu": f"Nie udało się połączyć z modelem wizyjnym: {str(e)}",
            "rekomendacja_dzialan": "Sprawdź plik ze zdjęciem satelitarnym.",
            "dane_do_wykresu": [{"kategoria": "Błąd", "wartosc": 0}]
        }