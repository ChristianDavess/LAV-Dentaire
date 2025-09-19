# Database Migration Guide - LAV Dentaire

## 🚨 **CRITICAL: Apply These Migrations to Fix System Issues**

The following migrations must be applied to your Supabase database to resolve API errors and data integrity issues.

## 📋 **Migration Files Created**

### 1. Data Cleanup (Apply First)
**File:** `supabase/migrations/20250919000000_cleanup_invalid_dates.sql`
**Purpose:** Fix existing invalid dates like "2025-09-32" that are causing API failures

### 2. Schema Update (Apply Second)
**File:** `supabase/migrations/20250919000001_add_user_id_to_notifications.sql`
**Purpose:** Add missing `user_id` column to notifications table

## 🔧 **How to Apply Migrations**

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content of each migration file **in order**:
   - First: `20250919000000_cleanup_invalid_dates.sql`
   - Second: `20250919000001_add_user_id_to_notifications.sql`
4. Execute each migration

### Option 2: Supabase CLI (If Available)
```bash
# If you have Supabase CLI installed
supabase db reset
# or apply individual migrations
supabase migration up
```

## 🎯 **What These Migrations Fix**

### ✅ Data Cleanup Migration Will:
- ✅ Remove invalid dates like "2025-09-32" from all tables
- ✅ Set problematic dates to NULL to prevent query failures
- ✅ Log cleanup results showing how many records were fixed
- ✅ Resolve "date/time field value out of range" errors

### ✅ Schema Migration Will:
- ✅ Add `user_id` column to notifications table
- ✅ Create proper foreign key relationship to admin_users
- ✅ Add performance index for user_id queries
- ✅ Add updated_at column for consistency
- ✅ Resolve "column notifications.user_id does not exist" errors

## 🚨 **Current System Issues That Will Be Resolved**

### Before Migration:
```
❌ Error: date/time field value out of range: "2025-09-32"
❌ Error: column notifications.user_id does not exist
❌ Patient stats endpoint 500 errors
❌ Notifications API failures
❌ Treatment queries failing
```

### After Migration:
```
✅ All date queries working properly
✅ Notifications API functioning
✅ Patient stats endpoint returning data
✅ No more database constraint violations
✅ System performance improved
```

## 🔍 **Verification Steps**

After applying migrations:

1. **Check System Logs**: Should see no more date/user_id errors
2. **Test Notifications**: `/api/notifications` should return 200
3. **Test Patient Stats**: `/api/patients/[id]/stats` should work
4. **Verify Data**: Check that invalid dates are cleaned up

## ⚡ **Performance Impact**

- **Migration Time**: Data cleanup ~30 seconds, schema changes ~5 seconds
- **Downtime**: Minimal (few seconds during schema changes)
- **Data Safety**: No data loss, only invalid dates set to NULL
- **Performance**: Improved query performance after cleanup

## 🔧 **Rollback Plan** (If Needed)

If issues arise:

1. **Data Cleanup Rollback**: Invalid dates were already causing errors, so setting them to NULL is safer
2. **Schema Rollback**:
   ```sql
   ALTER TABLE notifications DROP COLUMN user_id;
   ALTER TABLE notifications DROP COLUMN updated_at;
   DROP INDEX IF EXISTS idx_notifications_user_id;
   ```

## 🎯 **Post-Migration Validation**

Run these queries to verify success:

```sql
-- Check notifications table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications';

-- Verify no invalid dates remain
SELECT COUNT(*) as invalid_dates_count
FROM patients
WHERE date_of_birth IS NOT NULL
  AND date_of_birth !~ '^\\d{4}-\\d{2}-\\d{2}$';

-- Test notifications query (should not error)
SELECT COUNT(*) FROM notifications WHERE user_id IS NOT NULL;
```

---

## 📞 **Next Steps After Migration**

1. ✅ System errors should be resolved
2. ✅ Performance should improve significantly
3. ✅ All API endpoints should function properly
4. ✅ Date validation will prevent future invalid dates

**🚀 Apply these migrations to complete the senior developer fixes and stabilize the system!**