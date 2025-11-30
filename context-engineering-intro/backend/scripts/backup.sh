#!/bin/bash

###############################################################################
# Senova CRM - Database Backup Script
#
# This script creates automated backups of the PostgreSQL database
# and uploads them to AWS S3 for disaster recovery.
#
# Usage:
#   ./scripts/backup.sh
#
# Cron Schedule (daily at 2 AM):
#   0 2 * * * /path/to/backend/scripts/backup.sh >> /var/log/crm-backup.log 2>&1
###############################################################################

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/eve_crm}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
S3_BUCKET="${AWS_S3_BACKUP_BUCKET:-eve-crm-backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="eve_crm_backup_${TIMESTAMP}.sql.gz"

# Parse DATABASE_URL
# Format: postgresql+asyncpg://user:password@host:port/database
DB_URL="${DATABASE_URL}"
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Senova CRM - Database Backup"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Database: ${DB_NAME}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "=========================================="

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform database backup
echo -e "${YELLOW}Creating database backup...${NC}"
PGPASSWORD="${DB_PASS}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_DIR}/${BACKUP_NAME}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully: ${BACKUP_NAME} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Upload to S3 (if AWS credentials are configured)
if [ ! -z "${AWS_ACCESS_KEY_ID}" ] && [ ! -z "${S3_BUCKET}" ]; then
    echo -e "${YELLOW}Uploading backup to S3...${NC}"

    aws s3 cp \
        "${BACKUP_DIR}/${BACKUP_NAME}" \
        "s3://${S3_BUCKET}/backups/${BACKUP_NAME}" \
        --storage-class STANDARD_IA

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup uploaded to S3${NC}"
    else
        echo -e "${RED}✗ S3 upload failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping S3 upload (AWS not configured)${NC}"
fi

# Remove old backups
echo -e "${YELLOW}Cleaning up old backups (older than ${RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "eve_crm_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

OLD_BACKUPS_REMOVED=$(find "${BACKUP_DIR}" -name "eve_crm_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} | wc -l)
echo -e "${GREEN}✓ Removed ${OLD_BACKUPS_REMOVED} old backup(s)${NC}"

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "eve_crm_backup_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}Current backups: ${BACKUP_COUNT}${NC}"

echo "=========================================="
echo -e "${GREEN}Backup completed successfully!${NC}"
echo "=========================================="

# Optional: Send notification (e.g., to Slack, email, etc.)
# Uncomment and configure as needed:
# if [ ! -z "${SLACK_WEBHOOK_URL}" ]; then
#     curl -X POST -H 'Content-type: application/json' \
#         --data "{\"text\":\"✅ CRM Database Backup Completed: ${BACKUP_NAME}\"}" \
#         "${SLACK_WEBHOOK_URL}"
# fi
