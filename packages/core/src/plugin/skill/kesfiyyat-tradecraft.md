# Analitik tradecraft: sınaq və təkzib intizamı

Bu skill nəticəni **yazmaq** üçün deyil, nəticəyə **çatmaq və onu sınamaq** üçündür.

## Baza prinsip
> **Hipotezi təsdiqləməyə yox, TƏKZİB ETMƏYƏ çalış.** (CIA Tradecraft Primer, ACH)

Təsdiq axtarışı həmişə nəsə tapır. Təkzib cəhdindən sağ çıxan hipotez isə **möhkəmdir**. Praktik qayda: hər tapıntı üçün «bu nəticə başqa nə ilə izah oluna bilər?» sualına **ən azı üç** cavab yaz və onları bir-bir kəs.

## «Əminsən?» sualına cavab: öz-audit
Bu sual **yeni sınaq** tələb edir, əvvəlki cavabın təkrarını yox. Ardıcıllıq:
1. **Hesablanmış görünən, amma hesablanmamış iddianı tap.** Mətndə rəqəm var, amma o heç bir skriptdən və ya çıxışdan gəlmir? Ya hesabla, ya geri götür.
2. **Hansı iddian konfiqdən/defaultdan götürülüb, faktiki istifadədən yox?** Default dəyər ≠ işləyən dəyər (sorğu, preset, env onu dəyişə bilər). Faktiki yolu uçdan-uca oxu.
3. **Təhlil vahidini yoxla.** Bir ad («model X», «servis Y») əslində bir neçə şeyi gizlədə bilər (router, overflow, fərqli versiyalar). Ölçdüyün şey adın arxasındakı hansıdır?
4. **Geri götürülmüş iddianın başqa yerdə canlı qalmadığını yoxla.** Bir yerdə düzəldilən rəqəm sənədin başqa yerində qalır.
5. **İkili standart:** bir tərəfə tətbiq etdiyin meyarı digər tərəfə də tətbiq etmisən?
6. **Məxrəci yoxla:** faiz düzgün pəncərədən gəlir? Müqayisə olunan dövrlərin uzunluğu eynidir?
7. **Seçilmiş nümunədən çıxan 100%-ə şübhə et.** Seçim meyarı nəticəni yaradırsa, nəticə dairəvidir.
8. **Düzəlişi tapdıqca yaz.** Sonda toplayıb vermə: gec düzəliş aradakı qərarları zəhərləyir.

Əvvəlki cavabın səhv idisə, bunu **açıq de**. Yanlış iddianı səssizcə yenisi ilə əvəz etmə və yenisini də eyni sınaqdan keçir.

## Əsas fərziyyələrin yoxlanması (ən sürətli, ən faydalı)
1. Analitik xətti yaz.
2. **Bütün** müqəddimələri sadala: deyilənləri də, deyilməyənləri də.
3. Hər birini sorğula: *niyə doğrudur? hansı halda yanlış olar? yanlış olsa, nə dəyişər?*
4. Yalnız əsl dayaq fərziyyələri saxla.

**Sual şablonu:** «Hansı hal və ya məlumat bu fərziyyəni yanlış çıxarardı?» Cavab yoxdursa, bu fərziyyə deyil, doqmadır.

## Məlumat keyfiyyətinin yoxlanması
- Sahə **oxunub, yoxsa boş gəlib?** `0%` və `100%` nəticələr **oxunmamış sahənin imzasıdır**. Əvvəl sahəni yoxla, sonra nəticə çıxar.
- Sahənin adı sxemdə dəyişibmi? API versiyaları sahə adını səssizcə dəyişir.
- Rəqəm **doğru vahiddədir?** Fərqli platformaların metrikləri birbaşa müqayisə olunmur.
- Dəyər **bütün dövrün cəmidir, yoxsa pəncərədəkidir?**
- Tərif **bütün alt-sorğularda eynidir?** Bir yerdə `A||B`, başqa yerdə `A` yazılıbsa, bu qüsurdur.

