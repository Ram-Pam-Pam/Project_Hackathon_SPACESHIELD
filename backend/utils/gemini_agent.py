import os
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# Ładowanie kluczy
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Używamy modelu 1.5 Pro, bo jest najlepszy w analizie obrazu
model = genai.GenerativeModel('gemini-3.5-flash')

def analizuj_surowe_zdjecie(sciezka_do_zdjecia: str) -> str:
    """
    Wysyła pobrane zdjęcie satelitarne z dysku prosto do Gemini z testowym promptem.
    """
    # 1. Ładujemy obrazek z dysku
    img = Image.open(sciezka_do_zdjecia)
    
    # 2. Prompt Systemowy (Mówimy AI, kim jest i co ma zrobić)
    prompt = """
    Jesteś ekspertem urbanistyki. Otrzymujesz zdjęcie satelitarne fragmentu miasta.
    Twoim zadaniem jest krótki raport:
    1. Co dokładnie widzisz na tym zdjęciu? (Domy, bloki, lasy, rzeki, szerokie ulice?)
    2. Wskaż jeden potencjalny problem komunikacyjny, który na pierwszy rzut oka rzuca się w oczy w takim układzie przestrzennym.
    Bądź bardzo konkretny, nie używaj wodolejstwa.
    """
    
    # 3. Wysyłamy obrazek i tekst do Gemini
    print(f"[AI] Wysyłam zdjęcie {sciezka_do_zdjecia} do analizy...")
    response = model.generate_content([prompt, img])
    
    return response.text