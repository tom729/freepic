-- Image views table for analytics tracking with privacy protection
CREATE TABLE IF NOT EXISTS "image_views" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"ip_hash" text,
	"user_agent" text,
	"referrer" text,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Image view aggregates for fast analytics queries
CREATE TABLE IF NOT EXISTS "image_view_aggregates" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"unique_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);

-- Indexes for image_views
CREATE INDEX IF NOT EXISTS "image_views_image_id_idx" ON "image_views" ("image_id");
CREATE INDEX IF NOT EXISTS "image_views_user_id_idx" ON "image_views" ("user_id");
CREATE INDEX IF NOT EXISTS "image_views_viewed_at_idx" ON "image_views" ("viewed_at");
CREATE INDEX IF NOT EXISTS "image_views_session_id_idx" ON "image_views" ("session_id");
CREATE INDEX IF NOT EXISTS "image_views_image_user_idx" ON "image_views" ("image_id", "user_id");
CREATE INDEX IF NOT EXISTS "image_views_image_session_idx" ON "image_views" ("image_id", "session_id");

-- Indexes for image_view_aggregates
CREATE INDEX IF NOT EXISTS "image_view_aggregates_image_id_idx" ON "image_view_aggregates" ("image_id");
CREATE INDEX IF NOT EXISTS "image_view_aggregates_date_idx" ON "image_view_aggregates" ("date");

-- Foreign key constraints
ALTER TABLE "image_views" ADD CONSTRAINT "image_views_image_id_images_id_fk" 
  FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE cascade;
  
ALTER TABLE "image_views" ADD CONSTRAINT "image_views_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;
  
ALTER TABLE "image_view_aggregates" ADD CONSTRAINT "image_view_aggregates_image_id_images_id_fk" 
  FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE cascade;

-- Unique constraint for idempotent aggregation
ALTER TABLE "image_view_aggregates" ADD CONSTRAINT "image_view_aggregates_image_date_unique" 
  UNIQUE ("image_id", "date");
