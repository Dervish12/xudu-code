/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill.js"

import { define } from "@xudu/plugin/effect/plugin"
import { Effect } from "effect"
import { AbsolutePath } from "../schema.js"
import { Skill } from "../skill.js"
import xuduContent from "./skill/xudu-code.md" with { type: "text" }
import oxuContent from "./skill/oxu-sonra-redakte.md" with { type: "text" }
import testContent from "./skill/test-intizami.md" with { type: "text" }
import dagidiciContent from "./skill/dagidici-emr-ehtiyati.md" with { type: "text" }
import konvensiyaContent from "./skill/konvensiya-uygunlugu.md" with { type: "text" }
import artifactDesignContent from "./skill/artifact-design.md" with { type: "text" }
import datavizContent from "./skill/dataviz.md" with { type: "text" }
import diagramContent from "./skill/artifact-diagramming.md" with { type: "text" }
import investigateContent from "./skill/investigate.md" with { type: "text" }
import tradecraftContent from "./skill/kesfiyyat-tradecraft.md" with { type: "text" }
import runContent from "./skill/run.md" with { type: "text" }
import securityContent from "./skill/security-review.md" with { type: "text" }
import specContent from "./skill/spec.md" with { type: "text" }
import arayisContent from "./skill/kesfiyyat-arayis.md" with { type: "text" }
import reviewPrompt from "./command/review.txt"

export const XuduContent = xuduContent

export const XuduDescription =
  "Use this skill for any question about xudu-code itself: signing in with xudu.ai, plans and daily limits, configuration (xudu-code.json, .xudu-code/), instruction files (XUDU.md, AGENTS.md, CLAUDE.md), skills, agents, commands, permissions, MCP servers, themes, keybinds, the CLI and TUI, the background service, upgrading, and troubleshooting."

