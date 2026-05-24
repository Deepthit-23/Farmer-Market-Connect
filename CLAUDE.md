# CLAUDE.md

## Project
Farmer Market Connect — college DBMS mini project

## Stack
- Backend: FastAPI (Python), SQLAlchemy, MySQL 8
- Auth: JWT with role-based access (farmer / buyer / admin)
- Notifications: Twilio WhatsApp API via polling scheduler
- DB features to highlight: triggers, stored procedures, self-joins

## Actors
- Farmer: lists products, manages stock, sees orders
- Buyer: browses market, gets recommendations, places orders
- Market Admin: manages market listings and farmers

## DB concepts that MUST be demonstrated
1. AFTER UPDATE trigger on ORDER → NOTIFICATION_QUEUE
2. Stored procedure: compute_product_similarity() using ORDER_ITEM self-join
3. Stored procedure: generate_recommendations(buyer_id)
4. NOTIFICATION_TRIGGER_LOG as audit table

## Env vars (see .env.example)
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
JWT_SECRET_KEY