-- Rückweg zu 012_date.sql (Issue #19): entfernt Cruizy Date vollständig.
-- Medien der Date-Galerie und Voice-Intros vorher mit „Date verlassen“ bzw. dem Aufräumskript löschen.
ALTER TABLE messages DROP COLUMN IF EXISTS nsfw_decision;
ALTER TABLE messages DROP COLUMN IF EXISTS nsfw;
DROP TABLE IF EXISTS nsfw_consent;
DROP TABLE IF EXISTS date_daily_suggestions;
DROP TABLE IF EXISTS date_matches;
DROP TABLE IF EXISTS date_passes;
DROP TABLE IF EXISTS date_likes;
DROP TABLE IF EXISTS date_preferences;
DROP TABLE IF EXISTS date_audio;
DROP TABLE IF EXISTS date_prompts;
DROP TABLE IF EXISTS date_photos;
DROP TABLE IF EXISTS date_profiles;
DROP TABLE IF EXISTS date_waitlist;
ALTER TABLE profiles DROP COLUMN IF EXISTS date_hidden;
DROP TABLE IF EXISTS date_access;
