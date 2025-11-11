# EigenFlow – HTMX Frontend

Prosty interfejs do wizualizacji danych z FastAPI za pomocą HTMX + Tailwind + Chart.js.

## Struktura
- **index.html** – główny dashboard z formularzem
- **components/chart.html** – fragment HTML z wykresem
- **assets/js/main.js** – logika wykresu
- **assets/css/tailwind.css** – style Tailwind

## Uruchomienie
Otwórz `frontend/index.html` w przeglądarce.  
Upewnij się, że backend FastAPI działa pod `http://localhost:8000/mp/plot`.

## Oczekiwana odpowiedź backendu
Backend powinien zwrócić HTML taki jak `components/chart.html`,
z wstawionymi danymi JSON w atrybucie `data-chart`.

Przykład struktury danych:
```json
// {
//   "x": [0, 1, 2, 3, 4, 5],
//   "hist": [0.01, 0.05, 0.12, 0.18, 0.15, 0.09],
//   "theory": [0.02, 0.06, 0.13, 0.17, 0.14, 0.08]
// }

Plik z końcówką .min.js oznacza zminifikowaną wersję — tzn. skompresowaną (bez spacji, komentarzy, krótsze nazwy zmiennych).
Przykład:

htmx.js → wersja czytelna, do nauki/debugowania
htmx.min.js → wersja zoptymalizowana do produkcji
Obie działają tak samo — różnią się tylko rozmiarem.



🔹 Proponowana struktura routerów (ścieżek)
1. / – Strona główna

Interaktywne UI do ustawiania parametrów:

N (liczba stopni swobody)

T (liczba prób)

rozkład wartości własnych macierzy kowariancji populacji (np. jednorodny, dwupunktowy, własny)

Krótki opis teorii Marczenko–Pastura i celu projektu

Przycisk „Generuj wizualizację” → wysyła zapytanie do backendu

Sekcja z dwoma wykresami:

Wykres empirycznego rozkładu wartości własnych (z symulacji)

Wykres teoretycznego rozkładu (z równania Marczenko–Pastura)

Porównanie miar błędu / metryk dopasowania

2. /visualization – Wizualizacja rozkładu

Router dedykowany interaktywnej wizualizacji

Możliwość:

zmiany parametrów w czasie rzeczywistym (suwaki)

przełączania między rozkładami populacyjnymi

podglądu histogramów, gęstości, itp.

Można dodać:

widok 3D (N/T vs shape rozkładu)

heatmapy błędu / odchylenia

3. /api/simulate – endpoint backendu (POST)

Dane wejściowe:

{
  "N": 100,
  "T": 300,
  "population_distribution": "uniform",
  "seed": 42
}


Zwraca:

{
  "empirical_eigenvalues": [...],
  "theoretical_density": [...],
  "lambda_grid": [...]
}


Obsługuje generowanie macierzy, obliczanie wartości własnych, histogramu itd.

4. /api/theory – endpoint do równania Marczenko–Pastura (GET lub POST)

Liczy gęstość analityczną dla danego q = N/T oraz rozkładu macierzy kowariancji

Może służyć do szybkiego porównania teorii bez generowania danych numerycznych

5. /api/compare – endpoint porównujący teorię z empirią

Zwraca dane do wizualizacji błędu (np. MSE, KL divergence, itp.)

Można pokazywać wyniki w formie heatmapy w zależności od N/T

6. /docs lub /about

Strona informacyjna:

krótki wstęp teoretyczny o prawie Marczenko–Pastura

opis metody numerycznej

bibliografia

link do repozytorium projektu

🔹 Co warto dodać na głównej stronie (/)

Panel parametrów:

pola/suwaki dla: N, T, q = N/T

wybór rozkładu populacyjnego (jednorodny, normalny, dwupunktowy, użytkownika)

przycisk „Generuj symulację”

Wykresy (np. plotly.js):

histogram wartości własnych empirycznych

gęstość analityczna Marczenko–Pastura nałożona na histogram

możliwość zoomowania, zapisu wykresu jako PNG

Tabela wyników numerycznych:

średnia, wariancja, max λ, min λ

błąd dopasowania teorii do symulacji

Sekcja informacyjna (collapsible):

definicja prawa Marczenko–Pastura

interpretacja fizyczna/statystyczna

notka o ograniczeniach modelu

Panel porównawczy (opcjonalnie):

pokazuje jak zmienia się rozkład wraz ze wzrostem q = N/T

animacja lub suwak do przeglądania efektu zmian

🔹 Dodatkowe pomysły (opcjonalne routery)

/api/random-matrix → endpoint tylko do generowania macierzy kowariancji

/heatmap → wizualizacja błędu dopasowania dla zakresu N/T

/upload → możliwość wgrania własnych danych (np. rzeczywista macierz kowariancji)