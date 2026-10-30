# İşi real proqramda yoxlamaq

«Testlər keçdi» ilə «proqram işləyir» eyni şey deyil. İşi «hazır» adlandırmazdan əvvəl dəyişikliyi **real işə sal** və nəticəni gözünlə gör.

## 1. Necə işə salındığını tap (təxmin etmə)
Bu ardıcıllıqla bax, ilk tapdığın etibarlıdır:
1. `AGENTS.md`, `XUDU.md`, `CLAUDE.md`, `README` içində «run», «start», «dev» bölməsi.
2. `package.json` → `scripts` (`dev`, `start`, `serve`), `Makefile`, `justfile`, `Procfile`, `docker-compose.yml`.
3. Dil konvensiyası: `go run .`, `cargo run`, `python -m <paket>`, `uv run`, `bun run`.
Tapmadınsa, istifadəçidən `question` aləti ilə soruş. Uydurulmuş əmr işlətmə.

## 2. Layihə növünə görə yoxla
| Növ | Necə işə sal | Nəyi göstər |
|---|---|---|
| CLI | dəyişən əmri real arqumentlə | stdout/stderr və exit kodu |
| Server/API | arxa planda başlat, sonra `curl` | status kodu və cavabın gövdəsi |
| Web UI | dev server + brauzer aləti varsa ekran görüntüsü | dəyişən elementin görünüşü |
| Kitabxana | kiçik skript ilə public API-ni çağır | qaytarılan dəyər |
| Skript/cron | bir dəfə əl ilə, test datası ilə | yaratdığı fayl və ya çıxış |

- Uzun işləyən prosesi (server) shell-in arxa plan rejimi ilə başlat, hazır olmasını port və ya log ilə gözlə, yoxlamadan sonra **dayandır**.
- `stdin` gözləyən əmrlərə `< /dev/null` ver, yoxsa donub qalır.
- Canlı/prod sistemdə işə salma: əvvəl lokal və ya test mühiti.

## 3. Dəyişikliyin özünü yoxla
Proqramın açılması kifayət deyil. **Dəyişdiyin davranışı** tetiklə: yeni flag, düzəldilən bug ssenarisi, yeni endpoint. Bug düzəlişidirsə, əvvəlki uğursuz ssenarini təkrarla və indi işlədiyini göstər.

## 4. Hesabat
- Nə işə saldın (dəqiq əmr), nə gördün (çıxışdan qısa parça).
- İşə sala bilmədinsə, **açıq de** və səbəbini yaz (asılılıq yoxdur, sirr lazımdır, aparat lazımdır). «Yəqin işləyir» yazma.
- Yoxlama uğursuzdursa, xətanı göstər və iş «hazır» deyil.
