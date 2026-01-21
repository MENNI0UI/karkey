-- WARNING: run on a backup/test DB first.
START TRANSACTION;

-- vehicle_photos table
UPDATE vehicle_photos
SET photo_url = CONCAT('/uploads/vehicles/', SUBSTRING_INDEX(photo_url, '/uploads/photos/', -1))
WHERE photo_url LIKE '%/uploads/photos/%' OR photo_url LIKE '%uploads/photos/%';

-- showroom_photos table
UPDATE showroom_photos
SET photo_url = CONCAT('/uploads/vehicles/', SUBSTRING_INDEX(photo_url, '/uploads/photos/', -1))
WHERE photo_url LIKE '%/uploads/photos/%' OR photo_url LIKE '%uploads/photos/%';

-- If vehicles table stores a main image path in a column (example: image_url)
UPDATE vehicles
SET image_url = CONCAT('/uploads/vehicles/', SUBSTRING_INDEX(image_url, '/uploads/photos/', -1))
WHERE image_url LIKE '%/uploads/photos/%' OR image_url LIKE '%uploads/photos/%';

COMMIT;
