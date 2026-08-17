"""Idempotent seed script — creates demo data for local development.

Usage:
    cd backend
    python seed.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime, timezone, timedelta

from app import create_app
from extensions import db
from models import Ingredient, InventoryItem, StockMovement, PreparationInventory

INGREDIENTS = [
    ("Vodka", "alcoholic"),
    ("Rum", "alcoholic"),
    ("Gin", "alcoholic"),
    ("Tequila", "alcoholic"),
    ("Whiskey", "alcoholic"),
    ("Cola", "non-alcoholic"),
    ("Soda Water", "non-alcoholic"),
    ("Tonic Water", "non-alcoholic"),
    ("Orange Juice", "non-alcoholic"),
    ("Cranberry Juice", "non-alcoholic"),
    ("Lemon", "fruits"),
    ("Lime", "fruits"),
    ("Orange", "fruits"),
    ("Strawberry", "fruits"),
    ("Ice", "non-perishable"),
    ("Salt", "non-perishable"),
    ("Sugar", "non-perishable"),
    ("Simple Syrup", "non-perishable"),
    ("Grenadine Syrup", "non-perishable"),
    ("Cocktail Napkins", "other"),
]

# (ingredient_name, stock/par, quantity) — quantity <= stock means low-stock
INVENTORY = [
    ("Vodka", 10, 25),
    ("Rum", 10, 18),
    ("Gin", 8, 12),
    ("Tequila", 8, 5),       # low stock
    ("Whiskey", 10, 10),     # at par — low stock
    ("Cola", 20, 45),
    ("Soda Water", 15, 30),
    ("Tonic Water", 15, 8),  # low stock
    ("Orange Juice", 10, 22),
    ("Cranberry Juice", 10, 14),
    ("Lemon", 12, 20),
    ("Lime", 12, 6),         # low stock
    ("Orange", 10, 15),
    ("Strawberry", 8, 10),   # at par — low stock
    ("Ice", 5, 50),
    ("Salt", 3, 10),
    ("Sugar", 5, 12),
    ("Simple Syrup", 5, 8),
    ("Grenadine Syrup", 5, 4),  # low stock
    ("Cocktail Napkins", 10, 30),
]


def seed():
    app = create_app("development")
    with app.app_context():
        db.create_all()

        # --- Ingredients (skip existing) ---
        ingredient_map = {}
        for name, itype in INGREDIENTS:
            existing = Ingredient.query.filter_by(name=name).first()
            if existing:
                ingredient_map[name] = existing
            else:
                ing = Ingredient(name=name, ingredient_type=itype)
                db.session.add(ing)
                db.session.flush()
                ingredient_map[name] = ing

        # --- Inventory items (skip if ingredient already has an item) ---
        item_map = {}
        for name, stock, quantity in INVENTORY:
            ing = ingredient_map[name]
            existing = InventoryItem.query.filter_by(ingredient_id=ing.id).first()
            if existing:
                item_map[name] = existing
            else:
                item = InventoryItem(
                    ingredient_id=ing.id,
                    stock=stock,
                    quantity=quantity,
                )
                db.session.add(item)
                db.session.flush()
                item_map[name] = item

        # --- Stock movements (only add if none exist yet) ---
        if StockMovement.query.count() == 0:
            now = datetime.now(timezone.utc)
            movements = [
                ("Vodka", "in", 10, "Initial restock", now - timedelta(days=3)),
                ("Vodka", "out", 5, "Event prep", now - timedelta(days=2)),
                ("Rum", "in", 8, "Weekly delivery", now - timedelta(days=2)),
                ("Cola", "in", 20, "Bulk purchase", now - timedelta(days=1)),
                ("Cola", "out", 10, "Friday event", now - timedelta(hours=6)),
                ("Lemon", "in", 12, "Market run", now - timedelta(hours=4)),
                ("Gin", "out", 3, "Cocktail night", now - timedelta(hours=2)),
            ]
            for name, mtype, qty, note, ts in movements:
                item = item_map.get(name)
                if item:
                    db.session.add(
                        StockMovement(
                            item_id=item.id,
                            movement_type=mtype,
                            quantity=qty,
                            note=note,
                            created_at=ts,
                        )
                    )

        # --- Preparation transfers (only add if none exist yet) ---
        if PreparationInventory.query.count() == 0:
            today = date.today()
            transfers = [
                ("Vodka", 5, today + timedelta(days=2)),
                ("Cola", 10, today + timedelta(days=2)),
            ]
            for name, qty, bdate in transfers:
                item = item_map.get(name)
                if item:
                    db.session.add(
                        PreparationInventory(
                            source_item_id=item.id,
                            product_name=name,
                            quantity=qty,
                            booking_date=bdate,
                        )
                    )

        db.session.commit()
        print("Seed complete.")
        print(f"  Ingredients: {Ingredient.query.count()}")
        print(f"  Inventory items: {InventoryItem.query.count()}")
        print(f"  Stock movements: {StockMovement.query.count()}")
        print(f"  Preparation transfers: {PreparationInventory.query.count()}")
        low = sum(1 for i in InventoryItem.query.all() if i.is_low_stock)
        print(f"  Low-stock items: {low}")


if __name__ == "__main__":
    seed()
