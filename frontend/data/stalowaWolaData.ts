import { Stop, TabInfo, ChartDataPoint, ZoneDataPoint } from '../types';

export const STALOWA_WOLA_STOPS: Stop[] = [
  {
    id: 'stop-1',
    name: 'Rozwadów Rynek',
    street: 'Rynek',
    intensity: 'low',
    trafficScore: 18,
    lines: ['Linia 1', 'Linia 3', 'Linia 10'],
    lat: 180,
    lng: 480,
    description: 'Zabytkowa strefa rynku w północnej części miasta. Niski stopień obciążenia ruchem pasażerskim, głównie charakter turystyczno-rezydencjalny.',
    dailyPassengers: 350
  },
  {
    id: 'stop-2',
    name: 'Okulickiego - Rondo',
    street: 'ul. Okulickiego',
    intensity: 'high',
    trafficScore: 92,
    lines: ['Linia 1', 'Linia 2', 'Linia 3', 'Linia 4', 'Linia 10', 'Linia 12'],
    lat: 420,
    lng: 410,
    description: 'Główny węzeł przesiadkowy zlokalizowany przy pasażu handlowym. Bardzo wysokie natężenie pasażerskie, krytyczne znaczenie dla miejskiego transportu.',
    dailyPassengers: 3200
  },
  {
    id: 'stop-3',
    name: 'KEN - Bloki',
    street: 'Al. Komisji Edukacji Narodowej',
    intensity: 'high',
    trafficScore: 84,
    lines: ['Linia 2', 'Linia 4', 'Linia 8', 'Linia 12'],
    lat: 510,
    lng: 340,
    description: 'Obszar gęstej zabudowy wielorodzinnej Śródmieścia. Intensywna wymiana potoków pasażerskich w porannych i popołudniowych godzinach szczytu.',
    dailyPassengers: 2450
  },
  {
    id: 'stop-4',
    name: 'Staszica - Dworzec PKS',
    street: 'ul. Staszica',
    intensity: 'medium',
    trafficScore: 56,
    lines: ['Linia 1', 'Linia 3', 'Linia 8', 'Linia 10'],
    lat: 340,
    lng: 560,
    description: 'Przystanek przesiadkowy zintegrowany z dworcem kolejowym i autobusowym. Stały, umiarkowany przepływ osób z dominacją podróżujących regionalnie.',
    dailyPassengers: 1100
  },
  {
    id: 'stop-5',
    name: 'Przemysłowa - Huta Stalowa Wola',
    street: 'ul. Przemysłowa',
    intensity: 'medium',
    trafficScore: 68,
    lines: ['Linia 3', 'Linia 4', 'Linia 19'],
    lat: 680,
    lng: 220,
    description: 'Południowa strefa przemysłowa (brama HSW). Skokowe natężenie ruchu ściśle skorelowane z godzinami zmian produkcyjnych w zakładach.',
    dailyPassengers: 1400
  },
  {
    id: 'stop-6',
    name: 'Aleje Jana Pawła II - Bazylika',
    street: 'Al. Jana Pawła II',
    intensity: 'medium',
    trafficScore: 48,
    lines: ['Linia 1', 'Linia 2', 'Linia 12'],
    lat: 480,
    lng: 620,
    description: 'Centralna oś komunikacyjna miasta, przystanek przy świątyni. Umiarkowane i zrównoważone natężenie ruchu przez cały tydzień.',
    dailyPassengers: 920
  },
  {
    id: 'stop-7',
    name: 'Ofiar Katynia - Park',
    street: 'ul. Ofiar Katynia',
    intensity: 'low',
    trafficScore: 24,
    lines: ['Linia 1', 'Linia 8'],
    lat: 280,
    lng: 320,
    description: 'Spokojna strefa rekreacyjna w zachodnim sektorze miasta. Mały ruch pasażerski, głównie ruch pieszy i dojazdy rekreacyjne.',
    dailyPassengers: 410
  }
];

export const ANALYSIS_TABS: TabInfo[] = [
  {
    id: 'tab1',
    label: 'Analiza Potoków',
    description: 'Badanie gęstości przemieszczania się ludności w kluczowych węzłach komunikacyjnych miasta Stalowa Wola.'
  },
  {
    id: 'tab2',
    label: 'Strefy Buforowe',
    description: 'Określanie stopnia pokrycia przestrzennego i dostępności przystankowej w promieniach 300m i 500m.'
  },
  {
    id: 'tab3',
    label: 'Opóźnienia & Przepustowość',
    description: 'Analiza czasów przejazdu i punktualności taboru miejskiego z uwzględnieniem zatorów drogowych.'
  },
  {
    id: 'tab4',
    label: 'Sondaż Hałasu & Emisji',
    description: 'Monitoring wpływu natężenia transportu publicznego na poziom hałasu i emisje CO2 w centrum miasta.'
  },
  {
    id: 'tab5',
    label: 'Optymalizacja Linii',
    description: 'Strategiczne rekomendacje dotyczące modyfikacji przebiegu tras w celu skrócenia średniego czasu podróży.'
  }
];

