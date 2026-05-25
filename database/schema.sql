-- Schema definition for Farmer Market Connect database

CREATE DATABASE IF NOT EXISTS farmer_market;
USE farmer_market;

-- Drop tables in reverse order of dependencies to avoid foreign key errors
DROP TABLE IF EXISTS BUYER_RECOMMENDATION;
DROP TABLE IF EXISTS PRODUCT_SIMILARITY;
DROP TABLE IF EXISTS NOTIFICATION_TRIGGER_LOG;
DROP TABLE IF EXISTS NOTIFICATION_QUEUE;
DROP TABLE IF EXISTS REVIEW;
DROP TABLE IF EXISTS ORDER_ITEM;
DROP TABLE IF EXISTS `ORDER`;
DROP TABLE IF EXISTS PRODUCT;
DROP TABLE IF EXISTS FARMER;
DROP TABLE IF EXISTS BUYER;
DROP TABLE IF EXISTS MARKET;

-- 1. MARKET Table
CREATE TABLE MARKET (
    market_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    open_days VARCHAR(100) NOT NULL, -- e.g. "Mon, Wed, Fri"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BUYER Table
CREATE TABLE BUYER (
    buyer_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL, -- e.g. "whatsapp:+919876543210" or just "+919876543210"
    address TEXT,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FARMER Table
CREATE TABLE FARMER (
    farmer_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    farm_name VARCHAR(100) NOT NULL,
    farm_details TEXT,
    phone VARCHAR(20) NOT NULL,
    market_id INT,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES MARKET(market_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCT Table
CREATE TABLE PRODUCT (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g. "Vegetables", "Fruits", "Dairy", "Grains"
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    image_url VARCHAR(255), -- optional image URL for visual appeal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES FARMER(farmer_id) ON DELETE CASCADE,
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_stock CHECK (stock_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ORDER Table (Reserved keyword, enclosed in backticks)
CREATE TABLE `ORDER` (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES BUYER(buyer_id) ON DELETE CASCADE,
    CONSTRAINT chk_total_price CHECK (total_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ORDER_ITEM Table
CREATE TABLE ORDER_ITEM (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- captures price at time of purchase
    FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_item_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. REVIEW Table
CREATE TABLE REVIEW (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES BUYER(buyer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. NOTIFICATION_QUEUE Table
CREATE TABLE NOTIFICATION_QUEUE (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. NOTIFICATION_TRIGGER_LOG Table (Audit trail)
CREATE TABLE NOTIFICATION_TRIGGER_LOG (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    trigger_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id INT NOT NULL,
    details TEXT,
    fired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PRODUCT_SIMILARITY Table (Self-join co-occurrence results)
CREATE TABLE PRODUCT_SIMILARITY (
    product_id_1 INT NOT NULL,
    product_id_2 INT NOT NULL,
    similarity_score DECIMAL(5, 4) NOT NULL, -- Jaccard index between 0.0000 and 1.0000
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id_1, product_id_2),
    FOREIGN KEY (product_id_1) REFERENCES PRODUCT(product_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id_2) REFERENCES PRODUCT(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BUYER_RECOMMENDATION Table (Personalized product scores)
CREATE TABLE BUYER_RECOMMENDATION (
    buyer_id INT NOT NULL,
    product_id INT NOT NULL,
    score DECIMAL(5, 4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (buyer_id, product_id),
    FOREIGN KEY (buyer_id) REFERENCES BUYER(buyer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexing for Query Performance
CREATE INDEX idx_product_category ON PRODUCT(category);
CREATE INDEX idx_order_status ON `ORDER`(status);
CREATE INDEX idx_order_buyer ON `ORDER`(buyer_id);
CREATE INDEX idx_review_product ON REVIEW(product_id);
CREATE INDEX idx_notification_status ON NOTIFICATION_QUEUE(status);
