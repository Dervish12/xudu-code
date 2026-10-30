# Məlumat vizuallaşdırması

Qrafik insanlar tərəfindən oxunur, sən isə onu qurursan. Bu skill «gözəl görünsün» istəyini yoxlamaları olan bir prosedura çevirir. Ardıcıllıqla get: **rəng ən sonda seçilir.**

## 1. Formanı seç (rəngdən əvvəl)
Əvvəl soruş: bu, ümumiyyətlə qrafik olmalıdırmı?

| Məlumat | İşlət | İşlətmə |
|---|---|---|
| Tək cari dəyər (+ dəyişmə) | **stat kartı** (dəyər + fərq) | tək sütunlu bar |
| Bir neçə əsas rəqəm | kart sırası | qruplaşdırılmış bar |
| Limitə nisbət | **metr** (eyni rəngdə zolaq) | 2 dilimli pie |
| ~7-dən çox mənalı sinif | **cədvəl** | daha çox rəng |

Qrafik lazımdırsa, növü işə görə seç:

| Oxucu nə etməlidir | Forma | Rəng işi |
|---|---|---|
| Böyüklüyü müqayisə etmək | bar / sütun, şəbəkə üçün heatmap | ardıcıl (tək rəng) |
| Zamanla trend | xətt, tək seriya üçün sahə | ardıcıl və ya 1 kateqoriya |
| Seriyaları ayırmaq | qruplaşdırılmış/yığılmış bar, çox xətt | **kateqoriya** |
| Bir seriya əsasdır, qalanı fon | **vurğu**: biri rəngli, qalanı boz | 1 rəng + boz |
| Baza xəttindən yuxarı/aşağı | divergent bar | divergent |
| Hissə-bütöv | yığılmış bar | kateqoriya |

Tək bir rəqəm mesajdırsa, 8 rəngli qrafik çəkmə: **vurğu** və ya **stat kartı** işlət.

## 2. Rəngi gördüyü işə görə ver: yalnız bu dəyərlərdən
Rəng uydurma. Aşağıdakı palitra rəng korluğu (CVD) və kontrast baxımından artıq yoxlanıb. **Sıra təhlükəsizlik mexanizmidir**, slotları həmişə bu ardıcıllıqla ver, heç vaxt dövr etmə.

**Kateqoriya (8 slot, sırayla):**

| Slot | İşıqlı | Qaranlıq |
|---|---|---|
| 1 mavi | `#2a78d6` | `#3987e5` |
| 2 narıncı | `#eb6834` | `#d95926` |
| 3 aqua | `#1baf7a` | `#199e70` |
| 4 sarı | `#eda100` | `#c98500` |
| 5 maqenta | `#e87ba4` | `#d55181` |
| 6 yaşıl | `#008300` | `#008300` |
| 7 bənövşəyi | `#6250d6` | `#9085e9` |
| 8 qırmızı | `#e34948` | `#e66767` |

- Scatter, bubble, xəritə kimi «hər nöqtə hər nöqtənin yanında» olan formalarda **ən çox 3 seriya** işlət, qalanını «Digər»-ə yığ.
- 4 seriyadan sonra birbaşa etiketlər məcburidir. 9-cu rəng heç vaxt yaradılmır: «Digər», kiçik qrafiklərə bölmək və ya cədvəl işlət.
- Sarı, maqenta və aqua işıqlı fonda 3:1-dən aşağı kontrast verir: onların yanında görünən etiket və ya cədvəl olsun.

**Ardıcıl (tək rəng, açıqdan tünd):** `#cde2fb` `#9ec5f4` `#6da7ec` `#3987e5` `#2a78d6` `#1c5cab` `#104281` `#0d366b`

**Divergent:** mavi ↔ qırmızı, ortası neytral boz (işıqlı `#f0efec`, qaranlıq `#383835`). Hər qolda eyni sayda pillə. Ortada rəng olmaz.

**Status (yalnız status üçün, seriya rəngi kimi işlətmə):** yaxşı `#0ca30c`, xəbərdarlıq `#fab219`, ciddi `#ec835a`, kritik `#d03b3b`. Status rəngi həmişə ikon və ya mətnlə birlikdə gəlir, rəng tək başına məna daşımır. **Bu dörd hex hər iki rejimdə eynidir:** qaranlıq rejim üçün status rəngi uydurma və dəyişmə.

