#!/bin/bash

###############################################################################
# Senova CRM - Database Restore Script
#
# This script restores the PostgreSQL database from a backup file.
#
# Usage:
#   ./scripts/restore.sh <backup_file>
#   ./scripts/restore.sh s3://<bucket>/backups/eve_crm_backup_20250101_120000.sql.gz
#
# WARNING: This will REPLACE the current database!
###############################################################################

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /var/backups/eve_crm/eve_crm_backup_20250101_120000.sql.gz"
    echo "Example: $0 s3://eve-crm-backups/backups/eve_crm_backup_20250101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Parse DATABASE_URL
DB_URL="${DATABASE_URL}"
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Senova CRM - Database Restore"
echo "=========================================="
echo "Database: ${DB_NAME}"
echo "Backup File: ${BACKUP_FILE}"
echo "=========================================="

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
    echo -e "${YELLOW}Downloading backup from S3...${NC}"
    LOCAL_FILE="/tmp/$(basename $BACKUP_FILE)"

    aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to download from S3${NC}"
        exit 1
    fi

    BACKUP_FILE="$LOCAL_FILE"
    echo -e "${GREEN}✓ Downloaded to ${LOCAL_FILE}${NC}"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Confirmation prompt
echo -e "${RED}⚠️  WARNING: This will REPLACE the current database!${NC}"
echo -e "${YELLOW}Database to be restored: ${DB_NAME}${NC}"
echo -e "${YELLOW}Current data will be LOST!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Create a backup of the current database before restoring
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PRE_RESTORE_BACKUP="/tmp/eve_crm_pre_restore_${TIMESTAMP}.sql.gz"

echo -e "${YELLOW}Creating pre-restore backup...${NC}"
PGPASSWORD="${DB_PASS}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --file="${PRE_RESTORE_BACKUP}"

echo -e "${GREEN}✓ Pre-restore backup saved to: ${PRE_RESTORE_BACKUP}${NC}"

# Terminate existing connections
echo -e "${YELLOW}Terminating existing database connections...${NC}"
PGPASSWORD="${DB_PASS}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo -e "${YELLOW}Dropping and recreating database...${NC}"
PGPASSWORD="${DB_PASS}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "DROP DATABASE IF EXISTS ${DB_NAME};"

PGPASSWORD="${DB_PASS}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
echo -e "${YELLOW}Restoring database from backup...${NC}"
PGPASSWORD="${DB_PASS}" pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
    echo -e "${GREEN}Pre-restore backup saved at: ${PRE_RESTORE_BACKUP}${NC}"
else
    echo -e "${RED}✗ Restore failed!${NC}"
    echo -e "${YELLOW}Restoring from pre-restore backup...${NC}"

    # Attempt to restore from pre-restore backup
    PGPASSWORD="${DB_PASS}" psql \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME};"

    PGPASSWORD="${DB_PASS}" pg_restore \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        "$PRE_RESTORE_BACKUP"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Rollback successful - database restored to pre-restore state${NC}"
    else
        echo -e "${RED}✗ Rollback failed - manual intervention required!${NC}"
    fi

    exit 1
fi

echo "=========================================="
echo -e "${GREEN}Restore completed successfully!${NC}"
echo "=========================================="
