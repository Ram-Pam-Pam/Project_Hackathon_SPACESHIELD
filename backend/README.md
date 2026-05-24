# 🛰️ SPACE PATHWARDEN (SPACESHIELD)
 
> *"Miasto to żywy organizm. Czytamy jego rytm, podążamy niewidocznymi ścieżkami i wyczuwamy, gdzie ruch zwalnia, a gdzie przyspiesza."*
 
**Space Pathwarden** to zintegrowany, oparty na danych system analityczny stworzony w ramach hackathonu. Aplikacja służy do głębokiej analizy mobilności miejskiej, identyfikacji "białych plam" komunikacyjnych oraz optymalizacji infrastruktury na modelu miasta Stalowa Wola. Łączymy zaawansowane przetwarzanie danych przestrzennych (GIS), sztuczną inteligencję (LLM) oraz satelitarne dane radarowe, aby dostarczyć pragmatyczny model zarządzania transportem.
 
![Space Pathwarden System Overview](./image_5616c7.jpg)
 
🌍 **Aplikacja (Frontend):** [Live Demo](https://project-hackathon-spaceshield-frontend.onrender.com/)  
⚙️ **API (Backend / Swagger):** [FastAPI Docs](https://project-hackathon-spaceshield-api.onrender.com/docs)  
👨‍💻 **Zespół:** RAM-pam-pam
 
---
 
## 🚀 Główne założenia i funkcjonalności
 
Projekt odpowiada na kluczowe wyzwania urbanistyczne:
- **Wykrywanie Białych Plam:** Analiza dostępności transportu publicznego, wskazująca obszary niedostatecznie obsłużone (np. Dzielnica Rozwadów, strefa HSW).
- **Zrozumienie powiązań urbanistycznych:** Wizualizacja relacji mieszkanie-praca-usługi.
- **Ocena infrastruktury:** Audyt dróg, ścieżek rowerowych i barier architektonicznych.
- **Rekomendacje zasilane AI:** Modele generatywne analizujące logikę przestrzenną i proponujące optymalizacje tras.
 
---
 
## 🧠 Metodologia i Przetwarzanie Danych
 
Nasz system opiera się na wielowarstwowym potoku analitycznym, który integruje surowe dane z różnych źródeł, przetwarza je w chmurze i wizualizuje z wysoką wydajnością.
 
### 1. Źródła Danych
Wykorzystaliśmy zróżnicowane i wiarygodne zbiory danych:
- **GUGiK (BDOT10k) & Państwowy Rejestr Granic (PRG):** Granice administracyjne, podkłady topograficzne.
- **OpenStreetMap (Overpass / QuickOSM):** Sieci drogowe, infrastruktura kolejowa, lokalizacje przystanków.
- **Dane udostępnione przez organizatora:** Rozkłady jazdy, trasy linii autobusowych w Stalowej Woli.
- **Copernicus EGMS (European Ground Motion Service):** Dane radarowe (InSAR, poziom L3) do satelitarnego monitorowania osiadań infrastruktury i stabilności dróg.
 
### 2. Algorytmy i Analiza Przestrzenna (Backend)
Serce systemu (napisane w Pythonie/GeoPandas) realizuje złożone operacje geoinformatyczne:
- **Ujednolicenie i harmonizacja układów współrzędnych:** Automatyczna reprojekcja wszystkich wektorów do płaskiego układu współrzędnych **EPSG:2180** (PUWG 1992), co pozwala na precyzyjne operacje metryczne na danych z Polski.
- **Raster-Vector Clipping:** Skrypt `transport_data.py` wykorzystuje `rasterio` oraz macierze geometryczne `shapely.box` do dynamicznego przycinania dużych baz wektorowych (`.gpkg`) do granic lokalnych ortofotomap.
- **Mapowanie Atrybutów i Sanityzacja:** Własne algorytmy (np. `_sanitize_gdf`) czyszczą topologię i dostosowują typy danych (np. parsowanie zagnieżdżonych struktur JSON do stringów), aby umożliwić płynny zapis do formatów GIS (GeoPackage).
- **Satelitarna Analiza Radarowa (InSAR):** Zaimplementowaliśmy dedykowany interfejs (`pobierz_egms.py`) odpytujący API Copernicus z użyciem autoryzacji JWT, pobierający zarchiwizowane serie czasowe (2019-2023) dla weryfikacji nośności ciągów komunikacyjnych.
 
### 3. Sztuczna Inteligencja jako Urbanista (Gemini AI)
Wprowadziliśmy innowacyjne podejście łączące analizę wektorową z modelami LLM (Google Gemini):
- Zestawy danych wektorowych są tagowane unikalnymi kodami (`kod_ai`).
- Modele LLM analizują powiązania między atrybutami, rozkładami jazdy i gęstością zaludnienia.
- Wyniki (zidentyfikowane problemy i rekomendacje) są parsowane i z powrotem wtłaczane (inner merge) do pliku bazy danych `.gpkg`, co pozwala renderować "przemyślenia" AI bezpośrednio na mapie.
- Przykład detekcji: *Korytarz Al. Jana Pawła II (dublowanie tras), Strefa HSW (niedopasowanie kursów do zmian pracowniczych)*.
 
### 4. Zaawansowana Wizualizacja i Indeksowanie (Frontend)
Zamiast tradycyjnych poligonów administracyjnych, wdrożyliśmy nowoczesne podejście analityczne:
- **Uber H3 (Hexagonal Hierarchical Spatial Index):** Przetwarzanie populacji i zagęszczenia na siatkę heksagonalną (`h3-js`), co pozwala na obiektywne klastrowanie i płynne analizy "heatmap" bez zakłóceń wynikających z kształtu podziału administracyjnego.
- **MapLibre GL & Deck.gl:** Używamy akceleracji GPU (`@deck.gl/geo-layers`) do renderowania tysięcy punktów, warstw i tras w czasie rzeczywistym z zachowaniem 60 klatek na sekundę.
 
---
 
## 🛠️ Stos Technologiczny (Tech Stack)
 
### Backend (Python)
- **FastAPI** – ultra-szybki framework API z asynchronicznymi endpointami.
- **GeoPandas & Pygeos/Shapely** – operacje na topologii i strukturach danych przestrzennych.
- **Rasterio & Pyogrio** – zaawansowane czytanie plików wektorowych i rastrowych z dysku.
- **Matplotlib & AdjustText** – generowanie zautomatyzowanych, statycznych raportów wizualnych.
- **Google GenAI SDK** – integracja z modelem sztucznej inteligencji.
 
### Frontend (TypeScript / React)
- **Vite & React 19** – błyskawiczne środowisko deweloperskie i komponenty UI.
- **MapLibre GL JS** – otwartoźródłowy silnik renderowania map.
- **Deck.gl** – zaawansowane warstwy analityczne (HexagonLayer, GeoJsonLayer).
- **TailwindCSS** – system stylizacji i budowy interfejsu.
- **Recharts & D3.js** – interaktywne wykresy i panele dashboardowe (parsing danych .csv).
 
---
 
## 💻 Uruchomienie lokalne
 
### 1. Klonowanie repozytorium
```bash
git clone [https://github.com/TwojGitHub/Project_Hackathon_SPACESHIELD.git](https://github.com/TwojGitHub/Project_Hackathon_SPACESHIELD.git)
cd Project_Hackathon_SPACESHIELD