# Sistemli debug

## Dəmir qanun
**KÖK SƏBƏB TAPILMADAN DÜZƏLİŞ YOXDUR.**

Simptomu düzəltmək köstəbək oyununa çevrilir: kök səbəbə toxunmayan hər düzəliş növbəti bugu tapmağı çətinləşdirir. Əvvəl kök səbəbi tap, sonra onu düzəlt.

## Faza 1: Kök səbəbi araşdır
Hipotez qurmazdan əvvəl kontekst yığ.
1. **Simptomları topla:** xəta mesajlarını, stack trace-ləri, təkrarlama addımlarını oxu. Kontekst çatmırsa, `question` aləti ilə bir dəfəyə bir sual ver.
2. **Kodu oxu:** simptomdan geriyə, mümkün səbəblərə doğru kod yolunu izlə. Bütün istinadları `grep` ilə tap, məntiqi `read` ilə başa düş.
3. **Son dəyişikliklərə bax:** `git log --oneline -20 -- <fayllar>`. Əvvəl işləyirdisə, nə dəyişib? Reqressiyadırsa, kök səbəb diff-dədir.
4. **Təkrarla:** bugu deterministik şəkildə yarada bilirsənmi? Bacarmırsansa, irəli getmədən əvvəl daha çox sübut yığ.

Kök səbəb hipotezi formalaşanda redaktələri **təsirlənən modulla məhdudlaşdır**. Bug bütün repo-ya yayılıbsa və ya əhatə aydın deyilsə, bunu açıq yaz.

## Faza 2: Naxış analizi

| Naxış | İmza | Harada axtarmaq |
|---|---|---|
| Race condition | ara-sıra, vaxtdan asılı | paylaşılan vəziyyətə eyni anda giriş |
| Null/undefined yayılması | TypeError, NoMethodError | opsional dəyərlərdə qoruma yoxdur |
| Vəziyyət korlanması | uyğunsuz data, yarımçıq yeniləmə | tranzaksiyalar, callback-lər, hook-lar |
| İnteqrasiya xətası | timeout, gözlənilməz cavab | xarici API, servis sərhədləri |
| Konfiq sürüşməsi | lokalda işləyir, prod-da yox | env dəyişənləri, feature flag, DB vəziyyəti |
| Köhnə keş | köhnə data, keş təmizlənəndə düzəlir | Redis, CDN, brauzer keşi |

Eyni fayllarda təkrarlanan buglar təsadüf deyil, **arxitektura problemidir**. Naxış tanış deyilsə, xətanın **kateqoriyasını** axtar, xam mesajı yox. Axtarmazdan əvvəl host adlarını, IP-ləri, yolları, SQL-i, müştəri datasını sil.

## Faza 3: Hipotezi sına
Heç bir düzəliş yazmazdan əvvəl hipotezi yoxla.
1. **Təsdiqlə:** şübhəli nöqtəyə müvəqqəti log, assertion və ya debug çıxışı qoy. Təkrarlamanı işə sal. Sübut uyğun gəlirmi?
2. **Hipotez səhvdirsə:** növbəti hipotezdən əvvəl daha çox sübut yığ, təxmin etmə.
3. **3 cəhd qaydası:** 3 hipotez uğursuz olubsa, **DAYAN** və `question` ilə istifadəçiyə üç yol təklif et: yeni hipotezlə davam etmək, sistemi tanıyan insana ötürmək, və ya log əlavə edib növbəti dəfəni gözləmək.

**Qırmızı bayraqlar**, bunları görsən, yavaşla:
- «Hələlik tez düzəliş». «Hələlik» deyə bir şey yoxdur: ya düzgün düzəlt, ya da ötür.
- Data axınını izləmədən düzəliş təklif etmək təxmindir.
- Hər düzəliş başqa yerdə yeni problem üzə çıxarırsa, səhv kodda yox, səhv qatdasan.

## Faza 4: Düzəliş
Kök səbəb təsdiqlənəndən sonra:
1. **Simptomu yox, kök səbəbi düzəlt:** problemi aradan qaldıran ən kiçik dəyişiklik.
2. **Minimal diff:** ən az fayl, ən az sətir. Qonşu kodu refactor etmə həvəsinə müqavimət göstər.
3. **Reqressiya testi yaz.** Test düzəliş **olmadan qırmızı** olmalıdır (test mənalıdır), düzəlişlə **yaşıl** (düzəliş işləyir). Testi düzəlişdən əvvəl işə salıb qırmızı olduğunu gör.
4. **Bütün test dəstini işə sal**, çıxışı göstər. Reqressiyaya icazə yoxdur.
5. Düzəliş **5-dən çox fayla** toxunursa, davam etməzdən əvvəl `question` ilə soruş: kök səbəb həqiqətən bu qədər fayla yayılıbmı, bölmək olarmı, daha dar yol varmı?

## Faza 5: Yoxlama və hesabat
Orijinal bug ssenarisini **yenidən təkrarla** və düzəldiyini təsdiqlə. Bu addım məcburidir.

```
DEBUG HESABATI
════════════════════════════════════════
Simptom:          [istifadəçinin gördüyü]
Kök səbəb:        [əslində nə səhv idi]
Düzəliş:          [nə dəyişdi, fayl:sətir ilə]
Sübut:            [test çıxışı, düzəlişin işlədiyini göstərən təkrarlama]
Reqressiya testi: [yeni testin fayl:sətri]
Status:           HAZIR | HAZIR_AMMA_QEYDLƏ | BLOKLANIB
════════════════════════════════════════
```
- **HAZIR:** kök səbəb tapıldı, düzəliş edildi, reqressiya testi yazıldı, bütün testlər keçir.
- **HAZIR_AMMA_QEYDLƏ:** düzəldildi, amma tam yoxlamaq mümkün olmadı (ara-sıra bug, prod lazımdır).
- **BLOKLANIB:** araşdırmadan sonra da kök səbəb aydın deyil, ötürüldü.

## Vacib qaydalar
- **3+ uğursuz düzəliş cəhdi → DAYAN və arxitekturanı sorğula.** Problem hipotezdə deyil, arxitekturadadır.
- **Yoxlaya bilmədiyin düzəlişi tətbiq etmə.** Təkrarlaya və təsdiqləyə bilmirsənsə, buraxma.
- **Heç vaxt «bu, düzəltməlidir» demə.** Yoxla və sübut et: testləri işə sal.
