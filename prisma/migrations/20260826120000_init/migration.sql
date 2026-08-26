-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SalesStatus" AS ENUM ('PROSPECT', 'RESEARCHING', 'READY_TO_CONTACT', 'EMAIL_SENT', 'FOLLOW_UP', 'REPLIED', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('IDLE', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GenerationJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GenerationStepKey" AS ENUM ('QUEUED', 'SOURCE_CHECK', 'PAGE_COLLECTION', 'FACT_EXTRACTION', 'IMAGE_DOWNLOAD', 'BRAND_ANALYSIS', 'DESIGN_PLANNING', 'CONTENT_GENERATION', 'SITE_CREATION', 'QUALITY_CHECK', 'READY');

-- CreateEnum
CREATE TYPE "GenerationStepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'GOOGLE_MAPS', 'MARKETPLACE', 'OTHER');

-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LOGO', 'FAVICON', 'HERO', 'PRODUCT', 'PROCESS', 'LOCATION', 'TEAM', 'GALLERY', 'OTHER');

-- CreateEnum
CREATE TYPE "SiteVisibility" AS ENUM ('UNLISTED', 'PRIVATE_DRAFT', 'PUBLIC');

-- CreateEnum
CREATE TYPE "SiteVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailDraftStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateEnum
CREATE TYPE "GenerationProvider" AS ENUM ('OPENAI', 'MOCK');

