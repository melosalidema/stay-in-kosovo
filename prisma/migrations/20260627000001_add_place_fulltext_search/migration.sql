-- Add a generated tsvector column for full-text search across place title, description, and address.
ALTER TABLE "Place"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("address", ''))
  ) STORED;

-- GIN index for fast full-text matching.
CREATE INDEX "Place_searchVector_idx" ON "Place" USING GIN ("searchVector");