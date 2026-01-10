-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'submitted', 'confirmed');

-- CreateTable
CREATE TABLE "sales_persons" (
    "sales_person_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "manager_id" INTEGER,
    "is_manager" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_persons_pkey" PRIMARY KEY ("sales_person_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "customer_name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200),
    "phone" VARCHAR(20),
    "contact_person" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "report_id" SERIAL NOT NULL,
    "sales_person_id" INTEGER NOT NULL,
    "report_date" DATE NOT NULL,
    "problem" TEXT,
    "plan" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "visit_records" (
    "visit_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "visit_time" TIME,
    "visit_purpose" VARCHAR(100),
    "visit_content" TEXT NOT NULL,
    "visit_result" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_records_pkey" PRIMARY KEY ("visit_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "comment_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "sales_person_id" INTEGER NOT NULL,
    "comment_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_persons_email_key" ON "sales_persons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_sales_person_id_report_date_key" ON "daily_reports"("sales_person_id", "report_date");

-- AddForeignKey
ALTER TABLE "sales_persons" ADD CONSTRAINT "sales_persons_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "sales_persons"("sales_person_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "sales_persons"("sales_person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "daily_reports"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "daily_reports"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "sales_persons"("sales_person_id") ON DELETE CASCADE ON UPDATE CASCADE;
