CREATE TABLE `sightings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`song` text NOT NULL,
	`artist` text NOT NULL,
	`game` text NOT NULL,
	`sport` text NOT NULL,
	`network` text NOT NULL,
	`date` text NOT NULL,
	`source` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
