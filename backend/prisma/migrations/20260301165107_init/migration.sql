-- CreateTable
CREATE TABLE "DailyReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ReportItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "adminId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_reportDate_key" ON "DailyReport"("reportDate");

-- CreateIndex
CREATE UNIQUE INDEX "AdminConfig_adminId_key" ON "AdminConfig"("adminId");
