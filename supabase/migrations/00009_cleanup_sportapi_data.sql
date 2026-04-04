-- Clean up old SportAPI7 data after migration to football-data.org

-- Delete all club records (old SportAPI7 IDs are no longer valid)
DELETE FROM team_mappings WHERE is_club = true;

-- Reset API links on subject records (old SportAPI7 IDs)
UPDATE team_mappings SET
  api_team_id = NULL,
  logo_url = NULL,
  is_followed = false,
  cached_fixtures = NULL,
  fixtures_updated_at = NULL;

-- Clear logo cache (was storing base64 from SportAPI7, no longer needed)
TRUNCATE logo_cache;
