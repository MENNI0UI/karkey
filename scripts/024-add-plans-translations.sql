-- ============================================
-- Migration: Add translation columns to plans table
-- Supports: Arabic (ar), French (fr), Spanish (es)
-- Run: mysql -u root -p karkey < scripts/024-add-plans-translations.sql
-- ============================================

USE karkey;

-- Add translated name columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100) NULL AFTER name;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100) NULL AFTER name_ar;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS name_es VARCHAR(100) NULL AFTER name_fr;

-- Add translated description columns
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_ar TEXT NULL AFTER description;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_fr TEXT NULL AFTER description_ar;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description_es TEXT NULL AFTER description_fr;

-- Add translated features columns (JSON arrays)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_ar JSON NULL AFTER features;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_fr JSON NULL AFTER features_ar;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features_es JSON NULL AFTER features_fr;

-- Update existing Starter plan with translations
UPDATE plans SET 
  name_ar = 'مبتدئ',
  name_fr = 'Démarrage',
  name_es = 'Inicial',
  description_ar = 'مثالي للبائعين الأفراد الذين يتطلعون لإدراج عدد قليل من المركبات كل شهر',
  description_fr = 'Parfait pour les vendeurs individuels souhaitant lister quelques véhicules chaque mois',
  description_es = 'Perfecto para vendedores individuales que buscan listar algunos vehículos cada mes',
  features_ar = '["حتى 3 مزادات نشطة", "حتى 5 إعلانات في المعرض", "رؤية قياسية للإعلانات", "تحليلات مزادات أساسية", "دعم عبر البريد الإلكتروني", "مدة الإعلان 7 أيام", "تحميل الصور (حتى 10 لكل إعلان)"]',
  features_fr = '["Jusqu''à 3 enchères actives", "Jusqu''à 5 annonces showroom", "Visibilité standard des annonces", "Analyses d''enchères de base", "Support par email", "Durée d''annonce 7 jours", "Téléchargement de photos (jusqu''à 10 par annonce)"]',
  features_es = '["Hasta 3 subastas activas", "Hasta 5 listados en sala de exposición", "Visibilidad de listado estándar", "Análisis de subastas básico", "Soporte por correo electrónico", "Duración del listado 7 días", "Carga de fotos (hasta 10 por listado)"]'
WHERE name = 'Starter';

-- Update existing Accelerator plan with translations
UPDATE plans SET 
  name_ar = 'مسرّع',
  name_fr = 'Accélérateur',
  name_es = 'Acelerador',
  description_ar = 'مثالي للتجار والبائعين المتكررين الذين يحتاجون إلى مزيد من الرؤية والأدوات',
  description_fr = 'Idéal pour les concessionnaires et vendeurs fréquents nécessitant plus de visibilité et d''outils',
  description_es = 'Ideal para concesionarios y vendedores frecuentes que necesitan más visibilidad y herramientas',
  features_ar = '["حتى 15 مزاداً نشطاً", "حتى 30 إعلاناً في المعرض", "موضع أولوية للإعلانات", "تحليلات مزادات متقدمة", "دعم أولوية عبر البريد والدردشة", "مدة الإعلان 14 يوماً", "تحميل الصور (حتى 25 لكل إعلان)", "شارة مميزة على الإعلانات", "إشعارات وتنبيهات المزايدات"]',
  features_fr = '["Jusqu''à 15 enchères actives", "Jusqu''à 30 annonces showroom", "Placement prioritaire des annonces", "Analyses d''enchères avancées", "Support prioritaire email et chat", "Durée d''annonce 14 jours", "Téléchargement de photos (jusqu''à 25 par annonce)", "Badge vedette sur les annonces", "Notifications et alertes d''enchères"]',
  features_es = '["Hasta 15 subastas activas", "Hasta 30 listados en sala de exposición", "Colocación prioritaria de listados", "Análisis de subastas avanzado", "Soporte prioritario por correo y chat", "Duración del listado 14 días", "Carga de fotos (hasta 25 por listado)", "Insignia destacada en listados", "Notificaciones y alertas de ofertas"]'
WHERE name = 'Accelerator';

-- Update existing Prestige plan with translations
UPDATE plans SET 
  name_ar = 'بريستيج',
  name_fr = 'Prestige',
  name_es = 'Prestigio',
  description_ar = 'للوكالات الكبيرة والمحترفين الذين يحتاجون وصولاً غير محدود ودعماً مميزاً',
  description_fr = 'Pour les grands concessionnaires et professionnels nécessitant un accès illimité et un support premium',
  description_es = 'Para grandes concesionarios y profesionales que necesitan acceso ilimitado y soporte premium',
  features_ar = '["مزادات نشطة غير محدودة", "إعلانات معرض غير محدودة", "أعلى موضع في نتائج البحث", "لوحة تحليلات كاملة", "مدير حساب مخصص", "مدة الإعلان 30 يوماً", "تحميل صور غير محدود", "شارة تاجر موثق", "وصول مبكر للميزات الجديدة", "خيارات علامة تجارية مخصصة"]',
  features_fr = '["Enchères actives illimitées", "Annonces showroom illimitées", "Meilleur placement dans les résultats", "Tableau de bord analytique complet", "Gestionnaire de compte dédié", "Durée d''annonce 30 jours", "Téléchargement de photos illimité", "Badge concessionnaire vérifié", "Accès anticipé aux nouvelles fonctionnalités", "Options de marque personnalisées"]',
  features_es = '["Subastas activas ilimitadas", "Listados ilimitados en sala de exposición", "Mejor posición en resultados de búsqueda", "Panel de análisis completo", "Gestor de cuenta dedicado", "Duración del listado 30 días", "Carga de fotos ilimitada", "Insignia de concesionario verificado", "Acceso anticipado a nuevas funciones", "Opciones de marca personalizadas"]'
WHERE name = 'Prestige';

-- Show result
SELECT id, name, name_ar, name_fr, name_es, price FROM plans ORDER BY priority DESC;