const BUILTIN: ReadonlyArray<{ id: string; name: string; description: string; content: string }> = [
  {
    id: "xudu-code",
    name: "xudu-code",
    description: XuduDescription,
    content: XuduContent,
  },
  {
    id: "oxu-sonra-redakte",
    name: "oxu-sonra-redakte",
    description:
      "Mövcud faylı dəyişməzdən ƏVVƏL yüklə. Tetiklər: edit, write ilə overwrite, patch, sed -i, > yönləndirmə, «has not been read in this session» və ya «has changed since you last read it» xətası. Əvvəl oxu, sonra dəyiş.",
    content: oxuContent,
  },
  {
    id: "test-intizami",
    name: "test-intizami",
    description:
      "Test yazanda, testi düzəldəndə və ya işi «testlər keçdi» deyə təqdim etməzdən ƏVVƏL yüklə. Tetiklər: test, spec, bun test, pytest, jest, «yaşıl», «keçdi», assertion. Müsbət + mənfi + mutasiya; yaşıl test tək başına sübut deyil.",
    content: testContent,
  },
  {
    id: "dagidici-emr-ehtiyati",
    name: "dagidici-emr-ehtiyati",
    description:
      "Geri dönməz və ya kənara təsir edən əməldən ƏVVƏL yüklə. Tetiklər: rm -rf, DROP/TRUNCATE/DELETE, git reset --hard, git push --force, git clean, canlı DB miqrasiyası, kütləvi dəyişiklik, servis restart, deploy.",
    content: dagidiciContent,
  },
  {
    id: "konvensiya-uygunlugu",
    name: "konvensiya-uygunlugu",
    description:
      "Mövcud kod bazasına yeni kod, fayl və ya funksiya əlavə etməzdən ƏVVƏL yüklə. Tetiklər: yeni funksiya/komponent/modul, refactor, «əlavə et», «implement». Adlandırma, şərh sıxlığı, idiom və struktur ətrafdakı koda uyğun olsun.",
    content: konvensiyaContent,
  },
  {
    id: "artifact-design",
    name: "artifact-design",
    description:
      "artifact_publish ilə dərc olunacaq HTML səhifəni yazmazdan ƏVVƏL yüklə: hesabat, panel, müqayisə, kiçik alət, landing və ya göstəriləcək/paylaşılacaq hər səhifə. Səhifə müqaviləsi: başlıq, işıqlı/qaranlıq tema tokenləri, telefon eni, icazəli CDN-lər, şəbəkə sorğusu yoxdur.",
    content: artifactDesignContent,
  },
  {
    id: "dataviz",
    name: "dataviz",
    description:
      "Hər hansı qrafik, diaqram-qrafik, stat kartı, KPI sırası, dashboard, heatmap, sparkline və ya rəngli məlumat vizualı qurmazdan ƏVVƏL yüklə. Tetiklər: qrafik, chart, bar, xətt, pie, trend, müqayisə, panel, dashboard, Chart.js. Forma seçimi, yoxlanmış rəng palitrası, işarə və hover qaydaları.",
    content: datavizContent,
  },
  {
    id: "artifact-diagramming",
    name: "artifact-diagramming",
    description:
      "Arxitektura, axın, ardıcıllıq, vəziyyət maşını və ya iki variantın müqayisəsi üçün diaqram çəkməzdən ƏVVƏL yüklə. Tetiklər: diaqram, sxem, arxitektura, axın, flow, sequence, mermaid, SVG. Mexanizmi göstərmək, oxları etiketləmək, inline SVG qaydaları.",
    content: diagramContent,
  },
  {
    id: "investigate",
    name: "investigate",
    description:
      "Xəta, bug və ya gözlənilməz davranışı düzəltməzdən ƏVVƏL yüklə. Tetiklər: xəta, error, bug, stack trace, 500, crash, «işləmir», «dünən işləyirdi», «niyə sınıb», test qırmızıdır, debug. Kök səbəb tapılmadan düzəliş yoxdur; 5 faza, 3 cəhd qaydası, reqressiya testi.",
    content: investigateContent,
  },
  {
    id: "kesfiyyat-tradecraft",
    name: "kesfiyyat-tradecraft",
    description:
      "İstifadəçi «əminsən?», «əminik?», «yoxla», «are you sure?» soruşanda, nəticə çox təmiz görünəndə, ya da hipotez, ölçmə və ya audit nəticəsini iddia etməzdən ƏVVƏL yüklə. Tetiklər: əminsən, sübut, hipotez, təkzib, nəzarət qrupu, faiz, statistika, audit. Öz-audit, fərziyyə yoxlaması, ACH, ölçmə intizamı.",
    content: tradecraftContent,
  },
  {
    id: "run",
    name: "run",
    description:
      "İşi «hazır», «bitdi», «işləyir» adlandırmazdan ƏVVƏL yüklə: dəyişikliyi real proqramda işə salıb yoxlamaq üçün. Tetiklər: işə sal, run, start, yoxla işləyirmi, demo, ekran görüntüsü, before saying done. CLI, server, web UI, kitabxana üçün işə salma və yoxlama qaydası.",
    content: runContent,
  },
  {
    id: "code-review",
    name: "code-review",
    description:
      "Commit, push və ya PR-dan ƏVVƏL, ya da istifadəçi «review et», «diff-i yoxla», «bug var?» deyəndə yüklə. Tetiklər: review, code review, diff, commit, PR, pull request. Dəyişikliyi bug üçün oxumaq, hər tapıntını sübut etmək, ciddiliyə görə hesabat.",
    content: reviewPrompt
      .replace("Input: $ARGUMENTS", "Input: the scope the user named; if none, the uncommitted changes.")
      .replaceAll("$ARGUMENTS", "<target>"),
  },
  {
    id: "security-review",
    name: "security-review",
    description:
      "Auth, parol, token, sirr, istifadəçi inputu, SQL, shell əmri, fayl yolu, URL sorğusu, upload və ya icazə koduna toxunan dəyişiklikdən sonra və istifadəçi «təhlükəsizlik», «security», «zəiflik» deyəndə yüklə. İnyeksiya, authz, SSRF, XSS, sirr sızması; hər tapıntı üçün istismar yolu.",
    content: securityContent,
  },
  {
    id: "spec",
    name: "spec",
    description:
      "Tapşırıq bir neçə cür başa düşülə bilirsə, böyükdürsə və ya qəbul meyarı yoxdursa, kodlamadan ƏVVƏL yüklə. Tetiklər: yeni feature, «qur», «sistem lazımdır», «necə edək», plan, spec, requirements, vague request. Məqsəd, əhatə, qəbul meyarları, risklər, plan.",
    content: specContent,
  },
  {
    id: "kesfiyyat-arayis",
    name: "kesfiyyat-arayis",
    description:
      "Kəşfiyyat/analitik sənəd, arayış, hesabat, təqdimat, brief, təhdid qiymətləndirməsi və ya qərar memorandumu YAZMAZDAN əvvəl yüklə (HTML, artifact, PDF, mətn). Tetiklər: kəşfiyyat sənədi, arayış, analitik hesabat, assessment, brief, qiymətləndirmə, tapıntı, etibar dərəcəsi. BLUF quruluşu, etibar memarlığı, ICD 203, rəsmi üslub.",
    content: arayisContent,
  },
]

export const Plugin = define({
  id: "xudu.skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((editor) => {
      for (const skill of BUILTIN) {
        editor.add(
          Skill.Info.make({
            id: Skill.ID.make(skill.id),
            name: Skill.Name.make(skill.name),
            description: skill.description,
            path: AbsolutePath.make(`/builtin/${skill.id}.md`),
            content: skill.content,
          }),
        )
      }
    })
  }),
})