-- CreateEnum
CREATE TYPE "SalesActivityType" AS ENUM ('STATUS_CHANGE', 'NOTE', 'EMAIL_CREATED', 'EMAIL_SENT', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED', 'GENERATION_STARTED', 'GENERATION_COMPLETED', 'GENERATION_FAILED', 'VERSION_PUBLISHED', 'VERSION_RESTORED', 'COMPANY_CREATED', 'COMPANY_UPDATED', 'COMPANY_ARCHIVED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "slug" TEXT NOT NULL,
    "salesStatus" "SalesStatus" NOT NULL DEFAULT 'PROSPECT',
    "generationStatus" "GenerationStatus" NOT NULL DEFAULT 'IDLE',
    "dealValueMinor" INTEGER NOT NULL DEFAULT 12000,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'sr-Latn',
    "preferredCta" TEXT,
    "designNotes" TEXT,
    "contentNotes" TEXT,
    "businessFacts" JSONB,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'WEBSITE',
    "crawlStatus" "CrawlStatus" NOT NULL DEFAULT 'PENDING',
    "contentHash" TEXT,
    "sanitizedContent" TEXT,
    "metadata" JSONB,
    "lastCrawledAt" TIMESTAMP(3),
    "error" TEXT,
    "httpStatus" INTEGER,
    "pageTitle" TEXT,
    "robotsAllowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedFact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "sourceUrl" TEXT,
    "confidence" DOUBLE PRECISION,
    "warning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL DEFAULT 'OTHER',
    "sourceUrl" TEXT,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "contentHash" TEXT NOT NULL,
    "dominantColors" JSONB,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "attribution" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "visibility" "SiteVisibility" NOT NULL DEFAULT 'UNLISTED',
    "demoMode" BOOLEAN NOT NULL DEFAULT true,
    "publishedVersionId" TEXT,
    "customDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVersion" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "SiteVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "siteSpec" JSONB NOT NULL,
    "designFingerprint" JSONB NOT NULL,
    "similarityScore" DOUBLE PRECISION,
    "createdBy" TEXT NOT NULL,
    "generationJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "SiteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT,
    "provider" "GenerationProvider" NOT NULL DEFAULT 'MOCK',
    "extractorModel" TEXT NOT NULL,
    "designerModel" TEXT NOT NULL,
    "status" "GenerationJobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" "GenerationStepKey" NOT NULL DEFAULT 'QUEUED',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "requestIds" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "triggerRunId" TEXT,
    "cancelRequested" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationStep" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "key" "GenerationStepKey" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "GenerationStepStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesActivity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "SalesActivityType" NOT NULL,
    "fromStatus" "SalesStatus",
    "toStatus" "SalesStatus",
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreviewVisit" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "referrerHost" TEXT,
    "userAgentFamily" TEXT,
    "path" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultDealValueMinor" INTEGER NOT NULL DEFAULT 12000,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "demoBadgeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "similarityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.72,
    "extractorModel" TEXT,
    "designerModel" TEXT,
    "tokenPricing" JSONB,
    "followUpBusinessDays" INTEGER NOT NULL DEFAULT 3,
    "maxCrawlPages" INTEGER NOT NULL DEFAULT 12,
    "showDemoBadgeAfterSale" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_salesStatus_idx" ON "Company"("salesStatus");

-- CreateIndex
CREATE INDEX "Company_generationStatus_idx" ON "Company"("generationStatus");

-- CreateIndex
CREATE INDEX "Company_archivedAt_idx" ON "Company"("archivedAt");

-- CreateIndex
CREATE INDEX "Company_nextFollowUpAt_idx" ON "Company"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Company_createdAt_idx" ON "Company"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyContact_companyId_idx" ON "CompanyContact"("companyId");

-- CreateIndex
CREATE INDEX "Source_companyId_crawlStatus_idx" ON "Source"("companyId", "crawlStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Source_companyId_url_key" ON "Source"("companyId", "url");

-- CreateIndex
CREATE INDEX "ExtractedFact_companyId_key_idx" ON "ExtractedFact"("companyId", "key");

-- CreateIndex
CREATE INDEX "Asset_companyId_type_idx" ON "Asset"("companyId", "type");

-- CreateIndex
CREATE INDEX "Asset_approved_excluded_idx" ON "Asset"("approved", "excluded");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_companyId_contentHash_key" ON "Asset"("companyId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Site_companyId_key" ON "Site"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Site_publishedVersionId_key" ON "Site"("publishedVersionId");

-- CreateIndex
CREATE INDEX "Site_slug_idx" ON "Site"("slug");

-- CreateIndex
CREATE INDEX "SiteVersion_siteId_status_idx" ON "SiteVersion"("siteId", "status");

-- CreateIndex
CREATE INDEX "SiteVersion_generationJobId_idx" ON "SiteVersion"("generationJobId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteVersion_siteId_versionNumber_key" ON "SiteVersion"("siteId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationJob_idempotencyKey_key" ON "GenerationJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GenerationJob_companyId_status_idx" ON "GenerationJob"("companyId", "status");

-- CreateIndex
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");

-- CreateIndex
CREATE INDEX "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationStep_jobId_status_idx" ON "GenerationStep"("jobId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationStep_jobId_key_key" ON "GenerationStep"("jobId", "key");

-- CreateIndex
CREATE INDEX "SalesActivity_companyId_createdAt_idx" ON "SalesActivity"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "FollowUp_companyId_status_dueAt_idx" ON "FollowUp"("companyId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUp_dueAt_status_idx" ON "FollowUp"("dueAt", "status");

-- CreateIndex
CREATE INDEX "EmailDraft_companyId_createdAt_idx" ON "EmailDraft"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "PreviewVisit_siteId_viewedAt_idx" ON "PreviewVisit"("siteId", "viewedAt");

-- CreateIndex
CREATE INDEX "PreviewVisit_siteId_sessionHash_idx" ON "PreviewVisit"("siteId", "sessionHash");

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedFact" ADD CONSTRAINT "ExtractedFact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "SiteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVersion" ADD CONSTRAINT "SiteVersion_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVersion" ADD CONSTRAINT "SiteVersion_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationStep" ADD CONSTRAINT "GenerationStep_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesActivity" ADD CONSTRAINT "SalesActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviewVisit" ADD CONSTRAINT "PreviewVisit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

