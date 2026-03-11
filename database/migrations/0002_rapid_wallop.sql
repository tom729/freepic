CREATE TABLE `image_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`image_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `image_tags_image_id_idx` ON `image_tags` (`image_id`);--> statement-breakpoint
CREATE INDEX `image_tags_tag_id_idx` ON `image_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `image_tags_unique_idx` ON `image_tags` (`image_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(50) NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tags_name_idx` ON `tags` (`name`);