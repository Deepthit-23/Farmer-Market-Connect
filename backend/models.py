# SQLAlchemy models mapping to database tables

from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.database import Base

class Market(Base):
    __tablename__ = 'MARKET'

    market_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    open_days = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    farmers = relationship("Farmer", back_populates="market")


class Buyer(Base):
    __tablename__ = 'BUYER'

    buyer_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text)
    preferred_language = Column(String(10), nullable=False, server_default=text('\'en\''))
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    orders = relationship("Order", back_populates="buyer", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="buyer", cascade="all, delete-orphan")
    recommendations = relationship("BuyerRecommendation", back_populates="buyer", cascade="all, delete-orphan")


class Farmer(Base):
    __tablename__ = 'FARMER'

    farmer_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    farm_name = Column(String(100), nullable=False)
    farm_details = Column(Text)
    phone = Column(String(20), nullable=False)
    market_id = Column(Integer, ForeignKey('MARKET.market_id', ondelete='SET NULL'))
    preferred_language = Column(String(10), nullable=False, server_default=text('\'en\''))
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    market = relationship("Market", back_populates="farmers")
    products = relationship("Product", back_populates="farmer", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = 'PRODUCT'

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey('FARMER.farmer_id', ondelete='CASCADE'), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False)
    image_url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    farmer = relationship("Farmer", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = 'ORDER'

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_id = Column(Integer, ForeignKey('BUYER.buyer_id', ondelete='CASCADE'), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, server_default='pending')
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    buyer = relationship("Buyer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    notifications = relationship("NotificationQueue", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = 'ORDER_ITEM'

    order_item_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('ORDER.order_id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Integer, ForeignKey('PRODUCT.product_id', ondelete='CASCADE'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Review(Base):
    __tablename__ = 'REVIEW'

    review_id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_id = Column(Integer, ForeignKey('BUYER.buyer_id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Integer, ForeignKey('PRODUCT.product_id', ondelete='CASCADE'), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    buyer = relationship("Buyer", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")


class NotificationQueue(Base):
    __tablename__ = 'NOTIFICATION_QUEUE'

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey('ORDER.order_id', ondelete='CASCADE'), nullable=False)
    phone = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default='pending')
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    # Relationships
    order = relationship("Order", back_populates="notifications")


class NotificationTriggerLog(Base):
    __tablename__ = 'NOTIFICATION_TRIGGER_LOG'

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    trigger_name = Column(String(100), nullable=False)
    action_type = Column(String(20), nullable=False)
    record_id = Column(Integer, nullable=False)
    details = Column(Text)
    fired_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))


class ProductSimilarity(Base):
    __tablename__ = 'PRODUCT_SIMILARITY'

    product_id_1 = Column(Integer, ForeignKey('PRODUCT.product_id', ondelete='CASCADE'), primary_key=True)
    product_id_2 = Column(Integer, ForeignKey('PRODUCT.product_id', ondelete='CASCADE'), primary_key=True)
    similarity_score = Column(Numeric(5, 4), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))


class BuyerRecommendation(Base):
    __tablename__ = 'BUYER_RECOMMENDATION'

    buyer_id = Column(Integer, ForeignKey('BUYER.buyer_id', ondelete='CASCADE'), primary_key=True)
    product_id = Column(Integer, ForeignKey('PRODUCT.product_id', ondelete='CASCADE'), primary_key=True)
    score = Column(Numeric(5, 4), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))

    # Relationships
    buyer = relationship("Buyer", back_populates="recommendations")
    product = relationship("Product")
