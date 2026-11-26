-- Door accessibility (required accessibility attribute)
ALTER TABLE "AccessibilityProfile" ADD COLUMN "doorAccessibility" BOOLEAN NOT NULL DEFAULT false;

-- Barrier taxonomy for accessibility reports
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'BROKEN_FOOTPATH';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'MISSING_RAMP';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'BLOCKED_SIDEWALK';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'BROKEN_ELEVATOR';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'UNSAFE_CROSSING';

-- Report GPS coordinates (barrier position, independent of the location pin)
ALTER TABLE "AccessibilityReport" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "AccessibilityReport" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Search + geo indexes for large datasets
CREATE INDEX "Location_name_idx" ON "Location"("name");
CREATE INDEX "Location_address_idx" ON "Location"("address");
CREATE INDEX "AccessibilityReport_latitude_longitude_idx" ON "AccessibilityReport"("latitude", "longitude");
CREATE INDEX "AccessibilityReport_type_status_idx" ON "AccessibilityReport"("type", "status");

-- Trigram indexes keep substring search fast at 10k+ locations
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Location_name_trgm_idx" ON "Location" USING gin ("name" gin_trgm_ops);
CREATE INDEX "Location_address_trgm_idx" ON "Location" USING gin ("address" gin_trgm_ops);
CREATE INDEX "Location_city_trgm_idx" ON "Location" USING gin ("city" gin_trgm_ops);
