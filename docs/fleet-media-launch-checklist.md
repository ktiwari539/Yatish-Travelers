# Fleet media readiness — customer launch gate

Source reviewed: `src/fleetGallery.ts`, `src/mediaSafety.ts`, visual evidence from workflow #39408577249.

**Do not confuse source URLs with downloaded, plate-redacted, verified, release-ready photographs.** Gallery candidates are described by the code as *localhost editorial review only*. In particular, third-party Wikimedia delivery, licence attribution, exact variant and personal plate masking require separate confirmation.

| Model | Existing source-review concern | Approval |
|---|---|---|
| Maruti Dzire | 2025 hybrid model candidate may not match fleet generation | Pending |
| Maruti Ertiga | Indonesian motor-show trim; reference rather than actual assigned car | Pending |
| Toyota Innova | Some known exterior shots denied for visible number plates; model variant differs | Pending |
| Mahindra TUV | 2016 TUV300 candidate; exact generation/trim unconfirmed | Pending |
| Mahindra Bolero | Bolero GLX front/rear candidates; different trim | Pending |
| Tempo Traveller | Older Traveller variant; vehicle body/wheelbase unverified | Pending |
| Mahindra Scorpio-N | Rear candidate is labelled Scorpio Z8L; exact Scorpio-N match must be checked | Pending |
| Mahindra Thar | Some local reviewed previews; remaining source and variant review | Pending |
| Mahindra XUV700 | Some local reviewed previews; remaining source and variant review | Pending |
| Kia Carens | Indonesian 2022 Premiere trim; could differ from Indian fleet | Pending |

## Gate checks for every model

1. Exact model, generation and variant visually verified, without presenting stock imagery as proof of an assigned fleet vehicle.
2. Origin, attribution and commercial/web redistribution rights reviewed and recorded.
3. Image files and thumbnails actually load in both desktop and mobile builds. A URL alone is not a successful image.
4. Registration plates and personal identifiers redacted **in pixels**, where necessary. URL blocking is insufficient.
5. Fallback message remains legible when media fails. No unrelated model substitution.
6. Capture approval screenshots and record a reviewer decision for each vehicle.

**Status:** Technical tests green through #39470055942; all ten **media content approvals remain open** because source/visual/legal confirmation is unavailable. Do not claim the gallery is production-ready merely because browser smoke tests pass.
