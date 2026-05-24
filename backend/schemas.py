# Pydantic schemas for data validation and serialization

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# --- TOKEN & AUTHENTICATION ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


# --- MARKET ---
class MarketBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    location: str = Field(..., min_length=2, max_length=255)
    open_days: str = Field(..., description="Days open, e.g. 'Sat, Sun'")

class MarketCreate(MarketBase):
    pass

class MarketResponse(MarketBase):
    market_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- FARMER ---
class FarmerBase(BaseModel):
    email: EmailStr
    farm_name: str = Field(..., min_length=2, max_length=100)
    farm_details: Optional[str] = None
    phone: str = Field(..., description="Contact number")

class FarmerCreate(FarmerBase):
    password: str = Field(..., min_length=6)

class FarmerUpdate(BaseModel):
    farm_name: Optional[str] = None
    farm_details: Optional[str] = None
    phone: Optional[str] = None
    market_id: Optional[int] = None

class FarmerResponse(FarmerBase):
    farmer_id: int
    market_id: Optional[int] = None
    created_at: datetime
    market: Optional[MarketResponse] = None

    class Config:
        from_attributes = True


# --- BUYER ---
class BuyerBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., description="WhatsApp-compatible phone number")
    address: Optional[str] = None

class BuyerCreate(BuyerBase):
    password: str = Field(..., min_length=6)

class BuyerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class BuyerResponse(BuyerBase):
    buyer_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- LOGIN ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(..., description="Role must be 'farmer', 'buyer', or 'admin'")


# --- PRODUCT ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=50)
    price: Decimal = Field(..., ge=0.0)
    stock_quantity: int = Field(..., ge=0)
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    product_id: int
    farmer_id: int
    created_at: datetime
    farmer_farm_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- REVIEW ---
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    product_id: int

class ReviewResponse(ReviewBase):
    review_id: int
    buyer_id: int
    product_id: int
    created_at: datetime
    buyer_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- ORDER ITEM ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)

class OrderItemResponse(BaseModel):
    order_item_id: int
    product_id: int
    quantity: int
    price: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


# --- ORDER ---
class OrderCreate(BaseModel):
    items: List[OrderItemBase]

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="pending, confirmed, shipped, or delivered")

class OrderResponse(BaseModel):
    order_id: int
    buyer_id: int
    total_price: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemResponse] = []
    buyer_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- STATISTICS & ANALYTICS ---
class AdminStats(BaseModel):
    total_markets: int
    total_farmers: int
    total_buyers: int
    total_orders: int
    total_revenue: Decimal
    status_distribution: dict

# --- RECOMMENDATION ---
class RecommendationResponse(BaseModel):
    product: ProductResponse
    score: Decimal

    class Config:
        from_attributes = True
