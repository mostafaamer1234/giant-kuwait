CREATE TABLE `fit_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`encrypted_measurements` text NOT NULL,
	`unit` text NOT NULL,
	`consent_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_fit_profile_customer` ON `fit_profiles` (`customer_id`);--> statement-breakpoint
CREATE TABLE `product_sizing` (
	`product_id` text PRIMARY KEY NOT NULL,
	`size_guide_id` text NOT NULL,
	`fit_profile` text NOT NULL,
	`stretch_level` text NOT NULL,
	`height_rule` text NOT NULL,
	`overrides_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `size_guide_bands` (
	`id` text PRIMARY KEY NOT NULL,
	`size_guide_id` text NOT NULL,
	`size_guide_version` text NOT NULL,
	`size_label` text NOT NULL,
	`position` integer NOT NULL,
	`ranges_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `size_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`guide_id` text NOT NULL,
	`version` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`basis` text NOT NULL,
	`fit` text NOT NULL,
	`stretch` text NOT NULL,
	`height_rule` text NOT NULL,
	`measurements_json` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`placeholder` integer DEFAULT true NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_size_guide_version` ON `size_guides` (`guide_id`,`version`);--> statement-breakpoint
CREATE TABLE `sizing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size_guide_id` text NOT NULL,
	`size_guide_version` text NOT NULL,
	`confidence` text NOT NULL,
	`recommended_size` text,
	`applied_size` text,
	`converted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
