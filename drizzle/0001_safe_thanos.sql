ALTER TABLE `sightings` ADD `moderation_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sightings` ADD `submission_key` text;--> statement-breakpoint
ALTER TABLE `sightings` ADD `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `sightings` ADD `reviewed_by` text;