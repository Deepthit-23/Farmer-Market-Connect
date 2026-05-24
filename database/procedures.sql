-- Stored Procedures for Farmer Market Connect

USE farmer_market;

DROP PROCEDURE IF EXISTS compute_product_similarity;
DROP PROCEDURE IF EXISTS generate_recommendations;

DELIMITER //

-- 1. Compute Product Similarity Stored Procedure
-- Performs self-join on ORDER_ITEM to find products bought together, computing Jaccard index similarity
CREATE PROCEDURE compute_product_similarity()
BEGIN
    -- Clear previous calculations
    TRUNCATE TABLE PRODUCT_SIMILARITY;

    -- Compute co-occurrence and similarity scores
    -- Score = (orders with both A and B) / (orders with A + orders with B - orders with both A and B)
    INSERT INTO PRODUCT_SIMILARITY (product_id_1, product_id_2, similarity_score)
    SELECT 
        oi1.product_id AS product_id_1,
        oi2.product_id AS product_id_2,
        COUNT(DISTINCT oi1.order_id) / (
            (SELECT COUNT(DISTINCT order_id) FROM ORDER_ITEM WHERE product_id = oi1.product_id) +
            (SELECT COUNT(DISTINCT order_id) FROM ORDER_ITEM WHERE product_id = oi2.product_id) -
            COUNT(DISTINCT oi1.order_id)
        ) AS similarity_score
    FROM ORDER_ITEM oi1
    INNER JOIN ORDER_ITEM oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
    GROUP BY oi1.product_id, oi2.product_id;
END //

-- 2. Generate Recommendations for a specific buyer
-- Reads PRODUCT_SIMILARITY and populates BUYER_RECOMMENDATION
CREATE PROCEDURE generate_recommendations(IN buyer_id_param INT)
BEGIN
    -- Clear existing recommendations for this buyer
    DELETE FROM BUYER_RECOMMENDATION WHERE buyer_id = buyer_id_param;

    -- Recommend products similar to what they already purchased,
    -- but excluding products they have already purchased.
    INSERT INTO BUYER_RECOMMENDATION (buyer_id, product_id, score)
    SELECT 
        buyer_id_param,
        ps.product_id_2 AS product_id,
        MAX(ps.similarity_score) AS score
    FROM `ORDER` o
    INNER JOIN ORDER_ITEM oi ON o.order_id = oi.order_id
    INNER JOIN PRODUCT_SIMILARITY ps ON oi.product_id = ps.product_id_1
    WHERE o.buyer_id = buyer_id_param
      -- Filter out products the buyer has already ordered
      AND ps.product_id_2 NOT IN (
          SELECT DISTINCT oi2.product_id
          FROM `ORDER` o2
          INNER JOIN ORDER_ITEM oi2 ON o2.order_id = oi2.order_id
          WHERE o2.buyer_id = buyer_id_param
      )
    GROUP BY ps.product_id_2
    ORDER BY score DESC;
END //

DELIMITER ;
