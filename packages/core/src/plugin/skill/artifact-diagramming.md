# Diaqram çəkmək

Bezəkçi kimi yox, bu qərarla yaşamalı olan mühəndis kimi çək. Diaqram yalnız o halda yerini qazanır ki, oxucunun mətndən özü yığmalı olacağı **mexanizmi** göstərsin: məlumat hara axır, hansı komponentlər danışır, iki variant arasında nə dəyişir, sorğu hansı vəziyyətlərdən keçir. Bir cümlə bunu daha tez deyirsə, cümləni yaz.

## Nə çəkmək
- **Adı yox, mexanizmi göstər.** «Keş» yazılmış qutu mətndən az deyir. Sorğunun keşdən keçən yolu, keşin arasında durduğu iki yaddaş, keş silinəndə yox olan ox isə sözlərin deyə bilmədiyini deyir.
- **Variantları müqayisə edirsənsə, fərqi çək.** İki arxitektura yanaşı, əvvəl və sonra, hər variantın əlavə etdiyi və ya sildiyi bir ox. Oxucu nə seçdiyini barmağı ilə göstərə bilməlidir. Bir-biri ilə əlaqəsi olmayan qutular müqayisə deyil.
- **Mürəkkəbliyi riskə uyğunlaşdır.** Tək addımlıq sual üç qutudur. Yazmaları növbədən keçirən miqrasiya isə növbəni, yazanı, oxuyanı və ardıcıllıq oxunu tələb edir.
- **Oxları etiketlə.** Etiketsiz ox «nəsə əlaqəlidir» deməkdir. `yazır`, `etibarsız edir`, `hər 30s sorğulayır` isə məlumatdır. Legend yalnız eyni kodlaşdırma (qırıq, rəngli) təkrarlananda lazımdır, əks halda mənanı işarənin üstünə yaz.

## Inline SVG qaydaları
Əl ilə `<svg>` yaz: `rect`, `circle`, `line`, `polyline`, `path`, `<text>`. Kitabxana, runtime, xarici şəkil olmasın.

- **Ölçü `viewBox` ilə:** `viewBox="0 0 W H"` və CSS-də `max-width: 100%; height: auto`. W və H-ni məzmuna görə seç. Geniş axın soldan sağa, qatlı yığın yuxarıdan aşağıya oxunur.
- **Tema `currentColor` ilə:** xətt, mətn və ox ucları `currentColor` olsun, səhifənin işıqlı və qaranlıq rənglərini özü götürür. Hərfi rəngi yalnız məna daşıyan bir elementə ver (tövsiyə olunan variant, müzakirə olunan addım) və onun hər iki fonda oxunduğuna əmin ol.
- **Ox ucu marker və ya polygon olsun:** `<defs><marker id="ox">…</marker></defs>` və `marker-end="url(#ox)"`, ya da xəttin ucunda kiçik `<polygon>`. Şəkil olmaz.
- **Mətn oxunaqlı olsun:** çəkilmiş miqyasda təxminən 11-13px, `text-anchor` ilə hizalanma, qısa etiketlər (1-3 söz). İzah cümləsi şəklin içində yox, altında yazılır.
- **Torla hizala:** ortaq baza xətləri və bərabər boşluqlar. Gözəyarı yerləşdirilmiş elementlər səs-küy kimi görünür.
- **Bir şəkil, bir iddia:** `<svg>`-i `<figure>` içinə qoy, `<figcaption>`-da şəklin nə göstərdiyini yaz. `<svg>`-ə `role="img"` və eyni iddianı daşıyan `aria-label` ver.
- **Özünə qapalı olsun:** SVG içində `<script>`, `<style>`, `<foreignObject>` olmasın. Gradient, pattern, `<use>` yalnız eyni fraqmentdəki id-lərə istinad etsin (`href="#id"`).
- **Dar ekran:** 400px endə mətn oxunmursa, diaqramı şaquli düzülüşə keçir və ya `overflow-x: auto` qabına qoy.

## Mermaid (yalnız lazım olanda)
Ardıcıllıq diaqramı və ya böyük vəziyyət maşını üçün əl ilə SVG çox ağırdırsa, mermaid icazəli CDN-dən dəqiq versiya ilə yüklənə bilər:
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<pre class="mermaid">sequenceDiagram
  CLI->>Gateway: POST /v1/xudu/artifacts
  Gateway-->>CLI: id, url</pre>
<script>mermaid.initialize({ startOnLoad: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' })</script>
```
Qısa və sadə diaqramlarda isə əl ilə yazılmış SVG daha yaxşıdır: kitabxana yükləmir və tamamilə sənin nəzarətindədir.
