# Saper

Rekrutacyjna implementacja Sapera - logika gry jako czyste funkcje w `src/logic/board.ts`, plansze wczytywane z `saper-plansze.json`, reszta (UI, style) w React + SCSS.

## 1. Jak uruchomić

```bash
npm install
npm run dev      # aplikacja pod http://localhost:5173
npm run build    # build produkcyjny (tsc -b && vite build)
npm run test     # testy logiki (vitest)
```

Sprawdzone na czystym klonie, `npm run build` przechodzi bez błędów.

## 3. Co znalazłem w danych

Plik `saper-plansze.json` ma siedem poziomów i przynajmniej cztery z nich są tam po coś, nie przez przypadek.

**Pomyłka rachmistrza** deklaruje `mineCount: 10`, a w tablicy `mines` jest dwanaście współrzędnych. Zdecydowałem, że `mineCount` w ogóle nie jest źródłem prawdy - gra i tak nigdzie go nie czyta, licznik pozostałych min w UI będzie liczony z faktycznego stanu planszy (`cells.filter(c => c.mine).length`), więc rozjazd między deklaracją a rzeczywistością jest tu nieszkodliwy. Rozważałem odrzucanie takich poziomów jako nieprawidłowych, ale wtedy razem z bliźniętami i za płotem (patrz niżej) odpadłyby trzy z siedmiu poziomów, a `createBoard` i tak musi zwrócić zwykły `Board`. W kontrakcie typów nie ma miejsca na piąty stan typu "invalid".

**Bliźnięta** mają zdublowaną współrzędną `[2,2]`, osiem wpisów, siedem unikalnych pól. Że miny trzymam jako `Set<number>` (indeks pola, nie para współrzędnych), dedup wychodzi przy okazji, bez dodatkowej struktury do tego celu.

**Za płotem** ma minę `[8,3]` przy planszy 8 na 8, czyli poza zakresem (indeksy 0-7). Takie współrzędne po prostu odrzucam przy budowie planszy, bo nie odpowiadają żadnemu realnemu polu.

**Ciasno** to plansza 3 na 3, na której każde z dziewięciu pól to mina. To jawny test reguły "pierwsze odkrycie jest bezpieczne" w granicznym przypadku: skoro nie ma ani jednego bezpiecznego pola, żeby tam przenieść minę, reguła z treści zadania mówi wprost, że mina zostaje i gracz przegrywa na pierwszym ruchu. Nie robiłem tu żadnego wyjątku w kodzie, po prostu szukanie bezpiecznego pola zwraca "nie znaleziono" i dalej leci zwykła ścieżka odkrycia miny.

Przy okazji **Łąka** (0 min) nie jest problemem danych, ale ciekawym przypadkiem brzegowym: kaskada z pierwszego kliknięcia odkrywa od razu całą planszę i gra jest wygrana jednym ruchem.

Powyższe to błędy semantyczne w danych, które już mają poprawny kształt (stringi tam gdzie stringi, tablice tam gdzie tablice). Osobna sprawa to sam kształt JSON-a z fetcha, który w TypeScripcie jest `unknown` i nie ma żadnej gwarancji, że backend kiedyś nie zwróci czegoś połamanego strukturalnie (brakujące pole, zły typ). Dlatego `src/data/levels.ts` ma własny, ręcznie napisany type guard, który sprawdza kształt każdego poziomu, zanim cokolwiek trafi do `createBoard` - `createBoard` z założenia dostaje już poprawnie otypowany `Level` i nie musi się tym zajmować. To rozdzielenie (walidacja kształtu w loaderze, sanityzacja semantyki w `board.ts`) wydało mi się czystsze niż wrzucanie wszystkiego do jednej funkcji.

## 5. Biblioteki

- **React** - wymagany przez zadanie.
- **TypeScript** (strict) - wymagany.
- **Vite** - tylko do postawienia projektu, zero wpływu na logikę czy runtime.
- **sass** - SCSS jest wymagany wprost.
- **vitest** - runner testów, wybrałem go, bo w projekcie postawionym na Vite działa bez dodatkowej konfiguracji transformu TS/ESM.

## 6. Co zrobiłbym dalej

- Zgłaszanie rozjazdu `mineCount` vs rzeczywista liczba min do logów albo monitoringu zamiast po cichu ignorować
- Testy dla `src/data/levels.ts` (poprawny plik, zły kształt, nieudany fetch)
