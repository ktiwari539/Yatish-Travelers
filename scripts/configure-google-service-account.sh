#!/usr/bin/env bash
# Read-only plan by default; --apply performs only the reviewed IAM changes.
# No keys, billing, project creation, deployment, or customer-data operations.
set -euo pipefail
PROJECT="mateshwari-travellers"
MODE="${1:---plan}"
[[ "$MODE" == "--plan" || "$MODE" == "--apply" ]] || { echo 'Usage: configure-google-service-account.sh [--plan|--apply]' >&2; exit 2; }
for cmd in gcloud python3; do command -v "$cmd" >/dev/null || { echo "$cmd is required" >&2; exit 1; }; done
# Failed/unauthorized inventory reads must stop, not be mistaken for absence.
gcloud projects describe "$PROJECT" --format='value(projectId)' >/dev/null
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
chmod 700 "$WORK_DIR"
gcloud iam service-accounts list --project="$PROJECT" --format=json > "$WORK_DIR/accounts.json"
gcloud iam roles list --project="$PROJECT" --format=json > "$WORK_DIR/roles.json"
gcloud projects get-iam-policy "$PROJECT" --format=json > "$WORK_DIR/policy.json"
python3 - "$WORK_DIR" "$PROJECT" <<'PY'
import json, pathlib, sys
folder, project = pathlib.Path(sys.argv[1]), sys.argv[2]
accounts = json.loads((folder/'accounts.json').read_text())
roles = json.loads((folder/'roles.json').read_text())
policy = json.loads((folder/'policy.json').read_text())
# Reuse either known purpose-built identity; never reuse Firebase's broad service agent.
candidates = ['mateshwari-netlify-crm', 'netlify-crm-runtime']
existing = {a['email']:a for a in accounts}
account = next((n for n in candidates if f'{n}@{project}.iam.gserviceaccount.com' in existing), candidates[0])
email = f'{account}@{project}.iam.gserviceaccount.com'
if existing.get(email, {}).get('disabled'):
    sys.exit('Runtime account is disabled. Review it; no replacement will be created.')
role_ids = ['mtFirebaseAuthUserRead', 'crmFirebaseAuthLookup']
role_names = {r['name'] for r in roles}
role = next((n for n in role_ids if f'projects/{project}/roles/{n}' in role_names),role_ids[0])
# Project custom-role list may omit permissions, so inspect the full role separately below.
allowed = {'roles/datastore.user', *(f'projects/{project}/roles/{n}' for n in role_ids)}
bindings = [b for b in policy.get('bindings',[]) if f'serviceAccount:{email}' in b.get('members',[])]
if any(b['role'] not in allowed for b in bindings):
    sys.exit('Runtime account has additional project roles. Review existing access before applying; no grants changed.')
if any(b.get('condition') for b in bindings):
    sys.exit('Runtime account has conditional bindings. Review them before adding unconditional access; no grants changed.')
(folder/'account').write_text(account)
(folder/'role').write_text(role)
(folder/'account-exists').write_text(str(email in existing).lower())
(folder/'role-exists').write_text(str(f'projects/{project}/roles/{role}' in role_names).lower())
print(f'Inspected {len(accounts)} existing service accounts. Selected runtime identity: {email}')
print(f'Auth role: projects/{project}/roles/{role}')
PY
ACCOUNT="$(cat "$WORK_DIR/account")"
AUTH_ROLE="$(cat "$WORK_DIR/role")"
EMAIL="${ACCOUNT}@${PROJECT}.iam.gserviceaccount.com"
ROLE="projects/$PROJECT/roles/$AUTH_ROLE"
verify_role() {
  gcloud iam roles describe "$AUTH_ROLE" --project="$PROJECT" --format=json > "$WORK_DIR/role.json"
  python3 - "$WORK_DIR/role.json" <<'PY'
import json, sys
role=json.load(open(sys.argv[1]))
if role.get('deleted') or role.get('stage') == 'DISABLED' or set(role.get('includedPermissions',[])) != {'firebaseauth.users.get'}:
    sys.exit('Existing Auth role is not active/exactly firebaseauth.users.get. Stop for review; no role overwritten.')
PY
}
# Validate both known bound Auth roles, even if only one will be selected.
for role_id in mtFirebaseAuthUserRead crmFirebaseAuthLookup; do
  if python3 - "$WORK_DIR/policy.json" "$EMAIL" "projects/$PROJECT/roles/$role_id" <<'PY'
import json,sys
p=json.load(open(sys.argv[1]))
sys.exit(0 if any(b['role']==sys.argv[3] and 'serviceAccount:'+sys.argv[2] in b.get('members',[]) for b in p.get('bindings',[])) else 1)
PY
  then
    SELECTED_ROLE="$AUTH_ROLE"; AUTH_ROLE="$role_id"; verify_role; AUTH_ROLE="$SELECTED_ROLE"
  fi
done
if [[ "$(cat "$WORK_DIR/role-exists")" == true ]]; then verify_role; fi
printf 'Plan: %s; grant roles/datastore.user and %s. No private keys.\n' "$EMAIL" "$ROLE"
if [[ "$MODE" == --plan ]]; then echo 'Read-only plan complete. Review before running with --apply.'; exit 0; fi
if [[ "$(cat "$WORK_DIR/account-exists")" == false ]]; then
  gcloud iam service-accounts create "$ACCOUNT" --project="$PROJECT" --display-name='Mateshwari CRM Netlify runtime' --quiet
fi
if [[ "$(cat "$WORK_DIR/role-exists")" == false ]]; then
  gcloud iam roles create "$AUTH_ROLE" --project="$PROJECT" --title='Mateshwari Firebase user lookup' \
    --description='Firebase Admin token revocation and disabled-user lookup only' \
    --permissions=firebaseauth.users.get --stage=GA --quiet
fi
verify_role
for grant in roles/datastore.user "$ROLE"; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$EMAIL" --role="$grant" --condition=None --quiet >/dev/null
done
gcloud projects get-iam-policy "$PROJECT" --format=json > "$WORK_DIR/verified-policy.json"
python3 - "$WORK_DIR/verified-policy.json" "$EMAIL" "$ROLE" <<'PY'
import json,sys
p=json.load(open(sys.argv[1]))
roles={b['role'] for b in p.get('bindings',[]) if 'serviceAccount:'+sys.argv[2] in b.get('members',[]) and not b.get('condition')}
if not {'roles/datastore.user',sys.argv[3]} <= roles: sys.exit('IAM read-back verification failed.')
print('Verified both required direct project bindings. No key created; inherited/folder/org access is not evaluated by this script.')
PY
