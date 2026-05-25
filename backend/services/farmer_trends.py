from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


def _range_start(range_key: str) -> datetime:
    if range_key == "90d":
        return datetime.utcnow() - timedelta(days=90)
    if range_key == "1y":
        return datetime.utcnow() - timedelta(days=365)
    return datetime.utcnow() - timedelta(days=30)


def _month_start(value: date) -> date:
    return value.replace(day=1)


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


def _decimalize(value: Any) -> Decimal:
    if value is None:
        return Decimal("0.00")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def get_farmer_income_trends(db: Session, farmer_id: int, range_key: str = "30d") -> dict:
    range_start = _range_start(range_key)

    weekly_rows = db.execute(
        text(
            """
            SELECT
                DATE_FORMAT(DATE_SUB(DATE(o.created_at), INTERVAL WEEKDAY(o.created_at) DAY), '%Y-%m-%d') AS week_start,
                DATE_FORMAT(DATE_SUB(DATE(o.created_at), INTERVAL WEEKDAY(o.created_at) DAY), '%b %d') AS week_label,
                SUM(oi.quantity * oi.price) AS total,
                COUNT(DISTINCT o.order_id) AS order_count
            FROM `ORDER` o
            JOIN ORDER_ITEM oi ON oi.order_id = o.order_id
            JOIN PRODUCT p ON p.product_id = oi.product_id
            WHERE p.farmer_id = :farmer_id
              AND o.created_at >= :range_start
            GROUP BY week_start, week_label
            ORDER BY week_start ASC
            """
        ),
        {"farmer_id": farmer_id, "range_start": range_start},
    ).mappings().all()

    monthly_rows = db.execute(
        text(
            """
            SELECT
                DATE_FORMAT(o.created_at, '%Y-%m-01') AS month_start,
                DATE_FORMAT(o.created_at, '%b %Y') AS month_label,
                SUM(oi.quantity * oi.price) AS total,
                COUNT(DISTINCT o.order_id) AS order_count
            FROM `ORDER` o
            JOIN ORDER_ITEM oi ON oi.order_id = o.order_id
            JOIN PRODUCT p ON p.product_id = oi.product_id
            WHERE p.farmer_id = :farmer_id
              AND o.created_at >= :range_start
            GROUP BY month_start, month_label
            ORDER BY month_start ASC
            """
        ),
        {"farmer_id": farmer_id, "range_start": range_start},
    ).mappings().all()

    weekly_map = {row["week_start"]: row for row in weekly_rows}
    monthly_map = {row["month_start"]: row for row in monthly_rows}

    current_week = _week_start(datetime.utcnow().date())
    weekly = []
    for offset in range(7, -1, -1):
        week_date = current_week - timedelta(days=offset * 7)
        week_key = week_date.strftime("%Y-%m-%d")
        weekly.append(
            {
                "week_label": week_date.strftime("%b %d"),
                "total": _decimalize(weekly_map.get(week_key, {}).get("total")),
                "order_count": int(weekly_map.get(week_key, {}).get("order_count") or 0),
            }
        )

    current_month = _month_start(datetime.utcnow().date())
    monthly = []
    for offset in range(11, -1, -1):
        month_date = _add_months(current_month, -offset)
        month_key = month_date.strftime("%Y-%m-01")
        monthly.append(
            {
                "month_label": month_date.strftime("%b %Y"),
                "total": _decimalize(monthly_map.get(month_key, {}).get("total")),
                "order_count": int(monthly_map.get(month_key, {}).get("order_count") or 0),
            }
        )

    return {"weekly": weekly, "monthly": monthly}


