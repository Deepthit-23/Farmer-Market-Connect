# Farmer API routes

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Farmer, Product, Order, OrderItem
from backend.schemas import ProductCreate, ProductUpdate, ProductResponse, OrderResponse, FarmerResponse, FarmerUpdate, OrderStatusUpdate
from backend.auth import get_current_user, verify_farmer

router = APIRouter(prefix="/api/farmer", tags=["Farmer Portal"])

# --- FARMER PROFILE ---

@router.get("/profile", response_model=FarmerResponse)
def get_farmer_profile(current_user: dict = Depends(verify_farmer), db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.farmer_id == current_user["user_id"]).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer

@router.put("/profile", response_model=FarmerResponse)
def update_farmer_profile(
    farmer_in: FarmerUpdate,
    current_user: dict = Depends(verify_farmer),
    db: Session = Depends(get_db)
):
    farmer = db.query(Farmer).filter(Farmer.farmer_id == current_user["user_id"]).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    for field, value in farmer_in.dict(exclude_unset=True).items():
        setattr(farmer, field, value)
        
    db.commit()
    db.refresh(farmer)
    return farmer


# --- PRODUCT MANAGEMENT (CRUD) ---

@router.get("/products", response_model=List[ProductResponse])
def list_farmer_products(current_user: dict = Depends(verify_farmer), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.farmer_id == current_user["user_id"]).all()
    return products

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(
    product_in: ProductCreate,
    current_user: dict = Depends(verify_farmer),
    db: Session = Depends(get_db)
):
    db_product = Product(
        farmer_id=current_user["user_id"],
        name=product_in.name,
        category=product_in.category,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        image_url=product_in.image_url
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    current_user: dict = Depends(verify_farmer),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.farmer_id == current_user["user_id"]
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
        
    for field, value in product_in.dict(exclude_unset=True).items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: dict = Depends(verify_farmer),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.farmer_id == current_user["user_id"]
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
        
    db.delete(product)
    db.commit()
    return None


# --- ORDER TRACKING ---

@router.get("/orders", response_model=List[OrderResponse])
def get_incoming_orders(current_user: dict = Depends(verify_farmer), db: Session = Depends(get_db)):
    # Find orders containing this farmer's products
    farmer_id = current_user["user_id"]
    
    # We query orders that have at least one order_item belonging to a product of this farmer
    orders = db.query(Order).join(OrderItem).join(Product).filter(
        Product.farmer_id == farmer_id
    ).distinct().order_by(Order.created_at.desc()).all()
    
    # Preload and format output
    response_orders = []
    for order in orders:
        # Load only items belonging to this farmer
        farmer_items = [
            item for item in order.items 
            if item.product.farmer_id == farmer_id
        ]
        
        # Calculate portion of total price
        farmer_subtotal = sum(item.quantity * item.price for item in farmer_items)
        
        response_orders.append({
            "order_id": order.order_id,
            "buyer_id": order.buyer_id,
            "total_price": farmer_subtotal, # Show the farmer's earnings for this order
            "status": order.status,
            "created_at": order.created_at,
            "items": farmer_items,
            "buyer_name": order.buyer.name
        })
        
    return response_orders

@router.put("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_user: dict = Depends(verify_farmer),
    db: Session = Depends(get_db)
):
    # Verify the order contains this farmer's products
    farmer_id = current_user["user_id"]
    order = db.query(Order).join(OrderItem).join(Product).filter(
        Order.order_id == order_id,
        Product.farmer_id == farmer_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or contains no products from your farm")
        
    new_status = status_update.status.lower()
    if new_status not in ["pending", "confirmed", "shipped", "delivered"]:
        raise HTTPException(status_code=400, detail="Invalid order status")
        
    # Update status. This will trigger the MySQL AFTER UPDATE trigger!
    order.status = new_status
    db.commit()
    db.refresh(order)
    
    # Return formatted order items
    farmer_items = [
        item for item in order.items 
        if item.product.farmer_id == farmer_id
    ]
    farmer_subtotal = sum(item.quantity * item.price for item in farmer_items)
    
    return {
        "order_id": order.order_id,
        "buyer_id": order.buyer_id,
        "total_price": farmer_subtotal,
        "status": order.status,
        "created_at": order.created_at,
        "items": farmer_items,
        "buyer_name": order.buyer.name
    }
