# Oxu, sonra redaktə et

Mövcud faylı görmədən dəyişmə. Korlanma demək olar ki, həmişə oxunmamış kontekstdən gəlir.

## Qayda
1. Faylı dəyişməzdən əvvəl **oxu** (read / `cat` / `sed -n`). Böyük fayldırsa, dəyişdiyin hissəni və ətrafını oxu.
2. Dəyişəcəyin dəqiq sətri/bloku gözlə gör — təxmin etmə. Əvəz etdiyin mətn faylda **unikal** olmalıdır.
3. `>` ilə üzərinə yazmazdan əvvəl faylın hazırkı məzmununa bax (overwrite edirsən, əlavə etmirsən).
4. Redaktədən sonra nəticəni yoxla (yenidən oxu və ya diff).

## Niyə
Oxumadan edilən dəyişiklik yanlış yerə düşür və ya unikal olmayan naxışı hər yerdə dəyişir. Bir dəfə oxumaq, üç dəfə düzəltməkdən ucuzdur.

## Alət bunu məcbur edir
`edit`, `write` (mövcud fayl üçün) və `patch` bu sessiyada oxunmamış faylı dəyişməyə icazə vermir. Fayl oxunandan sonra başqa yerdə dəyişibsə, yenidən oxumağı tələb edir. Belə xəta görsən, faylı `read` ilə oxu və dəyişikliyi təkrarla. Xətadan yan keçməyə çalışma (məsələn, shell ilə yazmaq), çünki qaydanın məqsədi köhnə və ya təxmini mətn üzərində redaktənin qarşısını almaqdır.
