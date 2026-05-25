# Buyer API routes

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from decimal import Decimal
from backend.database import get_db
from backend.models import Buyer, Product, Order, OrderItem, Review, Farmer
from backend.schemas import ProductResponse, OrderCreate, OrderResponse, BuyerResponse, BuyerUpdate, ReviewCreate, ReviewResponse
from backend.auth import get_current_user, verify_buyer
from app.i18n import get_text
from backend.schemas import LanguageUpdate

router = APIRouter(prefix="/api/buyer", tags=["Buyer Portal"])

# --- BUYER PROFILE ---

@router.get("/profile", response_model=BuyerResponse)
def get_buyer_profile(current_user: dict = Depends(verify_buyer), db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.buyer_id == current_user["user_id"]).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return buyer

@router.put("/profile", response_model=BuyerResponse)
def update_buyer_profile(
    buyer_in: BuyerUpdate,
    current_user: dict = Depends(verify_buyer),
    db: Session = Depends(get_db)
):
    buyer = db.query(Buyer).filter(Buyer.buyer_id == current_user["user_id"]).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    for field, value in buyer_in.dict(exclude_unset=True).items():
        setattr(buyer, field, value)
        
    db.commit()
    db.refresh(buyer)
    return buyer


# --- PRODUCT CATALOG (FEED) ---

@router.get("/products", response_model=List[ProductResponse])
def get_products_feed(
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    
    # 1. Search filter (matches name or category)
    if search:
        query = query.filter(
            or_(
                Product.name.like(f"%{search}%"),
                Product.category.like(f"%{search}%")
            )
        )
        
    # 2. Category filter
    if category and category != "All":
        query = query.filter(Product.category == category)
        
    # 3. Price filter
    if min_price is not None:
        query = query.filter(Product.price >= Decimal(str(min_price)))
    if max_price is not None:
        query = query.filter(Product.price <= Decimal(str(max_price)))
        
    products = query.all()
    
    # Format and inject farm names
    response_products = []
    for p in products:
        response_products.append({
            "product_id": p.product_id,
            "farmer_id": p.farmer_id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "stock_quantity": p.stock_quantity,
            "image_url": p.image_url,
            "created_at": p.created_at,
            "farmer_farm_name": p.farmer.farm_name if p.farmer else "Local Farm"
        })
        
    return response_products

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product_details(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.product_id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return {
        "product_id": p.product_id,
        "farmer_id": p.farmer_id,
        "name": p.name,
        "category": p.category,
        "price": p.price,
        "stock_quantity": p.stock_quantity,
        "image_url": p.image_url,
        "created_at": p.created_at,
        "farmer_farm_name": p.farmer.farm_name if p.farmer else "Local Farm"
    }


# --- CART & ORDERING ---

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    request: Request,
    current_user: dict = Depends(verify_buyer),
    db: Session = Depends(get_db)
):
    buyer_id = current_user["user_id"]
    
    if not order_in.items:
        lang = getattr(request.state, "lang", "en")
        raise HTTPException(status_code=400, detail=get_text("errors.validation_error", lang, detail="Cart cannot be empty"))
        
    total_price = Decimal("0.00")
    order_items_to_create = []
    
    for item in order_in.items:
        # Check product existence and stock
        product = db.query(Product).filter(Product.product_id == item.product_id).first()
        if not product:
            lang = getattr(request.state, "lang", "en")
            raise HTTPException(status_code=404, detail=get_text("errors.not_found", lang))
            
        if product.stock_quantity < item.quantity:
            lang = getattr(request.state, "lang", "en")
            raise HTTPException(
                status_code=400,
                detail=get_text("product.out_of_stock", lang, name=product.name)
            )
            
        # Deduct stock
        product.stock_quantity -= item.quantity
        
        # Calculate pricing
        item_total = product.price * item.quantity
        total_price += item_total
        
        # Stash details for creation
        oi = OrderItem(
            product_id=product.product_id,
            quantity=item.quantity,
            price=product.price
        )
        order_items_to_create.append(oi)
        
    # Create the main Order record
    db_order = Order(
        buyer_id=buyer_id,
        total_price=total_price,
        status="pending"
    )
    
    db.add(db_order)
    db.commit() # Save to generate order_id
    
    # Assign order ID to items and save them
    for oi in order_items_to_create:
        oi.order_id = db_order.order_id
        db.add(oi)
        
    db.commit()
    db.refresh(db_order)
    
    # Auto-generate recommendations in the database asynchronously for student convenience
    try:
        # Check if they have other orders and compute
        # We can call similarity and recommendation generation so that the user immediately sees updated recommendations
        db.execute(text("CALL compute_product_similarity()"))
        db.execute(text(f"CALL generate_recommendations({buyer_id})"))
        db.commit()
    except Exception as rec_err:
        # Non-blocking, continue even if recommendation stored procedures fail
        print(f"[Order Placement] Recommendation system auto-trigger warning: {rec_err}")
        
    return db_order


@router.patch("/language", response_model=BuyerResponse)
def set_buyer_language(
    payload: LanguageUpdate,
    current_user: dict = Depends(verify_buyer),
    db: Session = Depends(get_db)
):
    lang = payload.language if payload.language in ["en", "hi", "kn", "ta"] else "en"
    buyer = db.query(Buyer).filter(Buyer.buyer_id == current_user["user_id"]).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    buyer.preferred_language = lang
    db.commit()
    db.refresh(buyer)
    return buyer


# --- ORDER HISTORY ---

@router.get("/orders", response_model=List[OrderResponse])
def get_order_history(current_user: dict = Depends(verify_buyer), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.buyer_id == current_user["user_id"]).order_by(Order.created_at.desc()).all()
    
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
            "buyer_name": o.buyer.name
        })
        
    return response_orders


# --- PRODUCT REVIEWS ---

@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: ReviewCreate,
    current_user: dict = Depends(verify_buyer),
    db: Session = Depends(get_db)
):
    buyer_id = current_user["user_id"]
    
    # Check if product exists
    product = db.query(Product).filter(Product.product_id == review_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check if already reviewed
    existing = db.query(Review).filter(
        Review.buyer_id == buyer_id,
        Review.product_id == review_in.product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
        
    db_review = Review(
        buyer_id=buyer_id,
        product_id=review_in.product_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    return {
        "review_id": db_review.review_id,
        "buyer_id": db_review.buyer_id,
        "product_id": db_review.product_id,
        "rating": db_review.rating,
        "comment": db_review.comment,
        "created_at": db_review.created_at,
        "buyer_name": db_review.buyer.name
    }

@router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    
    response = []
    for r in reviews:
        response.append({
            "review_id": r.review_id,
            "buyer_id": r.buyer_id,
            "product_id": r.product_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "buyer_name": r.buyer.name if r.buyer else "Anonymous"
        })
    return response

# Custom import for running raw procedures
from sqlalchemy import text