**Səth və mürəkkəb:**

| Rol | İşıqlı | Qaranlıq |
|---|---|---|
| Qrafik səthi | `#fcfcfb` | `#1a1a19` |
| Əsas mətn | `#0b0b0b` | `#f0efec` |
| İkinci mətn | `#52514e` | `#c3c2b7` |
| Ox/etiket | `#898781` | `#898781` |
| Şəbəkə xətti | `#e1e0d9` | `#2c2c2a` |
| Baza xətti | `#c3c2b7` | `#383835` |

Bunları CSS dəyişəni kimi təyin et (işıqlı `:root`-da, qaranlıq `@media (prefers-color-scheme: dark)`-da) və qrafikdə yalnız rol adı ilə istifadə et.

## 3. Pozulmaz qaydalar
- **Bir ox.** İki y-şkalalı (dual-axis) qrafik heç vaxt çəkilmir: iki ayrı qrafik çək və ya hər ikisini 100-ə indekslə.
- **Rəng obyekti izləyir, sırasını yox.** Filtr seriya sayını dəyişəndə qalanların rəngi dəyişmir.
- **Mətn seriya rəngində yazılmır.** Dəyər, etiket və legend mətn rəngindədir, rəngli işarə yalnız yanında durur.
- ≥2 seriya varsa, legend həmişə var. ≤4 seriyanı birbaşa da etiketlə. Hər nöqtənin üstünə rəqəm yazma.

## 4. İşarələr
- İncə işarələr: xətt 2px, nöqtə ≥8px, barın ucu 4px yuvarlaq, baza xəttinə bağlı.
- Yanaşı bar və yığılmış seqmentlər arasında 2px səth boşluğu olsun. Çərçivə çəkmə.
- Şəbəkə və ox bərk hairline xəttdir, fondan bir ton fərqli. Qırıq xətt istifadə etmə.
- Etiket bara sığmırsa, barın ucundan kənara çıxar və ya tooltip-ə burax.
- Konteynerin hündürlüyü x-ox etiketlərini də əhatə etsin, kartda kiçik daxili sürüşmə yaranmasın.
- **Mətn ən azı 11px görünsün** (ox, etiket, legend), 400px endə də. SVG `viewBox` ilə kiçiləndə mətn də kiçilir: `font-size`-ı göstərilən enə görə hesabla və ya dar ekranda viewBox-u daralt. Chart.js-də `font.size` ≥ 11 ver.
- Böyük tək rəqəm adi sans şriftlə yazılır. `tabular-nums` yalnız cədvəl sütunlarında və ox rəqəmlərində.

## 5. Hover qatı (default)
- Xətt/sahə qrafikində crosshair + tooltip, bar/nöqtə/xanada üstünə gələndə tooltip olsun.
- Hədəf sahəsi işarədən böyük olsun (~24px).
- Tooltip məlumatı **gizlətmir**: hər dəyər birbaşa etiketdən və ya cədvəldən də oxunmalıdır.
- Filtrlər qrafiklərin üstündə tək sırada durur.

## 6. Əlçatanlıq
Hər qrafikin yanında **cədvəl görünüşü** olsun: açılan `<details>` və ya kiçik cədvəl. Qaranlıq rejim ayrıca seçilmiş dəyərlərdən qurulur (yuxarıdakı qaranlıq sütun), işıqlı rənglərin avtomatik çevrilməsi deyil.

## Qurma
- Sadə qrafikləri **inline SVG və ya HTML/CSS** ilə qur, kitabxana lazım deyil.
- Kitabxana lazımdırsa, yalnız icazəli CDN-dən, dəqiq versiya ilə yüklə (məsələn `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js`). Rəngləri yenə bu palitradan ver.
- Məlumatı səhifənin içinə yerləşdir (sandbox şəbəkə sorğusuna icazə vermir).
- Bitirəndə səhifəni təsəvvür etmə, yoxla: etiket toqquşması, kənardan daşma, 400px endə görünüş.
