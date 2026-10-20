# Mateshwari Travellers — pre-release visual / functional review (2026-10-20)

Scope: feature/mateshwari-cinematic-crm only. No merge, deploy, production CRM writes, or 360 activation.

## Evidence
- GitHub Actions #39470055942 for commit 20f07686: passed; includes Chromium and WebKit checks.
- Screenshots visually examined from earlier successful run #39408577249, artifact `website-visual-qa` (11 PNGs); these **precede** the latest mobile WebKit test commit, so they are not final acceptance screenshots.
- Screenshot set includes desktop studio, desktop fleet grid, mobile fleet card, mobile studio, 375px landing, mobile CTA, broken media case and TUV/Thar studio states.

## Findings and disposition
1. **P0 Media completeness**: desktop fleet overview visibly contains several large empty/placeholder vehicle image panels. This is a quality gap for a photography-led premium site, not an error with rotation. Audit each of the ten production-safe model-specific images; do not publish unverified imagery. **Open**.
2. **P1 Mobile studio**: gallery/studio appears narrow and tall, with model information and quote action lower down the page. Explicitly evaluate viewport scroll reachability, quote CTA contrast, focus and safe-area behavior on actual iOS Safari and Android Chrome. **Open, needs device QA**.
3. **P1 Mobile hero**: 375px screenshots show functioning hero and fixed contact actions, but typography, vertical rhythm, and overlap require actual-device visual acceptance. **Open**.
4. **Verified**: automation passed desktop Chromium, WebKit including mobile-width studio open/close and selected Ertiga quotation action, TypeScript build and CRM API unit tests (run #39470055942). Browser regression success is not the same as end-to-end production booking delivery.
5. **Scope**: unsupported 360 and external reference link no longer promoted by customer studio. No fabricated vehicle rotation. Do not revive this effort without a new task.

## Release gate / decision
**NO-GO for production** pending: review and clear the ten fleet card image placeholders and source/licence checks, confirm mobile studio and booking path on real devices, and approve final visual screenshots. CI green is necessary but not sufficient.

## Next actions
- Build per-car asset checklist from current gallery manifest; prefer existing reviewed images, never silently replace model or trim.
- Capture current branch screenshots at desktop 1440px and mobile 390px/375px; compare with evidence above and record observed problems.
- Test quotation end-to-end against an **isolated fixture**, not production CRM, including validation, errors and confirmation.
- Run CI again after any changes; request separate explicit approval before merge/deployment.
