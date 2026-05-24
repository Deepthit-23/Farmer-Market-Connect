# Admin API routes

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from decimal import Decimal
from backend.database import get_db
from backend.models import Market, Farmer, Buyer, Order, OrderItem, NotificationTriggerLog, NotificationQueue
from backend.schemas import MarketCreate, MarketResponse, FarmerResponse, OrderResponse, AdminStats
from backend.auth import get_current_user, verify_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

# --- STATISTICS OVERVIEW ---

@router.get("/stats", response_model=AdminStats)
def get_admin_dashboard_stats(current_user: dict = Depends(verify_admin), db: Session = Depends(get_db)):
    total_markets = db.query(func.count(Market.market_id)).scalar() or 0
    total_farmers = db.query(func.count(Farmer.farmer_id)).scalar() or 0
    total_buyers = db.query(func.count(Buyer.buyer_id)).scalar() or 0
    total_orders = db.query(func.count(Order.order_id)).scalar() or 0
    total_revenue = db.query(func.sum(Order.total_price)).scalar() or Decimal("0.00")
    
    # Calculate distribution
    statuses = db.query(Order.status, func.count(Order.order_id)).group_by(Order.status).all()
    status_distribution = {status: count for status, count in statuses}
    
    return {
        "total_markets": total_markets,
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "status_distribution": status_distribution
    }


# --- MARKET MANAGEMENT ---

@router.get("/markets", response_model=List[MarketResponse])
def list_markets(db: Session = Depends(get_db)):
    markets = db.query(Market).all()
    return markets

@router.post("/markets", response_model=MarketResponse, status_code=status.HTTP_201_CREATED)
def create_market(
    market_in: MarketCreate,
    current_user: dict = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    db_market = Market(
        name=market_in.name,
        location=market_in.location,
        open_days=market_in.open_days
    )
    db.add(db_market)
    db.commit()
    db.refresh(db_market)
    return db_market

@router.delete("/markets/{market_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_market(
    market_id: int,
    current_user: dict = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
        
    db.delete(market)
    db.commit()
    return None


# --- FARMER MANAGEMENT & ASSIGNMENT ---

@router.get("/farmers", response_model=List[FarmerResponse])
def list_all_farmers(current_user: dict = Depends(verify_admin), db: Session = Depends(get_db)):
    # Pre-populate and join market details if present
    farmers = db.query(Farmer).all()
    return farmers

@router.put("/farmers/{farmer_id}/assign/{market_id}", response_model=FarmerResponse)
def assign_farmer_to_market(
    farmer_id: int,
    market_id: int,
    current_user: dict = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    # Verify farmer exists
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    # Verify market exists
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
        
    # Assign farmer to market
    farmer.market_id = market_id
    db.commit()
    db.refresh(farmer)
    return farmer


# --- GLOBAL ORDER TRACKING ---

@router.get("/orders", response_model=List[OrderResponse])
def list_all_orders(current_user: dict = Depends(verify_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    
    response_orders = []
    for o in orders:
        items_out = []
        for item in o.items:
            items_out.append({
                "order_item_id": item.order_item_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "product": {
                    "product_id": item.product.product_id,
                    "farmer_id": item.product.farmer_id,
                    "name": item.product.name,
                    "category": item.product.category,
                    "price": item.price,
                    "stock_quantity": item.product.stock_quantity,
                    "image_url": item.product.image_url,
                    "created_at": item.product.created_at,
                    "farmer_farm_name": item.product.farmer.farm_name if item.product.farmer else "Local Farm"
                }
            })
            
        response_orders.append({
            "order_id": o.order_id,
            "buyer_id": o.buyer_id,
            "total_price": o.total_price,
            "status": o.status,
            "created_at": o.created_at,
            "items": items_out,
            "buyer_name": o.buyer.name if o.buyer else "Unknown Buyer"
        })
        
    return response_orders


# --- live dbms tracking console ---

@router.get("/audit-logs")
def get_audit_logs(current_user: dict = Depends(verify_admin), db: Session = Depends(get_db)):
    """
    Fetches rows from NOTIFICATION_TRIGGER_LOG, which is populated by the
    MySQL AFTER UPDATE trigger 'tr_order_after_update' on the `ORDER` table.
    """
    logs = db.query(NotificationTriggerLog).order_by(NotificationTriggerLog.fired_at.desc()).all()
    return logs


@router.get("/notifications")
def get_notifications(current_user: dict = Depends(verify_admin), db: Session = Depends(get_db)):
    """
    Fetches rows from NOTIFICATION_QUEUE, which is populated by the MySQL
    trigger to queue twilio whatsapp messages on order status changes.
    """
    notifications = db.query(NotificationQueue).order_by(NotificationQueue.created_at.desc()).all()
    return notifications

