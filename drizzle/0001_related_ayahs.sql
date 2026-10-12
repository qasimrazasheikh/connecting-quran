CREATE TABLE "related_ayahs" (
	"id" serial PRIMARY KEY NOT NULL,
	"surah" smallint NOT NULL,
	"ayah" smallint NOT NULL,
	"rel_surah" smallint NOT NULL,
	"rel_ayah" smallint NOT NULL,
	"words" smallint NOT NULL,
	"coverage" smallint NOT NULL,
	"score" smallint NOT NULL,
	"match_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source" text DEFAULT 'qul-matching' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "related_ayah_idx" ON "related_ayahs" USING btree ("surah","ayah");--> statement-breakpoint
CREATE UNIQUE INDEX "related_pair_uq" ON "related_ayahs" USING btree ("source","surah","ayah","rel_surah","rel_ayah");