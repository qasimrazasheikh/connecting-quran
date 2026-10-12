CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"surah" smallint NOT NULL,
	"ayah_from" smallint,
	"ayah_to" smallint,
	"kind" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"start_sec" integer,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"origin" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"lang" text NOT NULL,
	"school" text DEFAULT 'general' NOT NULL,
	"delivery" text DEFAULT 'api' NOT NULL,
	"url_pattern" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"licence" text DEFAULT '' NOT NULL,
	"attribution" text DEFAULT '' NOT NULL,
	"homepage" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sort" integer DEFAULT 100 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_ayah_idx" ON "entries" USING btree ("surah","ayah_from","ayah_to");--> statement-breakpoint
CREATE INDEX "entries_source_idx" ON "entries" USING btree ("source_id");