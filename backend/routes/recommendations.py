# Recommendations API routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from backend.database import get_db
from backend.models import BuyerRecommendation, Product
from backend.schemas import RecommendationResponse, ProductResponse
from backend.auth import get_current_user, verify_buyer

router = APIRouter(prefix="/api/recommendations", tags=["Recommendation Engine"])

@router.post("/compute", status_code=200)
def trigger_similarity_computation(db: Session = Depends(get_db)):
    """
    Executes the DB Stored Procedure compute_product_similarity()
    to analyze transactions via a self-join and update product pairings.
    """
    try:
        db.execute(text("CALL compute_product_similarity()"))
        db.commit()
        return {"status": "success", "message": "Product similarity co-occurrences successfully computed."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database stored procedure failed: {e}")


@router.get("/buyer", response_model=List[RecommendationResponse])
def get_personalized_recommendations(
    current_user: dict = Depends(verify_buyer),
    db: Session = Depends(get_db)
):
    """
    Executes generate_recommendations(buyer_id) stored procedure and
    retrieves customized recommendations from the BUYER_RECOMMENDATION table.
    """
    buyer_id = current_user["user_id"]
    try:
        # 1. Update recommendation scores for the specific buyer
        db.execute(text(f"CALL generate_recommendations({buyer_id})"))
        db.commit()
        
        # 2. Fetch the recommendations
        recs = db.query(BuyerRecommendation).filter(
            BuyerRecommendation.buyer_id == buyer_id
        ).order_by(BuyerRecommendation.score.desc()).all()
        
        # Format output
        response = []
        for r in recs:
            p = r.product
            if p:
                response.append({
                    "score": r.score,
                    "product": {
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
                })
        
        # 3. Fallback: If no recommendations (e.g. buyer hasn't made any purchases yet),
        # return top products with dummy scores so the UI looks active
        if not response:
            top_products = db.query(Product).order_by(Product.price.desc()).limit(3).all()
            for p in top_products:
                response.append({
                    "score": 0.5000, # Mock baseline score
                    "product": {
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
                })
                
        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to load recommendations: {e}")
