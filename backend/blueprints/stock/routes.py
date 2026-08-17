"""Stock in / stock out API against existing inventory items."""

from flask import Blueprint, jsonify, request

from extensions import db
from models import InventoryItem, Ingredient, StockMovement

stock_bp = Blueprint("stock", __name__)


@stock_bp.route("/", methods=["GET"])
def index():
    items = InventoryItem.query.join(Ingredient).order_by(Ingredient.name).all()
    recent_movements = StockMovement.query.order_by(StockMovement.created_at.desc()).limit(20).all()
    return jsonify(
        items=[
            {
                "id": item.id,
                "product_name": item.product_name,
                "category": item.category,
                "quantity": item.quantity,
                "stock": item.stock,
                "is_low_stock": item.is_low_stock,
            }
            for item in items
        ],
        recent_movements=[
            {
                "id": m.id,
                "item_id": m.item_id,
                "product_name": m.item.product_name if m.item else "",
                "movement_type": m.movement_type,
                "type_label": m.type_label,
                "quantity": m.quantity,
                "note": m.note,
                "created_at": m.created_at.isoformat(),
            }
            for m in recent_movements
        ],
    )


@stock_bp.route("/<int:item_id>/in", methods=["POST"])
def stock_in(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json(force=True)
    quantity = data.get("quantity")
    note = (data.get("note") or "").strip()

    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify(error="Enter a stock-in quantity greater than zero."), 400

    item.quantity += quantity
    db.session.add(
        StockMovement(item_id=item.id, movement_type="in", quantity=quantity, note=note or None)
    )
    db.session.commit()
    return jsonify(
        message=f"Stocked in {quantity} unit(s) of {item.product_name}.",
        item_id=item.id,
        new_quantity=item.quantity,
    ), 200


@stock_bp.route("/<int:item_id>/out", methods=["POST"])
def stock_out(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json(force=True)
    quantity = data.get("quantity")
    note = (data.get("note") or "").strip()

    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify(error="Enter a stock-out quantity greater than zero."), 400

    if quantity > item.quantity:
        return jsonify(
            error=f"Can't stock out {quantity} — only {item.quantity} of {item.product_name} on hand."
        ), 400

    item.quantity -= quantity
    db.session.add(
        StockMovement(item_id=item.id, movement_type="out", quantity=quantity, note=note or None)
    )
    db.session.commit()
    return jsonify(
        message=f"Stocked out {quantity} unit(s) of {item.product_name}.",
        item_id=item.id,
        new_quantity=item.quantity,
    ), 200
