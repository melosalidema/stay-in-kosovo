-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'BUSINESS_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('FOOD', 'NIGHTLIFE', 'NATURE', 'CULTURE', 'EVENT', 'WELLNESS', 'SHOPPING', 'STAY');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('WALKING', 'TAXI', 'BUS', 'BIKE', 'CAR');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'SAVE', 'REVIEW', 'CHECK_IN', 'SHARE', 'ROUTE_REQUEST', 'ITINERARY_ADD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "hashedPassword" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "homeCity" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'PENDING',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "boostScore" INTEGER NOT NULL DEFAULT 0,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "schedule" JSONB,
    "contact" JSONB,
    "analytics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vibe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vibe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "priceLevel" INTEGER NOT NULL DEFAULT 2,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "avgStayMinutes" INTEGER NOT NULL DEFAULT 75,
    "openNow" BOOLEAN NOT NULL DEFAULT true,
    "vibeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "atmosphereTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "musicVibe" TEXT,
    "crowdLevel" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transportation" JSONB,
    "accessibility" JSONB,
    "popularityScore" INTEGER NOT NULL DEFAULT 50,
    "hiddenGemScore" INTEGER NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "atmosphereTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "crowdLevel" TEXT NOT NULL,
    "musicVibe" TEXT,
    "localPopularity" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "vibe" TEXT NOT NULL,
    "budget" DECIMAL(8,2) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "transportPreference" "TransportType" NOT NULL,
    "totalCost" DECIMAL(8,2) NOT NULL,
    "aiRationale" TEXT NOT NULL,
    "routeSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryStop" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "travelMinutes" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(8,2) NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "ItineraryStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "placeId" TEXT,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "vibeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heatScore" INTEGER NOT NULL DEFAULT 40,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPlace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportationPoint" (
    "id" TEXT NOT NULL,
    "type" "TransportType" NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "schedule" JSONB,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 70,
    "placeId" TEXT,

    CONSTRAINT "TransportationPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "fromLabel" TEXT NOT NULL,
    "toLabel" TEXT NOT NULL,
    "method" "TransportType" NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "cost" DECIMAL(8,2) NOT NULL,
    "carbonScore" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "placeId" TEXT,
    "eventId" TEXT,
    "type" "InteractionType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCheckIn" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "qrCode" TEXT NOT NULL,
    "value" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "Business_status_city_idx" ON "Business"("status", "city");

-- CreateIndex
CREATE INDEX "Business_boostScore_idx" ON "Business"("boostScore");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Vibe_name_key" ON "Vibe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vibe_slug_key" ON "Vibe"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Place_businessId_idx" ON "Place"("businessId");

-- CreateIndex
CREATE INDEX "Place_categoryId_idx" ON "Place"("categoryId");

-- CreateIndex
CREATE INDEX "Place_city_openNow_idx" ON "Place"("city", "openNow");

-- CreateIndex
CREATE INDEX "Place_rating_idx" ON "Place"("rating");

-- CreateIndex
CREATE INDEX "Place_popularityScore_idx" ON "Place"("popularityScore");

-- CreateIndex
CREATE INDEX "Place_latitude_longitude_idx" ON "Place"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Review_placeId_status_idx" ON "Review"("placeId", "status");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Itinerary_userId_idx" ON "Itinerary"("userId");

-- CreateIndex
CREATE INDEX "Itinerary_city_vibe_idx" ON "Itinerary"("city", "vibe");

-- CreateIndex
CREATE INDEX "Itinerary_createdAt_idx" ON "Itinerary"("createdAt");

-- CreateIndex
CREATE INDEX "ItineraryStop_placeId_idx" ON "ItineraryStop"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryStop_itineraryId_order_key" ON "ItineraryStop"("itineraryId", "order");

-- CreateIndex
CREATE INDEX "Event_city_startsAt_idx" ON "Event"("city", "startsAt");

-- CreateIndex
CREATE INDEX "Event_heatScore_idx" ON "Event"("heatScore");

-- CreateIndex
CREATE INDEX "SavedPlace_placeId_idx" ON "SavedPlace"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPlace_userId_placeId_key" ON "SavedPlace"("userId", "placeId");

-- CreateIndex
CREATE INDEX "TransportationPoint_city_type_idx" ON "TransportationPoint"("city", "type");

-- CreateIndex
CREATE INDEX "TransportationPoint_latitude_longitude_idx" ON "TransportationPoint"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "TransportRoute_method_idx" ON "TransportRoute"("method");

-- CreateIndex
CREATE INDEX "UserInteraction_userId_createdAt_idx" ON "UserInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserInteraction_placeId_type_idx" ON "UserInteraction"("placeId", "type");

-- CreateIndex
CREATE INDEX "BusinessCheckIn_businessId_createdAt_idx" ON "BusinessCheckIn"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessCheckIn_qrCode_idx" ON "BusinessCheckIn"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationPoint" ADD CONSTRAINT "TransportationPoint_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCheckIn" ADD CONSTRAINT "BusinessCheckIn_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCheckIn" ADD CONSTRAINT "BusinessCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
