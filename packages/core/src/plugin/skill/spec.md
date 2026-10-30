# Qeyri-müəyyən tapşırığı dəqiq tapşırığa çevirmək

Səhv şeyi mükəmməl qurmaq ən baha səhvdir. Tapşırıq bir neçə cür başa düşülə bilirsə, **kodlamadan əvvəl** bu 5 fazanı keç. Tapşırıq artıq dəqiqdirsə, bu skilli keç və işə başla.

## Faza 1: Məqsəd
- İstifadəçi əslində hansı problemi həll edir? Kim istifadə edəcək, nə vaxt?
- Bir cümləlik məqsəd yaz: «X edəndə Y baş verməlidir, çünki Z».

## Faza 2: Kontekst (soruşmazdan əvvəl özün yığ)
- Kodu oxu: oxşar funksiya, mövcud konvensiya, toxunulacaq fayllar.
- Kodun cavab verdiyi sualı istifadəçiyə vermə.

## Faza 3: Suallar
- Yalnız **cavabı nə edəcəyini dəyişən** sualları ver. `question` aləti ilə, bir dəfəyə bir mövzu, hər sualda tövsiyə etdiyin variant birinci.
- Ağlabatan default varsa, soruşma: seç və spesifikasiyada qeyd et.

## Faza 4: Spesifikasiya
```
MƏQSƏD:      [bir cümlə]
ƏHATƏ:       [nə edilir]
ƏHATƏDƏN KƏNAR: [nə edilmir — bu siyahı vacibdir]
QƏBUL MEYARLARI:
  - [yoxlanıla bilən: «X əmri Y çıxışını verir», «endpoint 403 qaytarır»]
RİSKLƏR:     [nə qıra bilər, geri dönüş yolu]
PLAN:        [addımlar, hər biri yoxlanıla bilən]
```
Hər qəbul meyarı test və ya əmrlə yoxlanıla bilməlidir. «Rahat», «sürətli» kimi ölçülməyən sözü rəqəmə çevir.

## Faza 5: Təsdiq
Spesifikasiyanı istifadəçiyə göstər və təsdiq al. Sonra planı todo siyahısına köçür və icra et. İcra zamanı əhatə dəyişirsə, dayan və spesifikasiyanı yenilə.
