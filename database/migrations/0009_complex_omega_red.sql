CREATE TABLE "image_view_aggregates" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"total_views" integer DEFAULT 0,
	"unique_views" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "image_view_aggregates_unique_idx" UNIQUE("image_id","date")
);
--> statement-breakpoint
CREATE TABLE "image_views" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"ip_hash" text,
	"user_agent" text,
	"referrer" text,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_view_aggregates" ADD CONSTRAINT "image_view_aggregates_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_views" ADD CONSTRAINT "image_views_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_views" ADD CONSTRAINT "image_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_view_aggregates_image_id_idx" ON "image_view_aggregates" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_view_aggregates_date_idx" ON "image_view_aggregates" USING btree ("date");--> statement-breakpoint
CREATE INDEX "image_views_image_id_idx" ON "image_views" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_views_user_id_idx" ON "image_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "image_views_session_id_idx" ON "image_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "image_views_viewed_at_idx" ON "image_views" USING btree ("viewed_at");