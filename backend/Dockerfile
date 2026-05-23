# Używamy oficjalnego, lekkiego obrazu Pythona
FROM python:3.12-slim

# Ustawiamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy plik z wymaganymi paczkami
COPY requirements.txt .

# Instalujemy zależności (bez zapisywania cache, żeby obraz był lżejszy)
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy całą resztę kodu backendu do kontenera
COPY . .

# Wystawiamy port 8000, na którym domyślnie działa FastAPI
EXPOSE 8000

# Komenda uruchamiająca serwer
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]