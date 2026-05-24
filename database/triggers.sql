-- Triggers definition for Farmer Market Connect

USE farmer_market;

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
                CONCAT('Hello ', buyer_name, '! Your Farmer Market Connect order #', NEW.order_id, 
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
