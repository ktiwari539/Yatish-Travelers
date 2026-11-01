# Mateshwari Travellers — Free-only backend hosting decision (2026-11-01)

## Constraint and decision
Owner requires **$0 recurring backend hosting**, no public deployment yet. Preserve existing Netlify frontend, Node CRM, file-backed enquiries/catalog/uploads, separate reviewed media volume, admin security, tested backup/restore and no merge.

**Preferred evaluation target: Oracle Cloud Infrastructure Always Free VM + persistent Always Free block storage, with a single CRM container and HTTPS reverse proxy.** This is a *candidate*, not an allocated host, confirmed zero-cost tenancy, completed deployment or guaranteed-availability production service. Always Free shape availability depends on home-region capacity; idle resources can be reclaimed; verify current quotas and avoid any billable selections. Check OCI rules and the account's billing/alerts before provisioning.

### Provider evidence and rejection rationale

| Option | Finding | Decision |
| --- | --- | --- |
| OCI Always Free | VM and block volume allowance; operator controls OS, reverse proxy, persistent mounts. Home-region availability limits; possible idle-instance reclamation. | First target for real no-charge proof of concept. |
| Render Free Web Service | Spins down on inactivity; filesystem lost on redeploy/restart/spin-down; persistent disks unavailable on free. Free Render Postgres expires after 30 days. | Reject for unchanged file-backed CRM. |
| Koyeb Free Instance | No attached persistent volumes, idles to zero. | Reject for unchanged file-backed CRM. |
| Supabase Free | Hosted Postgres but inactivity can pause free projects and auto daily backups are not included in Free. Current CRM would require a nontrivial migration of journals, catalogs and uploads. | Alternative only with deliberate data migration and new tests. |
| Neon Free Postgres | 1 GB/project and compute scales to zero; not a drop-in replacement for uploaded media/filesystem CRM. | Alternative architecture; not an immediate hosting solution. |

Official provider references (recheck before provisioning):
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://render.com/docs/free
- https://www.koyeb.com/docs/reference/instances
- https://supabase.com/pricing
- https://neon.com/pricing

## Required OCI no-charge infrastructure experiment
1. Owner signs up/logs in to OCI with their own account and confirms Always Free eligibility, chosen home region, and that requested VM/storage/network resources show **Always Free** before approval. Some providers require payment verification; never share credentials here.
2. Provision a single compatible, Always Free compute instance and suitable durable boot/block volumes **inside the eligible home region**. Confirm boot + data volumes collectively fit the allowance; do not click billable upgrade. Review instance reclaim policies and quota/capacity availability.
3. Use only a test dataset. Apply firewall, SSH keys, OS patching, fail2ban or equivalent, appropriate outbound policy, reverse proxy HTTPS and host ingress rate limits; keep CRM container port bound to loopback. Use Node 22 supported image architecture and one CRM replica.
4. Mount both directories expected by `compose.crm.yml` and verify actual persistent backing across **container replacement and VM reboot** (not just `/api/health`). Test file writes, Admin catalog changes, image uploads, synthetic booking, quotation and status recovery.
5. Run offline backup/restore into fresh destinations; encrypt and copy backups off the VM to a storage destination whose free allowance and durability have been separately verified. A backup on the same VM is insufficient. Test disaster recovery and record realistic RPO/RTO.
6. Configure provider-level monitoring for instance health, disk space, backup failures, SSL expiry and billing/quota alerts. Enable staff-managed enquiry follow-up; do not turn on real provider notifications without consent and operational tests.
7. Create a **dedicated** Netlify project only after backend tests. Set actual HTTPS `VITE_PUBLIC_SITE_ORIGIN` and `MT_CRM_API_ORIGIN`; test same-origin proxy `/api/*`, no HTML fallback, anonymous/admin access, and an end-to-end synthetic enquiry on a private preview.
8. Complete mobile/performance/media/business approvals and explicit launch authorization. Draft PR remains unmerged until separate approval.

## Stop/go criteria
- **STOP** if no OCI Always Free compute capacity, account/credit-card constraints unacceptable to owner, no durable volume, no off-host backups, security gaps, or unreliable restarts.
- **NO-GO** for public bookings until the full production-like canary succeeds: HTTPS -> Netlify proxy -> CRM -> durable storage -> authenticated Admin -> restart/recreate -> verified restore.
- **No guaranteed always-on or zero-risk free option.** If OCI is unavailable, user must choose between a free *non-production preview* and reconsidering the strict zero-cost requirement, rather than silently risking customers' records.

## Next handoff for Work
Use owner-authorized OCI account access through the provider, provision only explicitly Free-eligible resources, run the exact verification above, save redacted evidence/commands in the feature branch. Do not expose passwords/tokens, merge, deploy publicly, modify real CRM records or change existing Netlify projects.
