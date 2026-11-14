# Provider readiness — 14 November 2026

Single existing Netlify site `20dab8cd-fdc1-4196-937f-7c779661cf47`, Firebase project `mateshwari-travellers`. No deployment, merge, public visibility change, IAM grant, key creation, customer-record mutation, notification or key rotation was performed in this review.

## Evidence

Checkpoint `fb62b5741a3a1e3517c2f1e4c5b9290739acbaa9`:
- [Frontend CI passed](https://github.com/ktiwari539/Yatish-Travelers/actions/runs/43592135799): dependency audit, build/types, reviewed-image routing, SEO fixtures, Chromium, mobile automated accessibility and WebKit.
- [Firebase CRM offline verification passed](https://github.com/ktiwari539/Yatish-Travelers/actions/runs/43592135862): auth/controller contracts, Auth/Firestore emulators, publishing/conflicts, images, synthetic enquiry/quotation/status, encrypted recovery and process restart. These are not live-provider verification.
- Read the current source rather than copying an older implementation. Existing site-content draft/publish endpoints, completed/cancelled statuses and reviewed static-media routing are already on this checkpoint; no duplicate implementation was introduced.
- Netlify connector read-back: site is team-login protected for all deploys; `CRM_RELEASE_ENABLED=false`; `CRM_NOTIFICATIONS_MODE=disabled`. Existing `CRM_BACKUP_KEY` and `CRM_RATE_SALT` are present in production context, not write-only secrets, and apply to all scopes. No values printed or changed. Firebase PEM credential variables are absent.
- Work Cloud Browser opened the exact service-accounts page for the project, but returned “Site Unavailable / Unable to access this site” before authentication. One reload gave the same result. Live IAM inventory/grants cannot be asserted from this session. This is not evidence of an incorrect password or a bot challenge.

## IAM script review and correction

The original script checked only its new preferred account name and assumed every describe error meant absence. It also did not check existing custom-role permissions or read back the final grants. Those behaviors could duplicate the previously discussed `netlify-crm-runtime` identity or assign a broader existing role.

`scripts/configure-google-service-account.sh` now:
- Defaults to `--plan` (read only); mutations require explicit `--apply`.
- Inventories accounts, custom roles and project IAM. Inventory errors stop execution.
- Prefers existing `mateshwari-netlify-crm`, otherwise reuses existing `netlify-crm-runtime`, creating the preferred name only if neither exists and apply is requested. Never selects the Firebase service agent.
- Reuses either known Auth role only after checking that it is active and contains exactly `firebaseauth.users.get`.
- Refuses disabled accounts, extra direct project roles and conditional bindings that would otherwise be widened.
- Grants only Datastore User and the verified custom Auth role, then reads back both unconditional bindings. It does not audit inherited folder/organization permissions or service-account impersonation policies; inspect those separately in Console.
- Never creates or downloads keys, enables billing, deploys, or accesses business data.

Executed `bash -n` and eight fake-gcloud contract tests covering read-only plans, reuse, exact-role verification, read-back and failure before writes. These tests do not prove live IAM configuration.

In an authenticated Google Cloud Shell, review the latest script and run:

```bash
bash scripts/configure-google-service-account.sh --plan
# Only after reviewing the selected account and permissions:
bash scripts/configure-google-service-account.sh --apply
```

Run from a trusted checkout of this branch, or open the repository file and copy it into Cloud Shell. Do not run an older copy of the script. If executing through a browser agent, confirm the exact IAM grant at action time when required. No private key step is included.

## Runtime identity decision

Google WIF needs a supported ambient workload credential/issuer. No usable Netlify runtime OIDC issuer or validated Google token exchange was found or tested. Do not treat Firebase browser ID tokens, Netlify user login or GitHub Actions OIDC as runtime credentials.

The existing application supports an explicitly scoped service-account PEM injected by Netlify (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) as a fallback. Netlify Free ordinary provider environment variables can supply this, but are readable by authorized project tooling and trusted builds as well as Functions. Functions-only variable scoping is documented for Pro and above; Secrets Controller write-only storage is documented for Personal and above. Keep the owner’s Free constraint; do not silently upgrade or describe all-scope variables as runtime-only secrets.

The CLI documents deploy-only `--secret-env` values masked in UI/API and limited to Functions. Entitlement on this particular Free account and the secure transfer path have not been validated. It is not a proven workaround and must not justify a trial deployment. Do not pass private keys on a command line, store them in a repository, or paste them into chat. No private key is to be created automatically. If the ordinary Free provider-variable approach is accepted, the owner must perform the credential creation/secure-entry step directly through authorized provider interfaces, with build access restricted and secret scanning retained.

Official references reviewed:
- https://docs.cloud.google.com/iam/docs/workload-identity-federation
- https://docs.cloud.google.com/iam/docs/custom-roles-permissions-support
- https://docs.netlify.com/build/functions/environment-variables/
- https://docs.netlify.com/build/environment-variables/secrets-controller/
- https://cli.netlify.com/commands/deploy/

## Backup custody and rotation

Existing keys remain unchanged. Before any backup-key rotation, retain the current decryption key in an owner-controlled password manager/recovery vault separate from Netlify; record its creation/retirement dates and associated archive IDs without putting the value in a release report. Keep a separately stored encrypted archive. Verify recovery in a local emulator with that key before retiring it. The application currently uses one injected backup key, so older archives need their original key during an approved restore; changing the variable alone does not re-encrypt them. Never delete the old key after a rotation.

Rotate the independent rate salt only at a planned release after reviewing quotas: IP bucket hashes change, while global daily limits remain. Rate-salt rotation does not decrypt backups. Neither rotation is needed merely to finish this review.

## Remaining gates

1. Live Google IAM inventory/verification in an accessible authenticated Console/Cloud Shell; inspect inherited grants and impersonation policy as well as direct bindings.
2. Secure runtime credentials and owner acceptance of the actual Free storage exposure, or a proven supported keyless alternative. No real credential is available in this checkout.
3. Owner-controlled off-provider key/archive custody and a recovery rehearsal. Do not paste either into chat/GitHub.
4. Before the one separately approved private deploy: confirm Firestore deny-client rules/index readiness, Firebase authorized hostname, private-site access controls, final local approved media, and latest CI. Existing-data import remains separately prohibited.
5. After approved private deployment: synthetic live login/UID rejection, publication, booking/quote/status, uploads, cold invocation, quota observations and backup download/offline recovery. Keep notifications disabled. Public launch is a separate decision.

Recommendation: NO-GO for deployment until the provider identity and recovery-custody gates are met. Offline CI success does not remove these gates.
