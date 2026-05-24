# Używamy oficjalnego, lekkiego obrazu Pythona
FROM python:3.11-slim

# Ustawiamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy plik z wymaganymi paczkami
COPY requirements.txt .

# Instalujemy zależności (bez zapisywania cache)
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy całą resztę kodu backendu
COPY . .

# ZMIENIONA LINIJKA: Pozwalamy na dynamiczne pobranie portu z systemu
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]