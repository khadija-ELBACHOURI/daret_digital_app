#!/usr/bin/env bash
# End-to-end test of the Daret payment flow with Stripe Checkout (test mode).
#
# Prerequisites (3 terminals):
#   1. stripe listen --forward-to localhost:8080/api/stripe/webhook
#      -> copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET
#   2. export STRIPE_SECRET_KEY=sk_test_...  STRIPE_WEBHOOK_SECRET=whsec_...
#      then start the Spring Boot app
#   3. ./test-stripe.sh        (requires curl and jq; on Windows use Git Bash or WSL)
#
# Pay on the Stripe page with: 4242 4242 4242 4242, any future date, any CVC.
# Declined card to try afterwards: 4000 0000 0000 0002.

set -euo pipefail

BASE="${BASE:-http://localhost:8080}"
PASSWORD="Test1234!"
SUFFIX="$RANDOM"
ORG_EMAIL="organizer${SUFFIX}@test.com"
MEM_EMAIL="member${SUFFIX}@test.com"

call() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local args=(-sS -X "$method" "$BASE$path" -H "Content-Type: application/json")
  if [[ -n "$token" ]]; then args+=(-H "Authorization: Bearer $token"); fi
  if [[ -n "$body" ]]; then args+=(-d "$body"); fi
  curl "${args[@]}"
}

step() { echo; echo "=== $1"; }

step "1. Register organizer and member"
ORG=$(call POST /api/auth/register "" "{\"email\":\"$ORG_EMAIL\",\"motDePasse\":\"$PASSWORD\",\"nom\":\"Organizer\"}")
MEM=$(call POST /api/auth/register "" "{\"email\":\"$MEM_EMAIL\",\"motDePasse\":\"$PASSWORD\",\"nom\":\"Member\"}")
ORG_TOKEN=$(echo "$ORG" | jq -r .token); ORG_ID=$(echo "$ORG" | jq -r .userId)
MEM_TOKEN=$(echo "$MEM" | jq -r .token); MEM_ID=$(echo "$MEM" | jq -r .userId)
echo "organizer: $ORG_EMAIL ($ORG_ID)"
echo "member:    $MEM_EMAIL ($MEM_ID)"

step "2. Organizer creates a group (2 members, 100 MAD)"
GROUP=$(call POST /api/groups "$ORG_TOKEN" \
  "{\"nom\":\"Test Daret\",\"montant\":100,\"frequence\":\"MENSUELLE\",\"nombreMembres\":2,\"dateDebut\":\"$(date +%F)\",\"description\":\"stripe test\"}")
GID=$(echo "$GROUP" | jq -r .id)
echo "group id: $GID"

step "3. Add member and assign positions (organizer = 1, member = 2)"
call POST "/api/groups/$GID/members" "$ORG_TOKEN" "{\"email\":\"$MEM_EMAIL\"}" | jq -c .
call PATCH "/api/groups/$GID/members/$ORG_ID/position" "$ORG_TOKEN" '{"position":1}' | jq -c .
call PATCH "/api/groups/$GID/members/$MEM_ID/position" "$ORG_TOKEN" '{"position":2}' | jq -c .

step "4. Activate the group and generate payments for turn 1"
call PATCH "/api/groups/$GID/status" "$ORG_TOKEN" '{"statut":"ACTIVE"}' | jq -c .
call POST "/api/groups/$GID/payments/generate" "$ORG_TOKEN" | jq -c .

step "5. Member starts a card payment"
CHECKOUT=$(call POST "/api/groups/$GID/payments/me/checkout" "$MEM_TOKEN")
echo "$CHECKOUT" | jq .
URL=$(echo "$CHECKOUT" | jq -r .url)
echo
echo "Open this URL and pay with 4242 4242 4242 4242:"
echo "$URL"
read -r -p "Press Enter once the Stripe page shows success... "

step "6. Member payment status (expect VALIDATED, set by the webhook)"
call GET "/api/groups/$GID/payments?cycle=0" "$MEM_TOKEN" | jq '.[] | {memberName, status, paidAt}'

step "7. Security checks (expect errors)"
echo "- member tries to pay again:"
call POST "/api/groups/$GID/payments/me/checkout" "$MEM_TOKEN" | jq -c .
echo "- member tries to generate payments (organizer only):"
call POST "/api/groups/$GID/payments/generate" "$MEM_TOKEN" | jq -c .

step "8. Organizer pays manually (only works if MANUAL_PAYMENTS_ENABLED=true)"
DECLARED=$(call POST "/api/groups/$GID/payments/me" "$ORG_TOKEN" '{}')
echo "$DECLARED" | jq -c .
PAY_ID=$(echo "$DECLARED" | jq -r '.id // empty')
if [[ -n "$PAY_ID" ]]; then
  call POST "/api/groups/$GID/payments/$PAY_ID/validate" "$ORG_TOKEN" | jq -c .

  step "9. Confirm payout and close turn 1"
  call GET "/api/groups/$GID/payouts/current" "$ORG_TOKEN" | jq -c .
  call POST "/api/groups/$GID/payouts/current/confirm" "$ORG_TOKEN" | jq -c .
  call POST "/api/groups/$GID/payments/turn/close" "$ORG_TOKEN" | jq -c .
else
  echo "Manual declaration is off, skipping steps 8 and 9."
  echo "To finish the cycle, pay the organizer's payment by card too (log in as $ORG_EMAIL)."
fi

echo
echo "Done."