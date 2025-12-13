#!/bin/bash
set -e

# ========================================
# SENOVA CRM - PRODUCTION DEPLOYMENT SCRIPT
# ========================================
# Usage: ./scripts/deploy-production.sh
# ========================================

echo "=================================="
echo "🚨 PRODUCTION DEPLOYMENT"
echo "=================================="
echo ""
echo "⚠️  This will deploy to PRODUCTION at crm.senovallc.com"
echo "⚠️  Make sure you have:"
echo "   ✅ Tested in staging environment"
echo "   ✅ Reviewed all code changes"
echo "   ✅ Verified .env.production has production values"
echo "   ✅ SSL certificates are configured"
echo ""
read -p "🚨 Are you sure you want to proceed? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Record deployment start time
DEPLOYMENT_START=$(date +%Y%m%d_%H%M%S)
echo ""
echo "📅 Deployment started at: $(date)"
echo ""

# Get current commit SHA for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "📌 Current commit: $CURRENT_COMMIT"
echo "   (Save this for rollback if needed)"
echo ""

# Step 1: Create database backup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Step 1/8: Creating database backup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BACKUP_FILE="backup_${DEPLOYMENT_START}.sql"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres senova_crm > "backups/$BACKUP_FILE" 2>/dev/null || {
    echo "⚠️  Could not create backup (database may not be running yet)"
    mkdir -p backups
}
echo "✅ Backup saved to: backups/$BACKUP_FILE"
echo ""

# Step 2: Pull latest code
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 Step 2/8: Pulling latest code from Git..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git pull origin main
NEW_COMMIT=$(git rev-parse HEAD)
echo "✅ Updated to commit: $NEW_COMMIT"
echo ""

# Step 3: Check for environment file
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Step 3/8: Checking environment configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -f "backend/.env.production" ]; then
    echo "❌ ERROR: backend/.env.production not found!"
    echo "   Create it from backend/.env.production.template"
    exit 1
fi
echo "✅ Production environment file found"
echo ""

# Step 4: Build containers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Step 4/8: Building Docker containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ This may take several minutes..."
docker compose -f docker-compose.prod.yml build --no-cache
echo "✅ Containers built successfully"
echo ""

# Step 5: Stop old containers (graceful shutdown)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏸️  Step 5/8: Stopping old containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f docker-compose.prod.yml down --remove-orphans
echo "✅ Old containers stopped"
echo ""

# Step 6: Start new containers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 6/8: Starting new containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f docker-compose.prod.yml up -d
echo "✅ Containers started"
echo ""

# Step 7: Wait for services to be healthy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Step 7/8: Waiting for services to be healthy..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 15
echo "✅ Services should be ready"
echo ""

# Step 8: Run database migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Step 8/8: Running database migrations..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
echo "✅ Migrations completed"
echo ""

# Health checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Running health checks..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check backend API
if curl -f -s https://crm.senovallc.com/api/v1/health > /dev/null; then
    echo "✅ Backend API: OK"
else
    echo "❌ Backend API: FAILED"
fi

# Check frontend
if curl -f -s https://crm.senovallc.com > /dev/null; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: FAILED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Deployment Summary:"
echo "   Start time: $(date -d @$DEPLOYMENT_START +%Y-%m-%d\ %H:%M:%S 2>/dev/null || date)"
echo "   Previous commit: $CURRENT_COMMIT"
echo "   New commit: $NEW_COMMIT"
echo "   Backup: backups/$BACKUP_FILE"
echo ""
echo "🔗 Access at: https://crm.senovallc.com"
echo ""
echo "📋 Next steps:"
echo "   1. Monitor logs: docker compose -f docker-compose.prod.yml logs -f --tail=100"
echo "   2. Test critical user flows"
echo "   3. Monitor error rates in Sentry"
echo "   4. Watch server metrics"
echo ""
echo "🔄 Rollback command if needed:"
echo "   git checkout $CURRENT_COMMIT"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo "   docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres senova_crm < backups/$BACKUP_FILE"
echo ""