## Rəqabətli hipotezlərin analizi (ACH)
Hipotezləri bir-bir qiymətləndirmə: sübutu **bütün** hipotezlərə qarşı düz.
1. Bütün ağlabatan hipotezləri sadala, özünə qarşı olanları da.
2. Əsas sübutları sadala.
3. Matris qur: üstdə hipotezlər, yanda sübutlar. Hər xana: **uyğun / ziddiyyətli / aidiyyatsız**.
4. **Ziddiyyətləri say, uyğunluqları yox.** Ən çox ziddiyyət toplayan hipotez ən zəifidir.
5. **Diaqnostik dəyər:** yalnız BİR hipotezə uyğun gələn sübut qiymətlidir. Hamısına uyğun gələn sübut heç nə demir.
6. **Görünməyən sübut:** hipotez doğru olsaydı, nəyi görməli idik, amma görmürük?
7. Zəif hipotezlər hesabatda qalır, izlənmək üçün.

## Ölçmə intizamı
- **Nəzarət qrupu olmadan rəqəm mənasızdır.** «X%» nəyə nisbətən? Eyni şəraitdə, eyni üsulla yığılmış müqayisə dəsti lazımdır.
- **Nəzarət qrupu ölçmə alətinin hər iki halı görə bildiyini sübut etməlidir.** Probe həmişə «bloklandı» yazırsa, onun «açıq» halı da görə bildiyini göstər.
- **Statistik güc əvvəlcədən:** «fərq tapılmadı» iki şeyi gizlədə bilər: ya fərq yoxdur, ya da nümunə onu görməyə kifayət etmir. Hər «null» nəticə ilə nümunə ölçüsünü yaz.
- **Qeyri-deterministik sistem** (məsələn, yüksək temperaturda model): bir qaçış sübut deyil. N qaçış et, nəticəni nisbət kimi ver.
- **Çoxlu test → düzəliş:** çox test aparılanda biri təsadüfən «əhəmiyyətli» çıxır.
- **Seçmə qərəzi:** müqayisə etdiyin iki dəst necə seçilib? Qərəzin istiqamətini müəyyənləşdir.
- **Avtomatik təsnifatın dəqiqliyi iddia edilmir, ölçülür.** Dəqiqliklə yanaşı əhatəni də göstər.

### Mətn axtarışı tələləri (AZ/TR mətnində kütləvi və səssiz)
- **Altsətir uyğunluğu:** `irib` naxışı «bildirib» sözünü də tutur. Sözün əvvəlinə lövbər qoy: `/(?<![\p{L}])termin/u`. Hər ölçmədə xam ↔ lövbərli fərqi hesabla. Fərq 1,5 dəfədən çoxdursa, əvvəl yalançı mənbəni göstər.
- **Qaçırılmamış regex metasimvolları** (`.` `*` `[`) naxışı öldürür və nəticə səssizcə sıfır olur.
- **Diakritik qatlanma:** `İ/I/ı` və `ş ğ ç ö ü ə` nəzərə alınmasa, ASCII lüğət heç vaxt uyğun gəlmir. JS-in `/i` bayrağı AZ/TR `İ`-ni tutmur, `toLocaleLowerCase("az")` isə ASCII «IRIB»-i «ırıb»-a çevirir. Hər ikisini tutmaq üçün hər iki tərəfi qatla: `const fold = (s) => s.toLocaleLowerCase("az").replace(/ı/g, "i")`, sonra lövbərli naxışı `fold(mətn)` üzərində işlət. Bu, `ı`/`i` fərqini itirir: dəqiqlik üçün nəticələri yoxla.
- **İnkar:** «Anti-X» və «X deyil» X kimi sayılmamalıdır.
- **Keçmiş ↔ indiki:** «keçmiş deputat» indiki deputat sayılmamalıdır.

## Ölçülə bilməyəni adı ilə elan et
Ölçülə bilməyən şey **susmaqla deyil, adla** göstərilir, səbəbi ilə birlikdə: alət yoxdur, API sahəni vermir, nümunə kifayət etmir. Bu zəiflik deyil, **sərhədin xəritəsidir**. Amma «API bunu vermir» son söz deyil: əvvəlcə alternativ yol axtar (başqa endpoint, açıq mənbə, fərqli vahid), tapılmasa, onda elan et.

## Təkzib edə bilmədiyin iddia
Başqasının tapıntısını yoxlayanda təkzib edə bilmədiyin iddianı «yanlışdır» deyə yox, **«sübut olunmayıb»** deyə yaz. Onların düz çıxdığı yerləri də qeyd et: yalnız səhvləri saymaq öz qərəzindir.
