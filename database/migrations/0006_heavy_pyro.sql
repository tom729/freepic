CREATE TABLE "activation_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activation_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "collection_images" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"image_id" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0,
	CONSTRAINT "collection_images_unique_idx" UNIQUE("collection_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image_id" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"image_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"user_id" text NOT NULL,
	"size" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_collection_images" (
	"id" text PRIMARY KEY NOT NULL,
	"featured_collection_id" text NOT NULL,
	"image_id" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "featured_collection_images_unique_idx" UNIQUE("featured_collection_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "featured_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image_id" text,
	"curator_id" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"image_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "image_embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"embedding" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "image_tags_unique_idx" UNIQUE("image_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "image_view_aggregates" (
	"id" text PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"unique_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "image_view_aggregates_image_date_unique" UNIQUE("image_id","date")
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
CREATE TABLE "images" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cos_key" text NOT NULL,
	"exif_data" jsonb,
	"description" text,
	"location" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"width" integer,
	"height" integer,
	"file_size" integer,
	"file_hash" text,
	"likes" integer DEFAULT 0,
	"downloads" integer DEFAULT 0,
	"blur_hash" text,
	"dominant_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"image_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"name" text,
	"avatar" text,
	"bio" text,
	"location" text,
	"website" text,
	"instagram" text,
	"twitter" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activation_tokens" ADD CONSTRAINT "activation_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_images" ADD CONSTRAINT "collection_images_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_images" ADD CONSTRAINT "collection_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_cover_image_id_images_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collection_images" ADD CONSTRAINT "featured_collection_images_featured_collection_id_featured_collections_id_fk" FOREIGN KEY ("featured_collection_id") REFERENCES "public"."featured_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collection_images" ADD CONSTRAINT "featured_collection_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collections" ADD CONSTRAINT "featured_collections_cover_image_id_images_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collections" ADD CONSTRAINT "featured_collections_curator_id_users_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_embeddings" ADD CONSTRAINT "image_embeddings_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_tags" ADD CONSTRAINT "image_tags_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_tags" ADD CONSTRAINT "image_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_view_aggregates" ADD CONSTRAINT "image_view_aggregates_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_views" ADD CONSTRAINT "image_views_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_views" ADD CONSTRAINT "image_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activation_tokens_user_id_idx" ON "activation_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activation_tokens_token_idx" ON "activation_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "collection_images_collection_id_idx" ON "collection_images" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_images_image_id_idx" ON "collection_images" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collections_is_public_idx" ON "collections" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "collections_created_at_idx" ON "collections" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "downloads_image_id_idx" ON "downloads" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "downloads_user_id_idx" ON "downloads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "downloads_created_at_idx" ON "downloads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "featured_collection_images_collection_id_idx" ON "featured_collection_images" USING btree ("featured_collection_id");--> statement-breakpoint
CREATE INDEX "featured_collection_images_image_id_idx" ON "featured_collection_images" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "featured_collections_is_active_idx" ON "featured_collections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "featured_collections_display_order_idx" ON "featured_collections" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "featured_collections_start_date_idx" ON "featured_collections" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "featured_collections_end_date_idx" ON "featured_collections" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "featured_collections_curator_id_idx" ON "featured_collections" USING btree ("curator_id");--> statement-breakpoint
CREATE INDEX "featured_collections_cover_image_id_idx" ON "featured_collections" USING btree ("cover_image_id");--> statement-breakpoint
CREATE INDEX "embeddings_image_id_idx" ON "image_embeddings" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_tags_image_id_idx" ON "image_tags" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_tags_tag_id_idx" ON "image_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "image_view_aggregates_image_id_idx" ON "image_view_aggregates" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_view_aggregates_date_idx" ON "image_view_aggregates" USING btree ("date");--> statement-breakpoint
CREATE INDEX "image_views_image_id_idx" ON "image_views" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_views_user_id_idx" ON "image_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "image_views_viewed_at_idx" ON "image_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "image_views_session_id_idx" ON "image_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "image_views_image_user_idx" ON "image_views" USING btree ("image_id","user_id");--> statement-breakpoint
CREATE INDEX "image_views_image_session_idx" ON "image_views" USING btree ("image_id","session_id");--> statement-breakpoint
CREATE INDEX "images_user_id_idx" ON "images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "images_status_idx" ON "images" USING btree ("status");--> statement-breakpoint
CREATE INDEX "images_created_at_idx" ON "images" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "images_file_hash_idx" ON "images" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");