export const HOURLY_FLOWS: ChartDataPoint[] = [
  { time: '05:00', flowCount: 180, delayMinutes: 1, averageSpeed: 42 },
  { time: '06:00', flowCount: 450, delayMinutes: 2, averageSpeed: 38 },
  { time: '07:00', flowCount: 1120, delayMinutes: 8, averageSpeed: 28 },
  { time: '08:00', flowCount: 1450, delayMinutes: 12, averageSpeed: 21 },
  { time: '09:00', flowCount: 950, delayMinutes: 6, averageSpeed: 30 },
  { time: '10:00', flowCount: 620, delayMinutes: 3, averageSpeed: 35 },
  { time: '11:00', flowCount: 580, delayMinutes: 3, averageSpeed: 36 },
  { time: '12:00', flowCount: 680, delayMinutes: 4, averageSpeed: 34 },
  { time: '13:00', flowCount: 820, delayMinutes: 5, averageSpeed: 32 },
  { time: '14:00', flowCount: 1280, delayMinutes: 9, averageSpeed: 24 },
  { time: '15:00', flowCount: 1650, delayMinutes: 14, averageSpeed: 19 },
  { time: '16:00', flowCount: 1510, delayMinutes: 13, averageSpeed: 20 },
  { time: '17:00', flowCount: 980, delayMinutes: 7, averageSpeed: 29 },
  { time: '11:00', flowCount: 650, delayMinutes: 4, averageSpeed: 34 },
  { time: '19:00', flowCount: 480, delayMinutes: 2, averageSpeed: 37 },
  { time: '20:00', flowCount: 320, delayMinutes: 1, averageSpeed: 40 },
  { time: '21:00', flowCount: 210, delayMinutes: 1, averageSpeed: 42 },
  { time: '22:00', flowCount: 110, delayMinutes: 1, averageSpeed: 45 }
];

export const ZONE_COMPARISON: ZoneDataPoint[] = [
  { zone: 'Śródmieście (Centrum)', passengers: 12400, capacity: 15000 },
  { zone: 'Rozwadów Sektor N', passengers: 3100, capacity: 6000 },
  { zone: 'Strefa Przemysłowa S', passengers: 9800, capacity: 11000 },
  { zone: 'Hutnik - Al. KEN', passengers: 7550, capacity: 9000 },
  { zone: 'Zasanie & Sudoły', passengers: 1500, capacity: 4000 }
];

export const KPI_STATS = [
  { title: 'Dzienny wolumen pasażerów', value: '34 350', unit: 'osób/dobę', change: '+12.4% vs ubiegły m.', trend: 'up' },
  { title: 'Średnia punktualność linii', value: '94.8%', unit: 'zgodność z rozkładem', change: '+2.1% v.s. cel', trend: 'up' },
  { title: 'Hotspoty o krytycznym ruchu', value: '2', unit: 'przystanki (Okulickiego, KEN)', change: 'Bez zmian', trend: 'neutral' },
  { title: 'Długość sieci przesyłowej', value: '78.5', unit: 'km tras aktywnych', change: '+4.2 km w tym roku', trend: 'up' }
];

// Rich, high-end qualitative contents for the analytical report
export const ANALYSIS_REPORT_TEXT = {
  causes: {
    title: 'Przyczyny Strukturalne',
    metric: 'Gęstość & Przepływ',
    content: 'Skumulowanie placówek oświatowych (dwie duże szkoły średnie, kampus politechniczny) oraz obiektów handlowo-usługowych przy ul. Okulickiego wywołuje nieliniowy rozkład potoków pasażerskich. Dodatkowo, jednokierunkowe pętle wymuszają okrężne trasy i wydłużają czas zatrzymania taboru.',
    factors: ['Szybki rozwój handlu detalicznego', 'Asymetryczna siatka drogowa', 'Koncentracja punktów szkolnictwa']
  },
  problem: {
    title: 'Zidentyfikowane Problemy',
    metric: 'Hotspoty Krytyczne',
    content: 'Analiza wykazuje spadek średniej prędkości handlowej do zaledwie 19 km/h w godzinach popołudniowych w rejonie Al. KEN i Okulickiego. Przeciążenie operacyjne dwóch kluczowych przystanków przekracza 130% ich nominalnej przepustowości, prowadząc do opóźnień sieciowych.',
    factors: ['Przeciążenie przystanków o 30%', 'Wąskie gardła przy pasażu', 'Zwiększony czas wysiadania']
  },
  aiSolution: {
    title: 'Rekomendacja Optymalizacyjna (Model AI)',
    metric: 'Algorytm Dynamiczny Generacji 4.0',
    content: 'Rekomendujemy wprowadzenie dwukierunkowej miniobwodnicy dla Linii 3 i 4 omijającej zator na ul. Okulickiego, połączonej z wdrożeniem dynamicznych tablic rozkładu jazdy (Dynamic Passenger Information). Zastosowanie priorytetu dla autobusów na skrzyżowaniu Al. KEN i ul. Niezłomnych skróci opóźnienia o estymowane 22%.',
    impact: 'Redukcja zatorów o ~22%, odciążenie węzła Okulickiego o 15%',
    actionList: ['Sygnalizacja z priorytetem (SIRT)', 'Wydzielenie buspasa KEN', 'Zintegrowana taryfa przesiadkowa']
  }
};
