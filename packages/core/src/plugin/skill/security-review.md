# Təhlükəsizlik yoxlaması

Diff-i hücumçu gözü ilə oxu. Məqsəd nəzəri risk siyahısı deyil, **istismar oluna bilən** zəifliklərdir.

## 1. Əhatə
- `git diff`, `git diff --cached`, `git status --short` (yeni fayllar). Yalnız dəyişən kodu qiymətləndir, amma ona axan datanı başa düşmək üçün çağıran kodu da oxu.
- Hər giriş nöqtəsini tap: HTTP handler, CLI arqumenti, fayl oxuma, mühit dəyişəni, queue mesajı, webhook.

## 2. Nəyə baxmaq
| Sinif | Nə axtarmaq |
|---|---|
| İnyeksiya | SQL-də string birləşdirmə, shell-ə istifadəçi datası (`exec`, `spawn` + `shell: true`), `eval`, şablon inyeksiyası |
| Yol keçidi | istifadəçi verdiyi yol `..` ilə kökdən çıxa bilir, `path.join`-dan sonra sərhəd yoxlaması yoxdur |
| Authn/Authz | yeni endpoint-də auth yoxdur, sahiblik yoxlanmır (IDOR), rol yoxlaması müştəri tərəfindədir |
| Sirr | kodda, logda, xəta mesajında, commit-də açar və ya token |
| SSRF | istifadəçi verdiyi URL serverdən sorğulanır, daxili ünvanlar bloklanmır |
| Deserializasiya | etibarsız datada `pickle`, `yaml.load`, `unserialize` |
| XSS | istifadəçi datası `innerHTML`, `dangerouslySetInnerHTML`, escape-siz şablon |
| Kripto | öz kriptosu, `Math.random` token üçün, sabit IV, zəif hash ilə parol |
| Konfiq | CORS `*` + credentials, debug rejimi açıq, icazələr 777 |

## 3. Hər tapıntını yoxla
Tapıntı yalnız bu üç sual cavablananda yazılır:
1. **Giriş:** hücumçu bu datanı necə idarə edir?
2. **Yol:** data hansı sətirlərdən keçib təhlükəli nöqtəyə çatır? (`fayl:sətir` zənciri)
3. **Təsir:** nə əldə edir? (data oxuma, əmr icrası, başqa istifadəçinin hesabı)
Yol qırılırsa (arada doğrulama, parametrləşdirmə, escape var), tapıntı deyil. Cavab verə bilmirsənsə, «ehtimal» kimi ayrıca qeyd et, təsdiqlənmiş kimi yox.

## 4. Hesabat
Ciddiliyə görə sırala (kritik → aşağı). Hər tapıntı: `fayl:sətir`, sinif, istismar ssenarisi (konkret input), təsir, minimal düzəliş. Heç nə tapılmadısa, bunu de və nəyi yoxladığını sadala. Tapıntını şişirtmə.
