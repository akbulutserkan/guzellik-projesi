-- MCP verilerini JSON'dan PostgreSQL'e aktarma SQL betiği

-- Veritabanı şemasını kontrol et
DO $$ 
BEGIN
    -- Tablo yoksa oluştur
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_data') THEN
        CREATE TABLE "project_data" (
            "id" TEXT NOT NULL,
            "key" TEXT NOT NULL,
            "data" JSONB NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "ProjectData_pkey" PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX "ProjectData_key_key" ON "project_data"("key");
    END IF;
END $$;

-- Test verilerini ekle
INSERT INTO "project_data" (
    "id", 
    "key", 
    "data",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'default',
    '{"proje": "Test", "adim": 1}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") 
DO UPDATE SET 
    "data" = '{"proje": "Test", "adim": 1}'::jsonb, 
    "updatedAt" = CURRENT_TIMESTAMP;

-- Veri ekleme durumunu kontrol et
SELECT * FROM "project_data" WHERE "key" = 'default';