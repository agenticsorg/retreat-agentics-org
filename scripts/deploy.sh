#!/usr/bin/env bash
# Deploy retreat.agentics.org to Cloud Run
# Usage: ./scripts/deploy.sh [--skip-build]
set -euo pipefail

PROJECT="agentics-487016"
REGION="us-central1"
SERVICE="retreat-agentics-org"
IMAGE="us-central1-docker.pkg.dev/${PROJECT}/cloud-run-source-deploy/${SERVICE}:latest"

echo "==> Checking gcloud auth..."
gcloud auth print-access-token --account=ruv@agentics.org > /dev/null 2>&1 || {
  echo "Not authenticated. Run: gcloud auth login"
  exit 1
}

if [[ "${1:-}" != "--skip-build" ]]; then
  echo "==> Type-checking..."
  npm run typecheck

  echo "==> Building frontend..."
  npm run build
fi

echo "==> Pruning Docker (free disk space)..."
docker system prune -f

echo "==> Configuring Docker auth..."
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

echo "==> Building Docker image..."
docker build -t "$IMAGE" .

echo "==> Pushing image..."
docker push "$IMAGE"

echo "==> Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --project="$PROJECT" \
  --region="$REGION" \
  --allow-unauthenticated \
  --quiet

echo ""
echo "Deployed: https://retreat.agentics.org"
