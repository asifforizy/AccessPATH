-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "AccessibilityStatus" AS ENUM ('YES', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('NEW_LOCATION', 'LOCATION_UPDATE', 'ACCESSIBILITY_UPDATE', 'BARRIER_REPORT', 'PHOTO_SUBMISSION');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('BROKEN_FOOTPATH', 'MISSING_RAMP', 'BLOCKED_SIDEWALK', 'BROKEN_ELEVATOR', 'UNSAFE_CROSSING', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('APPROVED', 'REJECTED', 'REQUESTED_CHANGES', 'VERIFIED', 'FLAGGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('LOCATION_IMAGE', 'BARRIER_IMAGE', 'PROFILE_IMAGE', 'EVIDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'CHANGES_REQUESTED', 'REPORT_VERIFIED', 'REPORT_RESOLVED', 'NEW_FEEDBACK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('GENERAL', 'ACCESSIBILITY', 'INFORMATION_CORRECTION', 'EXPERIENCE');

-- CreateEnum
CREATE TYPE "RoutePreference" AS ENUM ('SHORTEST', 'MOST_ACCESSIBLE', 'BALANCED');

-- CreateEnum
CREATE TYPE "RouteFeedbackRating" AS ENUM ('VERY_POOR', 'POOR', 'AVERAGE', 'GOOD', 'EXCELLENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