def get_farmer_product_trends(db: Session, farmer_id: int, range_key: str = "30d") -> dict:
    range_start = _range_start(range_key)

    top_qty_rows = db.execute(
        text(
            """
            SELECT
                p.product_id,
                p.name,
                p.stock_quantity,
                SUM(oi.quantity) AS total_quantity,
                SUM(oi.quantity * oi.price) AS total_revenue
            FROM `ORDER` o
            JOIN ORDER_ITEM oi ON oi.order_id = o.order_id
            JOIN PRODUCT p ON p.product_id = oi.product_id
            WHERE p.farmer_id = :farmer_id
              AND o.created_at >= :range_start
            GROUP BY p.product_id, p.name, p.stock_quantity
            ORDER BY total_quantity DESC, total_revenue DESC, p.name ASC
            LIMIT 5
            """
        ),
        {"farmer_id": farmer_id, "range_start": range_start},
    ).mappings().all()

    top_revenue_rows = db.execute(
        text(
            """
            SELECT
                p.product_id,
                p.name,
                p.stock_quantity,
                SUM(oi.quantity) AS total_quantity,
                SUM(oi.quantity * oi.price) AS total_revenue
            FROM `ORDER` o
            JOIN ORDER_ITEM oi ON oi.order_id = o.order_id
            JOIN PRODUCT p ON p.product_id = oi.product_id
            WHERE p.farmer_id = :farmer_id
              AND o.created_at >= :range_start
            GROUP BY p.product_id, p.name, p.stock_quantity
            ORDER BY total_revenue DESC, total_quantity DESC, p.name ASC
            LIMIT 5
            """
        ),
        {"farmer_id": farmer_id, "range_start": range_start},
    ).mappings().all()

    low_stock_rows = db.execute(
        text(
            """
            SELECT
                p.product_id,
                p.name,
                p.stock_quantity,
                p.price
            FROM PRODUCT p
            WHERE p.farmer_id = :farmer_id
              AND p.stock_quantity < 10
            ORDER BY p.stock_quantity ASC, p.name ASC
            """
        ),
        {"farmer_id": farmer_id},
    ).mappings().all()

    def _serialize(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "product_id": int(row["product_id"]),
                "name": row["name"],
                "stock_quantity": int(row["stock_quantity"] or 0),
                "total_quantity": int(row.get("total_quantity") or 0),
                "total_revenue": _decimalize(row.get("total_revenue")),
                "price": _decimalize(row.get("price")),
            }
            for row in rows
        ]

    return {
        "top_by_qty": _serialize(top_qty_rows),
        "top_by_revenue": _serialize(top_revenue_rows),
        "low_stock": _serialize(low_stock_rows),
    }


def get_farmer_buyer_trends(db: Session, farmer_id: int, range_key: str = "30d") -> dict:
    range_start = _range_start(range_key)

    rows = db.execute(
        text(
            """
            WITH farmer_orders AS (
                SELECT DISTINCT o.order_id, o.buyer_id, o.created_at
                FROM `ORDER` o
                JOIN ORDER_ITEM oi ON oi.order_id = o.order_id
                JOIN PRODUCT p ON p.product_id = oi.product_id
                WHERE p.farmer_id = :farmer_id
            ),
            first_orders AS (
                SELECT buyer_id, MIN(created_at) AS first_order_at
                FROM farmer_orders
                GROUP BY buyer_id
            )
            SELECT
                fo.buyer_id,
                DATE_FORMAT(fo.created_at, '%Y-%m-01') AS month_start,
                DATE_FORMAT(fo.created_at, '%b %Y') AS month_label,
                DATE_FORMAT(first_orders.first_order_at, '%Y-%m-01') AS first_month_start
            FROM farmer_orders fo
            JOIN first_orders ON first_orders.buyer_id = fo.buyer_id
            WHERE fo.created_at >= :range_start
            GROUP BY fo.buyer_id, month_start, month_label, first_month_start
            ORDER BY month_start ASC, fo.buyer_id ASC
            """
        ),
        {"farmer_id": farmer_id, "range_start": range_start},
    ).mappings().all()

    monthly_buckets: dict[str, dict[str, Any]] = defaultdict(lambda: {"repeat_buyers": 0, "new_buyers": 0})
    month_labels: dict[str, str] = {}

    for row in rows:
        month_start = row["month_start"]
        month_labels[month_start] = row["month_label"]
        is_new = row["month_start"] == row["first_month_start"]
        bucket = monthly_buckets[month_start]
        if is_new:
            bucket["new_buyers"] += 1
        else:
            bucket["repeat_buyers"] += 1

    current_month = _month_start(datetime.utcnow().date())
    monthly = []
    for offset in range(5, -1, -1):
        month_date = _add_months(current_month, -offset)
        month_key = month_date.strftime("%Y-%m-01")
        monthly.append(
            {
                "month": month_labels.get(month_key, month_date.strftime("%b %Y")),
                "repeat_buyers": int(monthly_buckets[month_key]["repeat_buyers"]),
                "new_buyers": int(monthly_buckets[month_key]["new_buyers"]),
            }
        )

    return {"monthly": monthly}