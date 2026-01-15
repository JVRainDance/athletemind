# Database Management Rules

## Database Reset Guidelines
- **NEVER reset the entire local database unless absolutely necessary**
- Only use `npx supabase db reset` when:
  - Schema changes are incompatible with existing data
  - Migration files have fundamental structural changes
  - Database is in an unrecoverable state
  - Starting fresh development environment

## Preferred Migration Approach
- **ALWAYS use incremental migrations** (`npx supabase db push`) when possible
- Create new migration files for schema changes rather than resetting
- Test migrations on a copy of production data when available
- Use `ALTER TABLE` statements to modify existing tables
- Use `UPDATE` statements to migrate existing data

## When to Use Each Command

### Use `npx supabase db push` for:
- Adding new columns to existing tables
- Adding new tables
- Adding new indexes
- Adding new RLS policies
- Data migrations (UPDATE statements)
- Non-breaking schema changes

### Use `npx supabase db reset` only for:
- Breaking schema changes that can't be migrated
- Corrupted database state
- Starting completely fresh development
- When migration files have fundamental errors

## Migration Best Practices
- Always backup data before major schema changes
- Test migrations on development data first
- Use transactions for complex migrations
- Provide rollback scripts when possible
- Document breaking changes clearly

## Data Preservation
- Preserve existing user data whenever possible
- Use data migration scripts for field changes
- Test data migration with sample data
- Verify data integrity after migrations

## Development Workflow
1. Create new migration file for changes
2. Test migration with `npx supabase db push`
3. Verify application still works
4. Only reset if migration fails and can't be fixed
5. Document any resets and reasons

## Error Recovery
- If migration fails, try to fix the migration file first
- Use `npx supabase db reset` as last resort
- Always explain why reset was necessary
- Consider data backup before reset if important data exists
