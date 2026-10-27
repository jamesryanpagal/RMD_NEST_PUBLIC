-- CreateEnum
CREATE TYPE "public"."NOTIFICATION_TYPE" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "public"."NOTIFICATION_TITLE" AS ENUM ('MONTHLY_PAYMENT_REMINDER');

-- CreateEnum
CREATE TYPE "public"."NOTIFICATION_STATUS" AS ENUM ('UNREAD', 'READ', 'DELETED');

-- CreateTable
CREATE TABLE "public"."EmailLogs" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "replyTo" TEXT,
    "body" TEXT NOT NULL,
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL,
    "dateDeleted" TIMESTAMP(3),

    CONSTRAINT "EmailLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "type" "public"."NOTIFICATION_TYPE" NOT NULL,
    "title" "public"."NOTIFICATION_TITLE" NOT NULL,
    "description" TEXT,
    "targetId" TEXT NOT NULL,
    "status" "public"."NOTIFICATION_STATUS" NOT NULL DEFAULT 'UNREAD',
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL,
    "dateDeleted" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
