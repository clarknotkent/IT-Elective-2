from datetime import datetime, date, timezone

from extensions import db

# Choices are kept as plain tuples (rather than a separate lookup table)
# so the slug and its display label travel together in the JSON payload
# without an extra query.
INGREDIENT_TYPES = [
    ("alcoholic", "Alcoholic"),
    ("non-alcoholic", "Non-Alcoholic"),
    ("fruits", "Fruits"),
    ("non-perishable", "Non-Perishable"),
    ("other", "Other"),
]

MOVEMENT_TYPES = [
    ("in", "Stock In"),
    ("out", "Stock Out"),
]


class Ingredient(db.Model):
    """The ingredient catalog. One row per distinct ingredient/product the
    bar stocks, independent of how much of it is currently on hand.

    Originally its own module (Ingredient List / PyFinalProj) with a
    stock-in date and time on every row. Those two columns didn't belong on
    a catalog table (stock-in is an event, not a fixed attribute), so that
    concept moved to StockMovement and this table now only describes the
    ingredient itself.
    """

    __tablename__ = "ingredients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    ingredient_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    inventory_items = db.relationship(
        "InventoryItem", back_populates="ingredient", cascade="all, delete-orphan"
    )

    @property
    def type_label(self):
        return dict(INGREDIENT_TYPES).get(self.ingredient_type, self.ingredient_type)

    def __repr__(self):
        return f"<Ingredient {self.name}>"


class InventoryItem(db.Model):
    """A stocked quantity of an ingredient in the main inventory.

    `stock` is the reorder/par level used for the low-stock check in the
    use-case diagram; `quantity` is what's actually on hand right now.
    """

    __tablename__ = "inventory_items"

    id = db.Column(db.Integer, primary_key=True)
    ingredient_id = db.Column(
        db.Integer, db.ForeignKey("ingredients.id"), nullable=False
    )
    stock = db.Column(db.Integer, nullable=False, default=0)  # par / reorder level
    quantity = db.Column(db.Integer, nullable=False, default=0)  # on-hand quantity
    event_date = db.Column(db.Date, nullable=True)
    location = db.Column(db.String(100), nullable=True)

    ingredient = db.relationship("Ingredient", back_populates="inventory_items")
    movements = db.relationship(
        "StockMovement", back_populates="item", cascade="all, delete-orphan",
        order_by="StockMovement.created_at.desc()",
    )
    preparation_transfers = db.relationship(
        "PreparationInventory", back_populates="source_item"
    )

    @property
    def product_name(self):
        return self.ingredient.name if self.ingredient else ""

    @property
    def category(self):
        return self.ingredient.type_label if self.ingredient else ""

    @property
    def is_low_stock(self):
        return self.quantity <= self.stock

    def __repr__(self):
        return f"<InventoryItem {self.product_name} qty={self.quantity}>"


class StockMovement(db.Model):
    """An audit-trail row for every stock-in / stock-out action.

    This replaces the original Stock-in_Stock-out module's in-memory Python
    list, which lost all data on every restart. Movements are now the
    source of truth: InventoryItem.quantity is derived by applying them.
    """

    __tablename__ = "stock_movements"

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_items.id"), nullable=False)
    movement_type = db.Column(db.String(3), nullable=False)  # 'in' or 'out'
    quantity = db.Column(db.Integer, nullable=False)
    note = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    item = db.relationship("InventoryItem", back_populates="movements")

    @property
    def type_label(self):
        return dict(MOVEMENT_TYPES).get(self.movement_type, self.movement_type)

    def __repr__(self):
        return f"<StockMovement {self.movement_type} {self.quantity} item={self.item_id}>"


class PreparationInventory(db.Model):
    """Items transferred out of the main inventory for a specific booking
    date, per the Preparation Inventory use case. Unused items are
    transferred back (see blueprints/preparation/routes.py); used, broken,
    or lost items are deducted directly.
    """

    __tablename__ = "preparation_inventory"

    id = db.Column(db.Integer, primary_key=True)
    source_item_id = db.Column(
        db.Integer, db.ForeignKey("inventory_items.id"), nullable=True
    )
    product_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    booking_date = db.Column(db.Date, nullable=False, default=date.today)
    transferred_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    source_item = db.relationship("InventoryItem", back_populates="preparation_transfers")

    def __repr__(self):
        return f"<PreparationInventory {self.product_name} qty={self.quantity}>"
