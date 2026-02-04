#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Karkey Auction Automation Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# This script is designed to run via cron/systemd on Hetzner server.
# It calls the Next.js API endpoint to trigger auction automation.
#
# Usage:
#   ./auction-cron.sh [action]
#
# Actions:
#   run      - Run all automation (prepare + activate + end)
#   prepare  - Prepare auctions (Friday 23:55)
#   activate - Activate auctions (Saturday 00:00)
#   end      - End expired auctions
#   status   - Check current status
#
# ═══════════════════════════════════════════════════════════════════════════════

# Configuration
APP_URL="${KARKEY_APP_URL:-https://karkey.com}"
CRON_SECRET="${KARKEY_CRON_SECRET:-your-secret-here}"
LOG_FILE="/var/log/karkey/auction-cron.log"

# Default action
ACTION="${1:-run}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🚗 Karkey Auction Automation - Action: $ACTION"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

case "$ACTION" in
    run)
        log "▶ Running full automation..."
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Authorization: Bearer $CRON_SECRET" \
            -H "Content-Type: application/json" \
            "$APP_URL/api/cron/auction-automation")
        ;;
    prepare|activate|end|status)
        log "▶ Running action: $ACTION..."
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            "$APP_URL/api/cron/auction-automation?action=$ACTION&secret=$CRON_SECRET")
        ;;
    *)
        log "❌ Unknown action: $ACTION"
        log "   Valid actions: run, prepare, activate, end, status"
        exit 1
        ;;
esac

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    log "✅ Success (HTTP $HTTP_CODE)"
    log "📋 Response: $BODY"
else
    log "❌ Failed (HTTP $HTTP_CODE)"
    log "📋 Response: $BODY"
    exit 1
fi

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log ""
