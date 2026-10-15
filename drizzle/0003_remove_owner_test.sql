-- Remove the exact disposable submission identified and requested by the owner.
DELETE FROM sources WHERE sighting_id IN (SELECT id FROM sightings WHERE id=20 AND external_key='submission:b5befec3-f13e-4ca3-80f3-6d29b4245a0f' AND song='Test');
--> statement-breakpoint
DELETE FROM sightings WHERE id=20 AND external_key='submission:b5befec3-f13e-4ca3-80f3-6d29b4245a0f' AND song='Test';
--> statement-breakpoint
DELETE FROM songs WHERE id='11304fe3a713d4f64ed17d5e' AND title='Test' AND NOT EXISTS (SELECT 1 FROM sightings WHERE song_id=songs.id);
--> statement-breakpoint
DELETE FROM events WHERE id='8662e146e984e2de2078e1f3' AND name='Test' AND NOT EXISTS (SELECT 1 FROM sightings WHERE event_id=events.id);
