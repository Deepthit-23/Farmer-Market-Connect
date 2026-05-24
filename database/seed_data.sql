-- Seed data for Farmer Market Connect

USE farmer_market;

-- Clear any existing seed entries (optional, as schema script drops tables first)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE BUYER_RECOMMENDATION;
TRUNCATE TABLE PRODUCT_SIMILARITY;
TRUNCATE TABLE NOTIFICATION_TRIGGER_LOG;
TRUNCATE TABLE NOTIFICATION_QUEUE;
TRUNCATE TABLE REVIEW;
TRUNCATE TABLE ORDER_ITEM;
TRUNCATE TABLE `ORDER`;
TRUNCATE TABLE PRODUCT;
TRUNCATE TABLE FARMER;
TRUNCATE TABLE BUYER;
TRUNCATE TABLE MARKET;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Markets
INSERT INTO MARKET (market_id, name, location, open_days) VALUES
(1, 'Downtown Farmers Market', '100 Main St, Metro Center', 'Sat, Sun'),
(2, 'Sunset Organic Bazaar', '450 West Blvd, Sunset District', 'Wed, Fri'),
(3, 'Green Valley Market', '789 Farm Road, Valley Outskirts', 'Mon, Thu');

-- 2. Insert Buyers
-- All passwords are encrypted versions of 'password123' generated with bcrypt
-- Hash: $2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm
INSERT INTO BUYER (buyer_id, email, password_hash, name, phone, address) VALUES
(1, 'alice@buyer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'Alice Smith', '+919876543210', 'Apt 4B, Pine Towers, Metro City'),
(2, 'bob@buyer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'Bob Jones', '+919876543211', '12 Oak Lane, Sunset Suburbs'),
(3, 'charlie@buyer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'Charlie Brown', '+919876543212', '78 Birch Boulevard, Green Village'),
(4, 'diana@buyer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'Diana Prince', '+919876543213', '1 Plaza Way, Hall of Justice');

-- 3. Insert Farmers
-- All passwords are encrypted versions of 'password123'
INSERT INTO FARMER (farmer_id, email, password_hash, farm_name, farm_details, phone, market_id) VALUES
(1, 'john@farmer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'John\'s Organic Acres', 'Specializing in heirloom vegetables and leafy greens. pesticide-free since 2012.', '+918765432101', 1),
(2, 'mary@farmer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'Mary\'s Berry Orchard', 'Harvesting fresh strawberries, blueberries, and orchard fruits at peak ripeness.', '+918765432102', 1),
(3, 'david@farmer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'David\'s Dairy Pastures', 'Happy grass-fed cows producing fresh whole milk, butter, and raw artisan cheeses.', '+918765432103', 2),
(4, 'sarah@farmer.com', '$2b$12$DqX9pWp/pLq6YF0W0lA4b.a23v/m.Ew17yC2e.n5Hq3H4wS/Nf4Xm', 'Sarah\'s Apiary & Honey', 'Pure raw wildflower honey and natural honeycomb from local bio-diverse hives.', '+918765432104', 3);

-- 4. Insert Products
INSERT INTO PRODUCT (product_id, farmer_id, name, category, price, stock_quantity, image_url) VALUES
(1, 1, 'Organic Red Tomatoes', 'Vegetables', 2.50, 100, 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400'),
(2, 1, 'Crisp Baby Spinach', 'Vegetables', 3.00, 80, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'),
(3, 1, 'Sweet Yellow Corn', 'Vegetables', 1.50, 150, 'https://images.unsplash.com/photo-1551754655-cd27e38d20f6?w=400'),
(4, 2, 'Fresh Strawberries', 'Fruits', 4.50, 60, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'),
(5, 2, 'Sweet Blueberries', 'Fruits', 5.00, 45, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'),
(6, 3, 'Grass-fed Whole Milk', 'Dairy', 3.50, 50, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'),
(7, 3, 'Artisan Salted Butter', 'Dairy', 4.00, 40, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400'),
(8, 4, 'Raw Wildflower Honey', 'Grains & Pantry', 8.50, 30, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'),
(9, 4, 'Organic Oats', 'Grains & Pantry', 3.00, 120, 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400'),
(10, 1, 'Fresh Cucumbers', 'Vegetables', 1.80, 90, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400');

-- 5. Insert Reviews
INSERT INTO REVIEW (buyer_id, product_id, rating, comment) VALUES
(1, 1, 5, 'Best tomatoes I\'ve tasted in years! Super juicy.'),
(2, 2, 4, 'Very clean and fresh, perfect for my salads.'),
(3, 4, 5, 'Plump and extremely sweet Strawberries! Highly recommend.'),
(4, 6, 5, 'Tastes so much richer than store-bought milk.'),
(1, 8, 5, 'Pure honey of high quality, will buy again.');

-- 6. Insert Orders & Order Items
-- We construct basket associations to simulate real product co-occurrence:
-- Group A: Tomatoes (1) and Spinach (2) - Bought together often
-- Group B: Strawberries (4) and Milk (6) and Butter (7) - Bought together often
-- Group C: Spinach (2) and Honey (8) - Bought together often

-- Order 1: Alice buys (Tomatoes, Spinach)
INSERT INTO `ORDER` (order_id, buyer_id, total_price, status, created_at) VALUES
(1, 1, 8.00, 'delivered', '2026-05-20 10:00:00');
INSERT INTO ORDER_ITEM (order_item_id, order_id, product_id, quantity, price) VALUES
(1, 1, 1, 2, 2.50), -- Tomatoes (total $5.00)
(2, 1, 2, 1, 3.00); -- Spinach (total $3.00)

-- Order 2: Bob buys (Tomatoes, Spinach, Honey)
INSERT INTO `ORDER` (order_id, buyer_id, total_price, status, created_at) VALUES
(2, 2, 19.50, 'delivered', '2026-05-21 11:30:00');
INSERT INTO ORDER_ITEM (order_item_id, order_id, product_id, quantity, price) VALUES
(3, 2, 1, 2, 2.50), -- Tomatoes (total $5.00)
(4, 2, 2, 2, 3.00), -- Spinach (total $6.00)
(5, 2, 8, 1, 8.50); -- Honey (total $8.50)

-- Order 3: Charlie buys (Strawberries, Milk)
INSERT INTO `ORDER` (order_id, buyer_id, total_price, status, created_at) VALUES
(3, 3, 11.50, 'delivered', '2026-05-22 14:15:00');
INSERT INTO ORDER_ITEM (order_item_id, order_id, product_id, quantity, price) VALUES
(6, 3, 4, 2, 4.50), -- Strawberries (total $9.00)
(7, 3, 6, 1, 3.50); -- Milk (total $2.50)

-- Order 4: Diana buys (Strawberries, Milk, Butter)
INSERT INTO `ORDER` (order_id, buyer_id, total_price, status, created_at) VALUES
(4, 4, 16.50, 'shipped', '2026-05-23 09:00:00');
INSERT INTO ORDER_ITEM (order_item_id, order_id, product_id, quantity, price) VALUES
(8, 4, 4, 1, 4.50), -- Strawberries (total $4.50)
(9, 4, 6, 2, 3.50), -- Milk (total $7.00)
(10, 4, 7, 1, 4.00); -- Butter (total $4.00)

-- Order 5: Alice buys (Spinach, Honey) - reinforces Spinach & Honey relationship
INSERT INTO `ORDER` (order_id, buyer_id, total_price, status, created_at) VALUES
(5, 1, 14.50, 'confirmed', '2026-05-24 16:00:00');
INSERT INTO ORDER_ITEM (order_item_id, order_id, product_id, quantity, price) VALUES
(11, 5, 2, 2, 3.00), -- Spinach (total $6.00)
(12, 5, 8, 1, 8.50); -- Honey (total $8.50)
