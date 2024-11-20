CREATE TABLE "Note" (
    "id" SERIAL PRIMARY KEY,
    "noteId" uuid DEFAULT gen_random_uuid() UNIQUE,
    "userId" VARCHAR(300) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "sourceUrl" TEXT NULL, 
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    -- A JSON-serialized ProseMirror document
    "docContent" JSONB NULL,
    -- Marked for deletion (should be removed from local client storage)
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX "NoteUser" ON "Note" USING HASH ("userId");
-- By a SavedItem (URL)
CREATE INDEX "NoteUrl" ON "Note" USING HASH ("sourceUrl");
-- Pagination and syncing
CREATE INDEX "NoteUpdated" ON "Note" ("updatedAt");
-- Index for delete jobs (very small proportion of data)
CREATE INDEX "NoteDeleted" ON "Note"((TRUE)) WHERE "deleted";

-- Web Clipping
CREATE TABLE "Clipping" (
    "id" SERIAL PRIMARY KEY,
    "clippingId" uuid DEFAULT gen_random_uuid() UNIQUE,
    "userId" VARCHAR(300) NOT NULL,
    -- Obligatory 1:1 relationship between Clipping and Note
    -- If Note is deleted, delete this Clipping
    "noteId" uuid UNIQUE NOT NULL REFERENCES "Note"("noteId") ON DELETE CASCADE,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    -- Anchors for reattachment and selection
    -- See https://github.com/hypothesis/client/tree/main/src/annotator/anchoring
    "anchors" JSONB NULL,
    -- The Clipped HTML (sub)tree
    "html" TEXT NOT NULL,
    -- Marked for deletion (should be removed from local client storage)
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX "ClippingUser" ON "Clipping" USING HASH ("userId");
-- By a SavedItem (URL)
CREATE INDEX "ClippingUrl" ON "Clipping" USING HASH ("sourceUrl");
-- Pagination and syncing
CREATE INDEX "ClippingCreated" ON "Clipping" ("createdAt");
-- Index for delete jobs (very small proportion of data)
CREATE INDEX "ClippingDeleted" ON "Clipping"((TRUE)) WHERE "deleted";
