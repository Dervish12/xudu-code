# Test intizamı

Yaşıl test özü-özlüyündə heç nə sübut etmir — testin **nəyi** yoxladığı sübut edir.

## Hər dəyişiklik üçün
- **Müsbət**: düzgün girişdə düzgün nəticə.
- **Mənfi**: yanlış/sərhəd girişdə düzgün şəkildə uğursuz olur. Mənfi test tək qalmamalıdır — yanında mütləq müsbət ssenari.
- **Mutasiya**: kodu qəsdən poz → test **qırmızı** olmalıdır. Qırmızı olmursa, test heç nə yoxlamır.

## Qırmızı bayraqlar
- Assertion olmayan test (yalnız çağırır, nəticəni yoxlamır).
- Udulmuş xəta (`try/except: pass`, boş `catch`).
- Həmişə keçən test (mutasiyada da yaşıl).

## Təqdim edəndə
«Testlər keçdi» yox — «N test: müsbət X, mənfi Y, mutasiya ilə təsdiq» de. Uğursuzluq varsa, çıxışı ilə göstər.
