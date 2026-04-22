#!/bin/bash
# 從 GCP Secret Manager 取出 staging-* secrets，注入環境變數後 exec 真正的指令。
# 由 systemd unit 的 ExecStart 呼叫：
#   ExecStart=/home/Company_Lili_Hotel/deploy/gcp/load-secrets.sh <command> [args...]
set -eo pipefail

get() {
  gcloud secrets versions access latest --secret="staging-$1"
}

export SECRET_KEY=$(get secret-key)
export DB_USER=$(get db-user)
export DB_PASS=$(get db-pass)
export OPENAI_API_KEY=$(get openai-api-key)
export LINE_CHANNEL_ACCESS_TOKEN=$(get line-channel-access-token)
export LINE_CHANNEL_SECRET=$(get line-channel-secret)
export PMS_SECRET=$(get pms-secret)
export BOOKING_API_KEY=$(get booking-api-key)
export BOOKING_CALLBACK_API_KEY=$(get booking-callback-api-key)
export FB_FIRM_PASSWORD=$(get fb-firm-password)

exec "$@"
