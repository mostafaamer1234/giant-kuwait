CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`changes_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cart_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_fils` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`coupon_code` text,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `content_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title_en` text NOT NULL,
	`title_ar` text NOT NULL,
	`blocks_json` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_slug` ON `content_pages` (`slug`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`external_user_id` text,
	`email` text NOT NULL,
	`name` text,
	`mobile` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_email` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`variant_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`reference` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_fils` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`customer_id` text,
	`email` text NOT NULL,
	`mobile` text NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`fulfillment_status` text NOT NULL,
	`subtotal_fils` integer NOT NULL,
	`delivery_fils` integer NOT NULL,
	`discount_fils` integer DEFAULT 0 NOT NULL,
	`total_fils` integer NOT NULL,
	`address_json` text NOT NULL,
	`locale` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_number` ON `orders` (`number`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_payment_id` text,
	`status` text NOT NULL,
	`amount_fils` integer NOT NULL,
	`idempotency_key` text NOT NULL,
	`payload_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payments_idempotency` ON `payments` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`description_en` text NOT NULL,
	`description_ar` text NOT NULL,
	`category_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`value` integer NOT NULL,
	`minimum_fils` integer,
	`starts_at` integer,
	`ends_at` integer,
	`usage_limit` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`color` text NOT NULL,
	`size` text NOT NULL,
	`price_fils` integer NOT NULL,
	`compare_at_fils` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_variants_sku` ON `variants` (`sku`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`event_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webhook_event` ON `webhook_events` (`provider`,`event_id`);