CREATE UNIQUE INDEX `votes_browser` ON `community_votes` (`sighting_id`,`version`,`browser_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `votes_network` ON `community_votes` (`sighting_id`,`version`,`network_hash`);--> statement-breakpoint
CREATE INDEX `votes_rate` ON `community_votes` (`network_hash`,`created_at`);