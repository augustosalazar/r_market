-- Consulta guardada `market_search_listings` (servidor de test, proyecto market_46aeeeed04).
-- La ejecuta RobleListingDataSource.searchListings cuando hay cuenta.
-- Parametros: $1 texto (minusculas, puede ser ''), $2 marca, $3 precio minimo,
-- $4 precio maximo, $5 año minimo. Los cuatro ultimos admiten null.
-- Corre sin alcance own: solo debe leer tablas que ya son publicas.
SELECT _id, seller_id, seller_name, brand, model, year, price, mileage_km,
       fuel, transmission, city, description, image_1, image_2, image_3,
       status, created_at, buyer_id, buyer_name, sold_at
FROM listing
WHERE ($1::text = '' OR strpos(lower(brand || ' ' || model || ' ' || year::text || ' ' || coalesce(city, '')), lower($1::text)) > 0)
  AND ($2::text IS NULL OR brand = $2::text)
  AND ($3::numeric IS NULL OR price >= $3::numeric)
  AND ($4::numeric IS NULL OR price <= $4::numeric)
  AND ($5::int IS NULL OR year >= $5::int)
ORDER BY created_at DESC
