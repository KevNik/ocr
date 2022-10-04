-- CreateTable
CREATE TABLE "captures" (
    "id" SERIAL NOT NULL,
    "date_time" TIMESTAMP(6),
    "plate" VARCHAR,
    "capture_way" VARCHAR,
    "camera" VARCHAR,
    "file_path" VARCHAR,
    "dispatch_date_time" TIMESTAMP(6),

    CONSTRAINT "captures_pkey" PRIMARY KEY ("id")
);
