#!/usr/bin/env bash
# Run manually in Google Cloud Shell after reviewing this script.
# Creates/reuses one restricted runtime identity. Does NOT create keys,
# change Firebase data, enable billing, deploy, or modify Netlify.
set -euo pipefail
PROJECT="mateshwari-travellers"
ACCOUNT="mateshwari-netlify-crm"
EMAIL="${ACCOUNT}@${PROJECT}.iam.gserviceaccount.com"
AUTH_ROLE="mtFirebaseAuthUserRead"
for cmd in gcloud; do
  command -v "$cmd" >/dev/null || { echo "Google Cloud CLI is required" >&2; exit 1; }
done
gcloud projects describe "$PROJECT" --format="value(projectId)" >/dev/null
echo "Checking service account in project $PROJECT..."
if ! gcloud iam service-accounts describe "$EMAIL" --project="$PROJECT" --format="value(email)" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$ACCOUNT" --project="$PROJECT" \
    --display-name="Mateshwari CRM Netlify runtime" --quiet
fi
echo "Checking least-privilege Firebase Authentication read role..."
if ! gcloud iam roles describe "$AUTH_ROLE" --project="$PROJECT" --format="value(name)" >/dev/null 2>&1; then
  gcloud iam roles create "$AUTH_ROLE" --project="$PROJECT" \
    --title="Mateshwari Firebase user lookup" \
    --description="Allows Firebase Admin token revocation and disabled-user checks" \
    --permissions="firebaseauth.users.get" --stage=GA --quiet
fi
echo "Granting Cloud Datastore User for Firestore documents..."
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$EMAIL" \
  --role="roles/datastore.user" --condition=None --quiet >/dev/null
echo "Granting Firebase user get only..."
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$EMAIL" \
  --role="projects/$PROJECT/roles/$AUTH_ROLE" --condition=None --quiet >/dev/null
echo "Service account IAM setup complete:"
echo "$EMAIL"
echo "No private key was generated. Do not place credentials in GitHub or chat."
echo "Next: configure trusted runtime credentials in the EXISTING Netlify project through its secure provider UI, subject to the secret-isolation policy."
