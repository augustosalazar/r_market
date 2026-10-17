-- Consulta guardada `market_listings_by_ids` (servidor de test, proyecto market_46aeeeed04).
-- La ejecuta RobleListingDataSource.listingsByIds cuando hay cuenta (followedBy).
-- Parametro: $1 lista de _id (uuid[]), sacada de la lectura normal de listing_follow.
-- Corre sin alcance own: solo debe leer tablas que ya son publicas.
SELECT _id, seller_id, seller_name, brand, model, year, price, mileage_km,
       fuel, transmission, city, description, image_1, image_2, image_3,
       status, created_at, buyer_id, buyer_name, sold_at
FROM listing
WHERE _id = ANY($1::uuid[])
ORDER BY created_at DESC
