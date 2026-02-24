#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# SARGVISION AI — Secret Sync Script
# ═══════════════════════════════════════════════════════════════════

ENV_FILE="backend/.env"
PROJECT_ID=$(/Users/sargupta/google-cloud-sdk/bin/gcloud config get-value project)

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

echo "🔐 Syncing secrets to Project: $PROJECT_ID"

# Read .env file and create/update secrets
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Trim whitespace and handle potential quotes
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs | sed 's/^"//;s/"$//')
    
    echo "📤 Syncing $key..."
    
    # Create secret if it doesn't exist
    /Users/sargupta/google-cloud-sdk/bin/gcloud secrets describe "$key" --project "$PROJECT_ID" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "✨ Creating new secret $key..."
        /Users/sargupta/google-cloud-sdk/bin/gcloud secrets create "$key" --project "$PROJECT_ID" --replication-policy="automatic"
    fi
    
    # Add secret version
    echo -n "$value" | /Users/sargupta/google-cloud-sdk/bin/gcloud secrets versions add "$key" --data-file=- --project "$PROJECT_ID"
    
done < "$ENV_FILE"

echo "✅ Secret sync complete!"
