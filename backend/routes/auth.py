# Authentication API routes

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.database import get_db
from backend.models import Farmer, Buyer
from backend.schemas import UserLogin, FarmerCreate, BuyerCreate, FarmerResponse, BuyerResponse, Token
from backend.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register/farmer", response_model=FarmerResponse, status_code=status.HTTP_201_CREATED)
def register_farmer(farmer_in: FarmerCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(Farmer).filter(Farmer.email == farmer_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered as a farmer"
        )
    
    # Check if buyer email exists
    existing_buyer = db.query(Buyer).filter(Buyer.email == farmer_in.email).first()
    if existing_buyer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is registered as a buyer"
        )
        
    hashed_password = get_password_hash(farmer_in.password)
    
    db_farmer = Farmer(
        email=farmer_in.email,
        password_hash=hashed_password,
        farm_name=farmer_in.farm_name,
        farm_details=farmer_in.farm_details,
        phone=farmer_in.phone
    )
    
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer


@router.post("/register/buyer", response_model=BuyerResponse, status_code=status.HTTP_201_CREATED)
def register_buyer(buyer_in: BuyerCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(Buyer).filter(Buyer.email == buyer_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered as a buyer"
        )
    
    # Check if farmer email exists
    existing_farmer = db.query(Farmer).filter(Farmer.email == buyer_in.email).first()
    if existing_farmer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is registered as a farmer"
        )
        
    hashed_password = get_password_hash(buyer_in.password)
    
    db_buyer = Buyer(
        email=buyer_in.email,
        password_hash=hashed_password,
        name=buyer_in.name,
        phone=buyer_in.phone,
        address=buyer_in.address
    )
    
    db.add(db_buyer)
    db.commit()
    db.refresh(db_buyer)
    return db_buyer


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # Validate based on role
    role = login_data.role.lower()
    email = login_data.email
    password = login_data.password
    
    user_id = 0
    name = ""
    
    if role == "farmer":
        farmer = db.query(Farmer).filter(Farmer.email == email).first()
        if not farmer or not verify_password(password, farmer.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect farmer email or password"
            )
        user_id = farmer.farmer_id
        name = farmer.farm_name
        
    elif role == "buyer":
        buyer = db.query(Buyer).filter(Buyer.email == email).first()
        if not buyer or not verify_password(password, buyer.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect buyer email or password"
            )
        user_id = buyer.buyer_id
        name = buyer.name
        
    elif role == "admin":
        # Static Admin credentials for DBMS student demo simplicity
        admin_email = "admin@market.com"
        admin_pass = "admin123"
        
        if email != admin_email or password != admin_pass:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect admin credentials"
            )
        user_id = 9999
        name = "Market Administrator"
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'farmer', 'buyer', or 'admin'"
        )
        
    # Create JWT Token
    access_token = create_access_token(
        data={"sub": email, "role": role, "user_id": user_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "user_id": user_id,
        "name": name
    }
