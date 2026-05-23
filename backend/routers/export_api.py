from fastapi import APIRouter, Response
from fpdf import FPDF
import io

router = APIRouter(prefix="/api/export", tags=["Eksport Raportów"])

@router.get("/csv")
async def pobierz_raport_csv():
    """
    Zwraca plik CSV z przykładowymi danymi o przystankach.
    Gotowy do otwarcia w Excelu.
    """
    # Tutaj na razie dajemy "zaślepkę" (dummy data). 
    # Później podepniemy tu prawdziwe dane z modelu AI.
    zawartosc_csv = """Nazwa Przystanku,Kategoria,Potok Dobowy,Wskaznik Krytyczny
Rondo KEN,Wysokie,15420,89%
Rozwadów Rynek,Srednie,4320,45%
Brama HSW,Wysokie,18500,95%
"""
    
    # Zwracamy to jako prawdziwy plik do pobrania
    return Response(
        content=zawartosc_csv,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=raport_stalowa_wola.csv"}
    )

@router.get("/pdf")
async def pobierz_raport_pdf():
    """
    Generuje i zwraca ładny plik PDF z podsumowaniem analizy.
    """
    # Tworzymy prosty dokument PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Używamy wbudowanej czcionki (Arial, rozmiar 16)
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, "Raport Analityczny: Stalowa Wola (Wersja Testowa)", ln=True, align="C")
    
    pdf.set_font("helvetica", "", 12)
    pdf.ln(10) # Pusta linia
    pdf.multi_cell(0, 10, "To jest wygenerowany automatycznie raport z systemu GeoAnalytica. "
                          "W docelowej wersji znajdzie sie tutaj szczegolowy werdykt od modelu Gemini "
                          "dotyczacy rozwiazan komunikacyjnych dla miasta.")
                          
    pdf.ln(10)
    pdf.set_font("helvetica", "I", 10)
    pdf.cell(0, 10, "Wygenerowano przez AI", ln=True)

    # 🔥 TUTAJ JEST SZYBKA NAPRAWA: rzutujemy wynik na czyste bytes
    pdf_bytes = bytes(pdf.output()) 
    
    # Wysyłamy plik PDF do przeglądarki
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=raport_inteligentny.pdf"}
    )