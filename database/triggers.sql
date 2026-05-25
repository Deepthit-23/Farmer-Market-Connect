-- Triggers definition for AgriFlow Direct (Farmer Market Connect)
USE farmer_market;

-- 1. ORDER Placement confirmation to BUYER
DROP TRIGGER IF EXISTS tr_order_after_insert;

DELIMITER //

CREATE TRIGGER tr_order_after_insert
AFTER INSERT ON `ORDER`
FOR EACH ROW
BEGIN
    DECLARE buyer_phone VARCHAR(20) DEFAULT '';
    DECLARE buyer_name VARCHAR(100) DEFAULT '';

    -- Retrieve the buyer's contact details
    SELECT phone, name INTO buyer_phone, buyer_name 
    FROM BUYER 
    WHERE buyer_id = NEW.buyer_id;

    -- Queue a message for the Buyer (order confirmation)
    INSERT INTO NOTIFICATION_QUEUE (order_id, phone, message, status)
    VALUES (
        NEW.order_id,
        buyer_phone,
        CONCAT('Hello ', buyer_name, '! Your AgriFlow Direct order #', NEW.order_id, 
               ' has been successfully placed! Total amount: $', NEW.total_price, 
               '. Our farm partners will begin preparing your fresh harvest shortly.'),
        'pending'
    );

    -- Audit trail logging
    INSERT INTO NOTIFICATION_TRIGGER_LOG (trigger_name, action_type, record_id, details)
    VALUES (
        'tr_order_after_insert',
        'INSERT',
        NEW.order_id,
        CONCAT('Order #', NEW.order_id, ' placed successfully for Buyer ID ', NEW.buyer_id)
    );
END //

DELIMITER ;


-- 2. New incoming order alert to FARMER
DROP TRIGGER IF EXISTS tr_order_item_after_insert;

DELIMITER //

CREATE TRIGGER tr_order_item_after_insert
AFTER INSERT ON ORDER_ITEM
FOR EACH ROW
BEGIN
    DECLARE farmer_phone VARCHAR(20) DEFAULT '';
    DECLARE farmer_name VARCHAR(100) DEFAULT '';
    DECLARE crop_name VARCHAR(100) DEFAULT '';
    DECLARE parent_buyer_name VARCHAR(100) DEFAULT '';

    -- Retrieve farmer details and product details
    SELECT f.phone, f.farm_name, p.name INTO farmer_phone, farmer_name, crop_name
    FROM PRODUCT p
    JOIN FARMER f ON p.farmer_id = f.farmer_id
    WHERE p.product_id = NEW.product_id;

    -- Retrieve the buyer's name from parent ORDER
    SELECT b.name INTO parent_buyer_name
    FROM `ORDER` o
    JOIN BUYER b ON o.buyer_id = b.buyer_id
    WHERE o.order_id = NEW.order_id;

    -- Queue a message for the Farmer (new order notification)
    INSERT INTO NOTIFICATION_QUEUE (order_id, phone, message, status)
    VALUES (
        NEW.order_id,
        farmer_phone,
        CONCAT('Hello ', farmer_name, '! You have received a new crop order (Order #', NEW.order_id, 
               ') from ', parent_buyer_name, ' for: ', crop_name, ' (Quantity: ', NEW.quantity, 
               '). Please log in to ship the fresh cargo!'),
        'pending'
    );

    -- Audit trail logging
    INSERT INTO NOTIFICATION_TRIGGER_LOG (trigger_name, action_type, record_id, details)
    VALUES (
        'tr_order_item_after_insert',
        'INSERT',
        NEW.order_item_id,
        CONCAT('New item order ID ', NEW.order_item_id, ' of ', crop_name, ' notified to Farmer: ', farmer_name)
    );
END //

DELIMITER ;


-- 3. Transit status changes to BUYER
DROP TRIGGER IF EXISTS tr_order_after_update;

DELIMITER //

CREATE TRIGGER tr_order_after_update
AFTER UPDATE ON `ORDER`
FOR EACH ROW
BEGIN
    -- Check if order status actually changed
    IF OLD.status <> NEW.status THEN
        BEGIN
            DECLARE buyer_phone VARCHAR(20) DEFAULT '';
            DECLARE buyer_name VARCHAR(100) DEFAULT '';

            -- Retrieve the buyer's contact details
            SELECT phone, name INTO buyer_phone, buyer_name 
            FROM BUYER 
            WHERE buyer_id = NEW.buyer_id;

            -- Queue a message for the WhatsApp worker
            INSERT INTO NOTIFICATION_QUEUE (order_id, phone, message, status)
            VALUES (
                NEW.order_id,
                buyer_phone,
                CONCAT('Hello ', buyer_name, '! Your AgriFlow Direct order #', NEW.order_id, 
                       ' status has changed from "', OLD.status, '" to "', NEW.status, '".'),
                'pending'
            );

            -- Audit trail logging
            INSERT INTO NOTIFICATION_TRIGGER_LOG (trigger_name, action_type, record_id, details)
            VALUES (
                'tr_order_after_update',
                'UPDATE',
                NEW.order_id,
                CONCAT('Order #', NEW.order_id, ' status updated from "', OLD.status, '" to "', NEW.status, '" for Buyer ID ', NEW.buyer_id)
            );
        END;
    END IF;
END //

DELIMITER ;
