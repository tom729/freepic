CREATE TABLE `downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`image_id` text NOT NULL,
	`user_id` text NOT NULL,
	`size` text,
	`created_at` integer,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `downloads_image_id_idx` ON `downloads` (`image_id`);--> statement-breakpoint
CREATE INDEX `downloads_user_id_idx` ON `downloads` (`user_id`);--> statement-breakpoint
CREATE INDEX `downloads_created_at_idx` ON `downloads` (`created_at`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cos_key` text NOT NULL,
	`exif_data` text,
	`status` text DEFAULT 'pending',
	`width` integer,
	`height` integer,
	`file_size` integer,
	`likes` integer DEFAULT 0,
	`downloads` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `images_user_id_idx` ON `images` (`user_id`);--> statement-breakpoint
CREATE INDEX `images_status_idx` ON `images` (`status`);--> statement-breakpoint
CREATE INDEX `images_created_at_idx` ON `images` (`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text(20) NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone`);