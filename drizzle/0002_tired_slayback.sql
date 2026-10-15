CREATE TABLE `archive_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`sport` text NOT NULL,
	`date` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `songs_slug_unique` ON `songs` (`slug`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sighting_id` integer NOT NULL,
	`url` text NOT NULL,
	`label` text NOT NULL,
	`kind` text NOT NULL,
	FOREIGN KEY (`sighting_id`) REFERENCES `sightings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `sightings` ADD `song_id` text REFERENCES songs(id);--> statement-breakpoint
ALTER TABLE `sightings` ADD `event_id` text REFERENCES events(id);--> statement-breakpoint
ALTER TABLE `sightings` ADD `evidence` text DEFAULT 'fan' NOT NULL;--> statement-breakpoint
ALTER TABLE `sightings` ADD `cue_type` text DEFAULT 'Commercial outro' NOT NULL;--> statement-breakpoint
ALTER TABLE `sightings` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `sightings` ADD `external_key` text;--> statement-breakpoint
ALTER TABLE `sightings` ADD `version` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `sightings_external_key_unique` ON `sightings` (`external_key`);--> statement-breakpoint
CREATE INDEX `sightings_status_date` ON `sightings` (`moderation_status`,`date`);--> statement-breakpoint
CREATE INDEX `sightings_song` ON `sightings` (`song_id`);--> statement-breakpoint
CREATE INDEX `sightings_event` ON `sightings` (`event_id`);