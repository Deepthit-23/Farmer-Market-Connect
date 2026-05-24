# Main FastAPI Application entry point

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import auth, farmer, buyer, admin, recommendations
from backend.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event: Launch the background WhatsApp polling worker
    print("[Main] Starting background WhatsApp polling scheduler...")
    start_scheduler()
    yield
    # Shutdown event
    print("[Main] Shutting down...")

app = FastAPI(
    title="Farmer Market Connect API",
    description="DBMS College Mini-Project full-stack backend leveraging MySQL triggers, self-joins, stored procedures, and audit logs.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React integration (port 5173 / 3000)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": "Farmer Market Connect",
        "db": "MySQL 8.0+",
        "features": [
            "Role-Based Access Control (Farmer / Buyer / Admin)",
            "AFTER UPDATE Triggers for Notification Queueing",
            "Jaccard Co-occurrence Basket Similarity Stored Procedures",
            "Audit Trail Logging"
        ]
    }

# Register Routers
app.include_router(auth.router)
app.include_router(farmer.router)
app.include_router(buyer.router)
app.include_router(admin.router)
app.include_router(recommendations.router)

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
