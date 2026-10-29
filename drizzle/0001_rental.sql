ALTER TABLE "products" ADD COLUMN "rental_price_per_day_mnt" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rental_deposit_mnt" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rental_terms" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sanitation_info" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "safety_inspection_info" text DEFAULT '' NOT NULL;