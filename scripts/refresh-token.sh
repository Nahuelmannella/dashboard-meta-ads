#!/usr/bin/env bash
# Exchanges the current Meta Access Token for a fresh long-lived token
# (roughly 60 days) and updates dashboard/.env in place.
#
# Requires META_APP_ID, META_APP_SECRET and META_ACCESS_TOKEN to be set
# in dashboard/.env.
#
# Usage: bash scripts/refresh-token.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/dashboard/.env"
GRAPH_VERSION="v21.0"

if [ ! -f "$ENV_FILE" ]; then
    printf "Error: dashboard/.env not found. Run scripts/setup.sh first.\n" >&2
    exit 1
fi

# Load values from .env without executing arbitrary content
get_env() {
    local key="$1"
    grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d= -f2- || true
}

META_ACCESS_TOKEN="$(get_env META_ACCESS_TOKEN)"
META_APP_SECRET="$(get_env META_APP_SECRET)"
META_APP_ID="$(get_env META_APP_ID)"

if [ -z "$META_ACCESS_TOKEN" ] || [ -z "$META_APP_SECRET" ] || [ -z "$META_APP_ID" ]; then
    printf "Error: META_ACCESS_TOKEN, META_APP_SECRET and META_APP_ID must all be set in dashboard/.env.\n" >&2
    printf "Edit the file or run scripts/setup.sh again.\n" >&2
    exit 1
fi

printf "Requesting a fresh long-lived token from Meta...\n"

RESPONSE="$(curl -sS -G \
    --data-urlencode "grant_type=fb_exchange_token" \
    --data-urlencode "client_id=$META_APP_ID" \
    --data-urlencode "client_secret=$META_APP_SECRET" \
    --data-urlencode "fb_exchange_token=$META_ACCESS_TOKEN" \
    "https://graph.facebook.com/$GRAPH_VERSION/oauth/access_token")"

NEW_TOKEN="$(printf "%s" "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)"
EXPIRES_IN="$(printf "%s" "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('expires_in',0))" 2>/dev/null || echo 0)"

if [ -z "$NEW_TOKEN" ]; then
    printf "\nError: could not refresh token.\nResponse: %s\n\n" "$RESPONSE" >&2
    printf "Generate a new token at https://developers.facebook.com/tools/explorer/ and run scripts/setup.sh again.\n" >&2
    exit 1
fi

DAYS=$(( EXPIRES_IN / 86400 ))

# Rewrite .env preserving any extra keys
TMP_FILE="$(mktemp)"
{
    printf "# Meta Ads API Credentials\n"
    printf "# Refreshed by scripts/refresh-token.sh on %s\n" "$(date '+%Y-%m-%d %H:%M')"
    printf "# Long-lived token expires in ~%s days\n" "$DAYS"
    printf "# Do not commit this file.\n"
    printf "META_ACCESS_TOKEN=%s\n" "$NEW_TOKEN"
    printf "META_APP_SECRET=%s\n" "$META_APP_SECRET"
    printf "META_APP_ID=%s\n" "$META_APP_ID"
    # Keep any other custom keys the user may have added
    grep -vE "^(META_ACCESS_TOKEN|META_APP_SECRET|META_APP_ID|#)" "$ENV_FILE" || true
} > "$TMP_FILE"

mv "$TMP_FILE" "$ENV_FILE"
chmod 600 "$ENV_FILE" 2>/dev/null || true

printf "\nToken refreshed. Expires in ~%s days.\n" "$DAYS"
printf "Restart the dev server for the new token to take effect.\n\n"
