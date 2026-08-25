# Goonverse — Backup & Disaster Recovery Runbook

## 1. Database Backups
- **Continuous WAL Archiving**: PostgreSQL Point-In-Time-Recovery (PITR) with a minimum 7-day retention window.
- **Daily Automated Snapshots**: Full `pg_dump` backup encrypted with GPG and stored in an isolated cold-storage S3 bucket.

### Manual Database Snapshot
```bash
pg_dump -Fc -h db-host -U goonverse_user goonverse > goonverse_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Database Restore Procedure
```bash
pg_restore -h db-host -U goonverse_user -d goonverse --clean goonverse_backup.dump
```

## 2. Media Object Backup
- Backblaze B2 Object Lock & Bucket Replication enabled to a secondary region (e.g. `us-east`).
- Versioning enabled on the B2 bucket to protect against accidental deletion or ransomware attacks.

## 3. Incident Escalation Matrix
1. **P1 (Data Breach / Storage Exposure)**: Revoke B2 Application Keys immediately via Backblaze B2 Console, trigger full backend session revocation (`DELETE FROM refresh_tokens;`), rotate JWT secrets.
2. **P2 (Database Outage)**: Promote read-replica or initiate PITR restoration to latest checkpoint.
3. **P3 (API Degradation)**: Scale NestJS instances and verify Redis/DB connection pool metrics.
