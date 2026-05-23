import json
import time
import requests
import jwt

# 1. Funkcja generująca tymczasowy token dostępu na podstawie pliku token.jwt
import os
import json
import time
import requests
import jwt

def get_access_token():
    # 1. Pobieramy bezwzględną ścieżkę do folderu, w którym leży ten skrypt
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Sklejamy ścieżkę z nazwą pliku
    token_path = os.path.join(base_dir, 'token.jwt')
    
    print(f"Szukam pliku z tokenem pod adresem: {token_path}") # To pokaże Ci, gdzie dokładnie szuka
    
    with open(token_path, 'r') as f:
        service_key = json.load(f)
    
    private_key = service_key['private_key'].encode('utf-8')
    claim_set = {
        "iss": service_key['client_id'],
        "sub": service_key['user_id'],
        "aud": service_key['token_uri'],
        "iat": int(time.time()),
        "exp": int(time.time() + (60 * 60)),
    }
    
    grant = jwt.encode(claim_set, private_key, algorithm='RS256')
    result = requests.post(
        service_key["token_uri"], 
        headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": grant}
    )
    return result.json().get('access_token')

# 2. Autoryzacja i ustawienie nagłówków
access_token = get_access_token()
headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
api_endpoint = "https://egms.land.copernicus.eu/insar-api/archive"

# 3. Przygotowanie zapytania przestrzennego dla Stalowej Woli
# [ [min_lon, min_lat], [max_lon, max_lat] ]
bbox_stalowa_wola = [
    [21.9500, 50.5200], 
    [22.1200, 50.6200]
]

query = {
    "id": None,
    "bbox": bbox_stalowa_wola,
    "levels": ["L3"],              # L3 to produkty Ortho - idealne do analizy infrastruktury
    "releases": ["2019-2023"]      # Korzystamy z podanej w API paczki czasowej
}

print("Wysyłam zapytanie do API EGMS dla obszaru Stalowej Woli...")
r = requests.post(f"{api_endpoint}/search", headers=headers, data=json.dumps(query))
result = r.json()

# 4. Parsowanie wyników i generowanie linków do pobrania
if "hits" in result and len(result["hits"]) > 0:
    print(f"\nZnaleziono {len(result['hits'])} plików z danymi L3. Linki do pobrania:")
    
    # Zapisujemy linki do pliku tekstowego, żeby można było je łatwo wrzucić w wget
    with open("linki_do_pobrania.txt", "w") as f:
        for hit in result["hits"]:
            # URL jest budowany zgodnie z dokumentacją z notatnika Jupyter
            link = f"{api_endpoint}/download/{hit['filename']}?id={result['id']}"
            f.write(f"{link}\n")
            print(f"- {hit['filename']}")
            
    print("\nLinki zostały zapisane do pliku 'linki_do_pobrania.txt'.")
    print("Możecie je teraz pobrać używając np. wget -i linki_do_pobrania.txt")
else:
    print("Nie znaleziono danych dla podanych parametrów.")
    if "message" in result:
        print("Komunikat błędu z API:", result["message"])