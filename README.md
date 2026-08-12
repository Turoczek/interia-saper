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

## 2. Co zrobiłem, a czego nie

Zrobione: cała logika (`createBoard`, `revealCell`, `toggleFlag`) z dokładnymi sygnaturami z treści zadania, chording jako osobny czysty moduł (`src/logic/chord.ts`), loader z walidacją kształtu danych, i pełny interfejs - wybór planszy, restart, odkrywanie/flagowanie bez menu kontekstowego, licznik pozostałych min, czytelna wygrana/przegrana z minami widocznymi tylko po przegranej. 21 testów, w tym wszystkie cztery wymagane kategorie. SCSS w BEM, wszystkie kolory/odstępy/rozmiary tylko ze zmiennych.

Czego nie zrobiłem, świadomie: nie testowałem `src/data/levels.ts` (uzasadnienie w punkcie 3) i nie obsłużyłem przypadku pustej listy poziomów w pliku (gdyby `saper-plansze.json` miał `"levels": []`, UI pokazałoby pusty toolbar bez żadnego komunikatu) - w dostarczonym pliku to się nie zdarza, więc nie dokładałem gałęzi kodu pod scenariusz, którego nie da się zaobserwować. Nie robiłem też pełnej semantyki ARIA `grid`/`gridcell` z nawigacją strzałkami - każde pole to prawdziwy, focusowalny `<button>` z opisowym `aria-label`, więc tab i czytniki ekranu działają, ale nie ma nawigacji strzałkami po siatce.

## 3. Co znalazłem w danych

Plik `saper-plansze.json` ma siedem poziomów i przynajmniej cztery z nich są tam po coś, nie przez przypadek.

**Pomyłka rachmistrza** deklaruje `mineCount: 10`, a w tablicy `mines` jest dwanaście współrzędnych. Zdecydowałem, że `mineCount` w ogóle nie jest źródłem prawdy - gra i tak nigdzie go nie czyta, licznik pozostałych min w UI będzie liczony z faktycznego stanu planszy (`cells.filter(c => c.mine).length`), więc rozjazd między deklaracją a rzeczywistością jest tu nieszkodliwy. Rozważałem odrzucanie takich poziomów jako nieprawidłowych, ale wtedy razem z bliźniętami i za płotem (patrz niżej) odpadłyby trzy z siedmiu poziomów, a `createBoard` i tak musi zwrócić zwykły `Board`. W kontrakcie typów nie ma miejsca na piąty stan typu "invalid".

**Bliźnięta** mają zdublowaną współrzędną `[2,2]`, osiem wpisów, siedem unikalnych pól. Że miny trzymam jako `Set<number>` (indeks pola, nie para współrzędnych), dedup wychodzi przy okazji, bez dodatkowej struktury do tego celu.

**Za płotem** ma minę `[8,3]` przy planszy 8 na 8, czyli poza zakresem (indeksy 0-7). Takie współrzędne po prostu odrzucam przy budowie planszy, bo nie odpowiadają żadnemu realnemu polu.

**Ciasno** to plansza 3 na 3, na której każde z dziewięciu pól to mina. To jawny test reguły "pierwsze odkrycie jest bezpieczne" w granicznym przypadku: skoro nie ma ani jednego bezpiecznego pola, żeby tam przenieść minę, reguła z treści zadania mówi wprost, że mina zostaje i gracz przegrywa na pierwszym ruchu. Nie robiłem tu żadnego wyjątku w kodzie, po prostu szukanie bezpiecznego pola zwraca "nie znaleziono" i dalej leci zwykła ścieżka odkrycia miny.

Przy okazji **Łąka** (0 min) nie jest problemem danych, ale ciekawym przypadkiem brzegowym: kaskada z pierwszego kliknięcia odkrywa od razu całą planszę i gra jest wygrana jednym ruchem.

Powyższe to błędy semantyczne w danych, które już mają poprawny kształt (stringi tam gdzie stringi, tablice tam gdzie tablice). Osobna sprawa to sam kształt JSON-a z fetcha, który w TypeScripcie jest `unknown` i nie ma żadnej gwarancji, że backend kiedyś nie zwróci czegoś połamanego strukturalnie (brakujące pole, zły typ). Dlatego `src/data/levels.ts` ma własny, ręcznie napisany type guard, który sprawdza kształt każdego poziomu, zanim cokolwiek trafi do `createBoard` - `createBoard` z założenia dostaje już poprawnie otypowany `Level` i nie musi się tym zajmować. To rozdzielenie (walidacja kształtu w loaderze, sanityzacja semantyki w `board.ts`) wydało mi się czystsze niż wrzucanie wszystkiego do jednej funkcji.

