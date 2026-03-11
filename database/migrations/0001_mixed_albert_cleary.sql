CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`image_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorites_user_id_idx` ON `favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorites_image_id_idx` ON `favorites` (`image_id`);--> statement-breakpoint
CREATE INDEX `favorites_unique_idx` ON `favorites` (`user_id`,`image_id`);