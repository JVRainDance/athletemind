# Supabase Migration Safety Rules for Cursor

## ⚠️ CRITICAL RULES - READ BEFORE ANY DATABASE CHANGES

### 🚫 NEVER DO THESE:
- **Never let Cursor auto-generate or apply schema changes directly to production**
- **Never use `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` on tables with data**
- **Never run bulk operations without batching and testing first**
- **Never make schema changes without a backup**
- **Never skip the staging environment for major changes**

---

## 🛡️ PRE-MIGRATION CHECKLIST

### Before Making ANY Schema Changes:

1. **Create a backup**:
   ```bash
   # In Supabase Dashboard: Settings → Database → Backups
   # Or create manual backup
   pg_dump "your-connection-string" > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on staging first**:
   - Use a separate Supabase project for staging
   - Test the entire migration flow
   - Verify data integrity after migration

3. **Plan the migration in steps**:
   - Write out each step before starting
   - Plan rollback procedures
   - Document expected downtime

---

## ✅ SAFE MIGRATION WORKFLOW

### Step 1: Use Proper Supabase Migrations
```bash
# Initialize migrations if not already done
supabase init

# Create a new migration file
supabase migration new add_user_stats_table

# Edit the generated .sql file with your changes
# Apply to local development
supabase db reset

# Push to remote when ready
supabase db push
```

### Step 2: Follow the Additive Pattern
```sql
-- ✅ GOOD: Add new table
CREATE TABLE user_workout_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stat_date DATE NOT NULL,
  total_workouts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ✅ GOOD: Add new columns
ALTER TABLE workouts ADD COLUMN difficulty_level INT;

-- ❌ BAD: Dropping existing data
-- DROP TABLE old_workouts;
-- ALTER TABLE workouts DROP COLUMN important_data;
```

### Step 3: Backfill Data Safely
```sql
-- ✅ GOOD: Batch processing
DO $$
DECLARE
  batch_size INT := 1000;
  offset_val INT := 0;
  rows_processed INT;
BEGIN
  LOOP
    WITH batch AS (
      SELECT user_id, COUNT(*) as workout_count
      FROM workouts 
      GROUP BY user_id
      LIMIT batch_size OFFSET offset_val
    )
    INSERT INTO user_workout_stats (user_id, stat_date, total_workouts)
    SELECT user_id, CURRENT_DATE, workout_count FROM batch;
    
    GET DIAGNOSTICS rows_processed = ROW_COUNT;
    EXIT WHEN rows_processed = 0;
    
    offset_val := offset_val + batch_size;
    -- Add delay to avoid overwhelming database
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

---

## 🔧 CURSOR-SPECIFIC SAFETY SETTINGS

### Configure Cursor to Be Safe:

1. **Disable auto-schema changes**:
   - Go to Cursor Settings
   - Search for "database" or "schema"
   - Disable any auto-migration features

2. **Use manual confirmation**:
   - Always review generated SQL before running
   - Copy SQL to a separate file first
   - Run through proper migration workflow

3. **Set up environment variables**:
   ```env
   # .env.local
   DATABASE_URL=your_local_supabase_url
   
   # .env.production  
   DATABASE_URL=your_production_url
   
   # Never let Cursor connect directly to production
   ```

---

## 📋 MIGRATION EXECUTION CHECKLIST

### Before Running Migration:
- [ ] Backup created and verified
- [ ] Migration tested on staging
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window
- [ ] All affected API endpoints identified

### During Migration:
- [ ] Monitor database performance
- [ ] Check for lock timeouts
- [ ] Verify each step completes successfully
- [ ] Test critical application functions

### After Migration:
- [ ] Verify data integrity
- [ ] Check application performance
- [ ] Monitor error logs
- [ ] Update documentation
- [ ] Clean up old migration files if needed

---

## 🚨 EMERGENCY PROCEDURES

### If Migration Fails:
1. **Don't panic** - assess the situation
2. **Check Supabase logs** in dashboard
3. **Rollback immediately** if data is at risk:
   ```sql
   -- Use point-in-time recovery if available
   -- Or restore from backup
   ```
4. **Document what went wrong**
5. **Fix issues in staging before retrying**

### If Data is Lost:
1. **Immediately check Supabase backups**:
   - Dashboard → Settings → Database → Backups
   - Look for point-in-time recovery options
2. **Contact Supabase support** if on paid plan
3. **Restore from most recent backup**
4. **Assess data loss and communicate with stakeholders**

---

## 📚 BEST PRACTICES SUMMARY

### Development Workflow:
1. **Local development** → Test migration
2. **Staging environment** → Verify full flow  
3. **Production** → Execute with confidence

### Code Reviews:
- Always have someone review migration SQL
- Document the purpose and expected impact
- Include rollback procedures in PR description

### Monitoring:
- Set up alerts for database performance
- Monitor error rates after migrations
- Keep migration logs for troubleshooting

### Documentation:
- Document all schema changes
- Update API documentation
- Record migration timelines and issues

---

## 🔗 USEFUL COMMANDS

```bash
# Supabase CLI commands
supabase --help
supabase migration list
supabase migration repair
supabase db diff
supabase db reset

# Database backup
pg_dump "postgresql://user:pass@host:port/db" > backup.sql

# Restore backup  
psql "postgresql://user:pass@host:port/db" < backup.sql
```

---

## 📞 EMERGENCY CONTACTS

- **Supabase Support**: [support.supabase.com](https://support.supabase.com)
- **Supabase Status**: [status.supabase.com](https://status.supabase.com)
- **Team Lead**: [Add your team lead contact]
- **Database Admin**: [Add DBA contact if applicable]

---

> **Remember**: A few minutes of planning can save hours of recovery time. When in doubt, ask for a second opinion before running any major database changes.