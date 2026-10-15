CREATE TABLE `community_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sighting_id` integer NOT NULL,
	`version` text NOT NULL,
	`browser_hash` text NOT NULL,
	`network_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sighting_id`) REFERENCES `sightings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `sightings` ADD `community_visible` integer DEFAULT 0 NOT NULL;