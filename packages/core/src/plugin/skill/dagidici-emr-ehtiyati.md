# Dağıdıcı əmr ehtiyatı

Geri dönməz və ya kənara təsir edən əməl icra etməzdən əvvəl dayan.

## Əvvəl
1. **Hədəfə bax**: silinəcək/üzərinə yazılacaq şeyin hazırda nə olduğunu göstər.
2. **Əhatəni daralt**: `rm -rf *` yox, dəqiq yol. `DELETE`/`UPDATE`-də `WHERE` və əvvəlcə `SELECT count(*)`.
3. **Canlı məlumat**: sxem sökən miqrasiya canlı bazada işlədilməz. Əvvəl backup / dry-run.
4. **Servis**: canlı sorğu axan servisi kor-koranə restart etmə — təhlükəsiz yol varsa onu işlət.

## İcra
Təsdiqlənməyən, kənara təsir edən əməli öz-başına etmə — istifadəçiyə nə edəcəyini de və gözlə. «Nə lazımdırsa» blanket icazə deyil.
