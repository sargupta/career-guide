#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# SARGVISION AI — Cloud Run Deployment Script
# ═══════════════════════════════════════════════════════════════════

PROJECT_ID=$(/Users/sargupta/google-cloud-sdk/bin/gcloud config get-value project)
REGION="asia-south1" # Mumbai for low latency in India
GCR_REPO="sargvision"

echo "🚀 Starting Cloud Run Deployment for Project: $PROJECT_ID"

# 1-3. Builds skipped (already completed via cloudbuild.yaml)
echo "⏭️ Skipping redundant builds..."

# 4. Deploy Backend (Declarative)
echo "🚀 Deploying Backend API..."
export PROJECT_ID=$PROJECT_ID
# No longer using envsubst for most secrets as they are in Secret Manager
envsubst < backend/service.yaml > backend/service_resolved.yaml

/Users/sargupta/google-cloud-sdk/bin/gcloud run services replace backend/service_resolved.yaml --region $REGION

# 5. Deploy Kong Gateway
echo "🚀 Deploying Kong Gateway..."
/Users/sargupta/google-cloud-sdk/bin/gcloud run deploy sargvision-gateway \
  --image gcr.io/$PROJECT_ID/sargvision-gateway \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8000

# 6. Deploy Frontend
echo "🚀 Deploying Frontend..."
/Users/sargupta/google-cloud-sdk/bin/gcloud run deploy sargvision-frontend \
  --image gcr.io/$PROJECT_ID/sargvision-frontend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1

echo "✅ Deployment Complete!"
/Users/sargupta/google-cloud-sdk/bin/gcloud run services list
