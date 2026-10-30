# Artifact dizaynı — səhifə müqaviləsi

`artifact_publish` ilə dərc olunacaq HTML səhifəni yazmazdan əvvəl bu qaydalara əməl et. Dərc olunan səhifə sərt sandbox-da açılır: burada icazə verilməyən hər şey **səssizcə işləmir**.

## Fayl
- Tək `.html` faylı yaz. `<!doctype html>`, `<meta charset="utf-8">` və `<meta name="viewport" content="width=device-width, initial-scale=1">` olsun.
- Bütün CSS və JS **faylın içində** (inline) olsun. Şəkilləri `data:` URI kimi yerləşdir.
- Ölçü 2 MB-dan çox olmamalıdır.

## Başlıq
- `<title>` iki-dörd sözlük **ad** olsun, xülasə yox: «Satış Paneli», «Server Yük Hesabatı». Tire və ya iki nöqtədən sonra izah əlavə etmə.
- Eyni faylı yenidən dərc edəndə başlığı dəyişmə, çünki qalereyada artifactın adı budur.

## Sandbox — nə işləyir, nə işləmir
- Skript yalnız inline və ya bu CDN-lərdən yüklənir: `https://cdnjs.cloudflare.com`, `https://cdn.jsdelivr.net/npm/`, `https://unpkg.com`. Versiyanı dəqiq yaz (`react@18.3.1`), `@latest` yazma.
- Stil faylı yalnız Google Fonts-dan gəlir (`fonts.googleapis.com`), şrift faylları `fonts.gstatic.com`-dan. Hər şrift üçün fallback yaz.
- **Şəbəkə sorğusu yoxdur**: `fetch`, XHR və WebSocket bloklanır. Lazım olan məlumatı səhifənin içinə yerləşdir.
- Xarici şəkil, iframe, `<object>` işləmir. Xarici sayta yalnız `<a href>` linki ilə keçid ver, link yeni tabda açılır.
- `alert()`, `confirm()`, `prompt()` göstərilmir. Təsdiq addımı lazımdırsa, səhifənin öz UI-ında qur.
- Formun `submit`-i heç yerə getmir: `preventDefault()` ilə özün idarə et.
- Fayl yükləmə linkləri (`<a download>`) işləmir.
- `localStorage` saxlanmaya bilər: oxuma və yazmanı `try/catch` içində et, səhifə onsuz da düzgün işləsin.

## Tema
Hər rəngi token kimi təyin et. İşıqlı dəyərlər `:root`-da olsun, qaranlıq dəyərlər media query-də:
```css
:root { --bg: #fafaf9; --fg: #1c1c1a; --muted: #6b6b66; --accent: #0e7490; --line: #e7e5e4 }
@media (prefers-color-scheme: dark) {
  :root { --bg: #161615; --fg: #ececea; --muted: #a3a39e; --accent: #22d3ee; --line: #2c2c2a; color-scheme: dark }
}
body { background: var(--bg); color: var(--fg) }
```
Komponentlərdə rəngi birbaşa yazma, yalnız tokenlərdən istifadə et. İkinci temanı da birinci qədər diqqətlə hazırla.

## Telefon eni
- Səhifə 400px endə də işləməli, gövdə üfüqi sürüşməməlidir.
- Yanlarda ən azı 16px boşluq olsun. Grid və flex sətirləri dar ekranda tək sütuna düşsün.
- Geniş cədvəl və kod bloku öz `overflow-x: auto` qabının içində olsun.

## Məzmun
- Real məzmun yaz, lorem ipsum olmasın. İstifadəçinin dilində yaz (default: Azərbaycan dili).
- Mövzunun özünə aid ən azı bir detal olsun: real vahidlər, terminlər, sənəd üslubu.
- Sadə tapşırığa nəhəng «hero» blok lazım deyil. Aydın tipoqrafiya iyerarxiyası və səliqəli boşluqlar kifayətdir.

## Qrafik və diaqram
- Səhifədə qrafik, stat kartı və ya rəngli məlumat varsa, yazmazdan əvvəl **`dataviz`** skillini də yüklə: forma seçimi və yoxlanmış palitra oradadır.
- Arxitektura, axın və ya ardıcıllıq diaqramı varsa, **`artifact-diagramming`** skillini yüklə.

## Dərc
1. Faylı yaz.
2. `artifact_publish` ilə faylın yolunu ver.
3. Qaytarılan linki istifadəçiyə göstər. Dəyişiklikdən sonra **eyni faylı** yenidən dərc et, link eyni qalır.
