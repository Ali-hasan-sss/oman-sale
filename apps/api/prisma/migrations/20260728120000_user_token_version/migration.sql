-- Single-device session: invalidate previous access tokens when a new login occurs.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