## 4. Co było najtrudniejsze

Najdłużej myślałem nad tym, czy różnice między `mineCount` a rzeczywistą liczbą min powinny w ogóle blokować poziom, czy tylko być po cichu ignorowane. Policzyłem, ile poziomów odpadłoby przy podejściu "odrzuć niespójne dane" (trzy z siedmiu) i to razem z tym, że `createBoard` z kontraktu musi zawsze zwrócić zwykły `Board` bez piątego stanu "invalid", przesądziło sprawę.

## 5. Biblioteki

- **React** - wymagany przez zadanie.
- **TypeScript** (strict) - wymagany.
- **Vite** - tylko do postawienia projektu, zero wpływu na logikę czy runtime.
- **sass** - SCSS jest wymagany wprost.
- **vitest** - runner testów, wybrałem go, bo w projekcie postawionym na Vite działa bez dodatkowej konfiguracji transformu TS/ESM.

## 6. Co zrobiłbym dalej

Rozjazd `mineCount` vs rzeczywista liczba min zgłaszałbym gdzieś do logów albo monitoringu zamiast po cichu ignorować - tu świadomie tego nie robię, bo wykracza poza zakres zadania, ale w prawdziwym systemie taki sygnał zwykle oznacza błąd po stronie backendu, który ktoś powinien zobaczyć.

Walidacja kształtu w `levels.ts` to teraz ręcznie pisane type guardy, bez żadnej biblioteki - dla jednego prostego typu `Level` to wystarcza i nic nie dokłada do zależności. Gdyby dane miały być bardziej złożone albo pochodzić z kilku różnych źródeł, sięgnąłbym po Zod - głównie po to, żeby dostać czytelny komunikat, które konkretnie pole i dlaczego zawiodło, zamiast samego `true`/`false` jak teraz. Poszedłbym też dalej i przeniósł samą walidację/sanityzację na backend (warstwa BFF) zamiast robić to w przeglądarce po fetchu - wtedy frontend zawsze dostawałby już czyste dane, a anomalie typu rozjazd `mineCount` byłyby łapane i logowane po stronie serwera, zanim w ogóle trafią do klienta, a nie cichcem naprawiane po stronie przeglądarki.

Dorzuciłbym też testy dla `src/data/levels.ts` (poprawny plik, zły kształt, nieudany fetch) - sprawdzone ręcznie w trakcie pisania, ale zadanie ogranicza wymóg testowy do `board.ts`, więc formalnie tego nie ma w repo.

Dodałbym pełną nawigację klawiaturą po siatce (strzałki zamiast tab-po-każdym-polu, ARIA `grid`/`gridcell`) - teraz jest dostępnie (prawdziwe przyciski, opisowe etykiety), ale nie tak wygodnie jak mogłoby być. Obsłużyłbym też przypadek pustej listy poziomów w danych, żeby UI nie zostawało z pustym toolbarem bez wyjaśnienia. Na produkcji rozważyłbym jeszcze zapamiętywanie ostatnio wybranego poziomu (np. w `localStorage`) i licznik czasu gry, ale to już dokładanie funkcji, nie poprawianie tego, co jest.

## 7. Gdzie korzystałem z AI

Pisałem z Claude Code jako parą do programowania. Asystent stawiał projekt, pisał pierwsze wersje funkcji w `board.ts` i komponentów UI, a ja to czytałem, poprawiałem i zawracałem, kiedy coś mi nie pasowało - konkretne przykłady: zbędny `Set<string>` przy dedupowaniu min, brak zabezpieczenia na zły indeks w `revealCell`, błąd z pokazywaniem min po wygranej zamiast tylko po przegranej, brakujące polskie znaki w tekstach UI, i zaszyte na sztywno wartości `1px`/`640px` w SCSS zamiast zmiennych. Decyzje projektowe (czy odrzucać niespójne poziomy, jak podzielić walidację między loader a `board.ts`, gdzie postawić granicę zakresu) podejmowałem ja - AI proponowało warianty i konsekwencje każdego, ale wybór i uzasadnienie jest moje.
