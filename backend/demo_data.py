from __future__ import annotations

from datetime import datetime


DEMO_FARMER = {
    "farmer_id": 1,
    "email": "john@farmer.com",
    "farm_name": "John's Organic Acres",
    "farm_details": "Specializing in heirloom vegetables and leafy greens.",
    "phone": "+918765432101",
    "market_id": 1,
    "preferred_language": "en",
    "created_at": datetime(2026, 5, 20, 10, 0, 0),
}


DEMO_PRODUCTS = [
    {
        "product_id": 1,
        "farmer_id": 1,
        "name": "Organic Red Tomatoes",
        "category": "Vegetables",
        "price": 2.50,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400",
        "created_at": datetime(2026, 5, 20, 10, 0, 0),
        "farmer_farm_name": "John's Organic Acres",
    },
    {
        "product_id": 2,
        "farmer_id": 1,
        "name": "Crisp Baby Spinach",
        "category": "Vegetables",
        "price": 3.00,
        "stock_quantity": 8,
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400",
        "created_at": datetime(2026, 5, 20, 10, 0, 0),
        "farmer_farm_name": "John's Organic Acres",
    },
    {
        "product_id": 10,
        "farmer_id": 1,
        "name": "Fresh Cucumbers",
        "category": "Vegetables",
        "price": 1.80,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400",
        "created_at": datetime(2026, 5, 24, 16, 0, 0),
        "farmer_farm_name": "John's Organic Acres",
    },
]


DEMO_ORDERS = [
    {
        "order_id": 101,
        "buyer_id": 1,
        "buyer_name": "Alice Smith",
        "total_price": 34.50,
        "status": "delivered",
        "created_at": datetime(2026, 5, 20, 10, 0, 0),
        "items": [
            {
                "order_item_id": 1,
                "product_id": 1,
                "quantity": 2,
                "price": 2.50,
                "product": DEMO_PRODUCTS[0],
            },
            {
                "order_item_id": 2,
                "product_id": 2,
                "quantity": 3,
                "price": 3.00,
                "product": DEMO_PRODUCTS[1],
            },
        ],
    },
    {
        "order_id": 102,
        "buyer_id": 2,
        "buyer_name": "Bob Jones",
        "total_price": 18.00,
        "status": "confirmed",
        "created_at": datetime(2026, 5, 24, 16, 0, 0),
        "items": [
            {
                "order_item_id": 3,
                "product_id": 10,
                "quantity": 5,
                "price": 1.80,
                "product": DEMO_PRODUCTS[2],
            },
        ],
    },
]


DEMO_TRENDS = {
    "income": {
        "weekly": [
            {"week_label": "Apr 07", "total": 420.0, "order_count": 4},
            {"week_label": "Apr 14", "total": 510.0, "order_count": 5},
            {"week_label": "Apr 21", "total": 680.0, "order_count": 6},
            {"week_label": "Apr 28", "total": 740.0, "order_count": 7},
            {"week_label": "May 05", "total": 820.0, "order_count": 8},
            {"week_label": "May 12", "total": 910.0, "order_count": 8},
            {"week_label": "May 19", "total": 1040.0, "order_count": 9},
            {"week_label": "May 26", "total": 1120.0, "order_count": 10},
        ],
        "monthly": [
            {"month_label": "Jun 2025", "total": 1800.0, "order_count": 18},
            {"month_label": "Jul 2025", "total": 2100.0, "order_count": 20},
            {"month_label": "Aug 2025", "total": 2400.0, "order_count": 22},
            {"month_label": "Sep 2025", "total": 2600.0, "order_count": 25},
            {"month_label": "Oct 2025", "total": 2950.0, "order_count": 26},
            {"month_label": "Nov 2025", "total": 3210.0, "order_count": 28},
            {"month_label": "Dec 2025", "total": 3580.0, "order_count": 30},
            {"month_label": "Jan 2026", "total": 3720.0, "order_count": 31},
            {"month_label": "Feb 2026", "total": 3890.0, "order_count": 33},
            {"month_label": "Mar 2026", "total": 4020.0, "order_count": 35},
            {"month_label": "Apr 2026", "total": 4350.0, "order_count": 37},
            {"month_label": "May 2026", "total": 4660.0, "order_count": 40},
        ],
    },
    "products": {
        "top_by_qty": [
            {"product_id": 2, "name": "Crisp Baby Spinach", "stock_quantity": 8, "total_quantity": 42, "total_revenue": 126.0, "price": 3.0},
            {"product_id": 1, "name": "Organic Red Tomatoes", "stock_quantity": 100, "total_quantity": 31, "total_revenue": 77.5, "price": 2.5},
            {"product_id": 10, "name": "Fresh Cucumbers", "stock_quantity": 5, "total_quantity": 28, "total_revenue": 50.4, "price": 1.8},
        ],
        "top_by_revenue": [
            {"product_id": 2, "name": "Crisp Baby Spinach", "stock_quantity": 8, "total_quantity": 42, "total_revenue": 126.0, "price": 3.0},
            {"product_id": 1, "name": "Organic Red Tomatoes", "stock_quantity": 100, "total_quantity": 31, "total_revenue": 77.5, "price": 2.5},
            {"product_id": 10, "name": "Fresh Cucumbers", "stock_quantity": 5, "total_quantity": 28, "total_revenue": 50.4, "price": 1.8},
        ],
        "low_stock": [
            {"product_id": 2, "name": "Crisp Baby Spinach", "stock_quantity": 8, "total_quantity": 42, "total_revenue": 126.0, "price": 3.0},
            {"product_id": 10, "name": "Fresh Cucumbers", "stock_quantity": 5, "total_quantity": 28, "total_revenue": 50.4, "price": 1.8},
        ],
    },
    "buyers": {
        "monthly": [
            {"month": "Dec 2025", "repeat_buyers": 4, "new_buyers": 5},
            {"month": "Jan 2026", "repeat_buyers": 5, "new_buyers": 4},
            {"month": "Feb 2026", "repeat_buyers": 6, "new_buyers": 5},
            {"month": "Mar 2026", "repeat_buyers": 6, "new_buyers": 6},
            {"month": "Apr 2026", "repeat_buyers": 7, "new_buyers": 6},
            {"month": "May 2026", "repeat_buyers": 8, "new_buyers": 7},
        ]
    },
}
