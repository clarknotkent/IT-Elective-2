"""Main inventory API: CRUD and transfer to preparation."""

from datetime import datetime

from flask import Blueprint, jsonify, request

from extensions import db
from models import InventoryItem, Ingredient, PreparationInventory

inventory_bp = Blueprint("inventory", __name__)


def _serialize(item):
    return {
        "id": item.id,
        "product_name": item.product_name,
        "category": item.category,
        "ingredient_id": item.ingredient_id,
        "quantity": item.quantity,
        "stock": item.stock,
        "event_date": item.event_date.isoformat() if item.event_date else None,
        "location": item.location,
        "is_low_stock": item.is_low_stock,
    }


@inventory_bp.route("/", methods=["GET"])
def index():
    search_query = request.args.get("search", "").strip()
    query = InventoryItem.query.join(Ingredient)
    if search_query:
        like = f"%{search_query}%"
        query = query.filter(
            Ingredient.name.ilike(like) | Ingredient.ingredient_type.ilike(like)
        )
    items = query.order_by(Ingredient.name).all()
    return jsonify([_serialize(i) for i in items])


@inventory_bp.route("/", methods=["POST"])
def create():
    data = request.get_json(force=True)
    ingredient_id = data.get("ingredient_id")
    stock = data.get("stock")
    quantity = data.get("quantity")
    event_date = data.get("event_date")
    location = data.get("location")

    errors = []

    if not isinstance(stock, int) or isinstance(stock, bool):
        errors.append("Stock level must be a whole number.")
    if not isinstance(quantity, int) or isinstance(quantity, bool):
        errors.append("Quantity must be a whole number.")

    ingredient = db.session.get(Ingredient, ingredient_id) if ingredient_id else None
    if not ingredient:
        errors.append("Choose an ingredient from the catalog first.")

    parsed_date = None
    if event_date:
        try:
            parsed_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            errors.append("Invalid event_date format. Use YYYY-MM-DD.")

    if errors:
        return jsonify(error="; ".join(errors)), 400

    item = InventoryItem(
        ingredient_id=ingredient.id,
        stock=stock,
        quantity=quantity,
        event_date=parsed_date,
        location=location or None,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(_serialize(item)), 201


@inventory_bp.route("/<int:item_id>", methods=["PUT"])
def update(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json(force=True)
    ingredient_id = data.get("ingredient_id")
    stock = data.get("stock")
    quantity = data.get("quantity")

    errors = []

    if not isinstance(stock, int) or isinstance(stock, bool):
        errors.append("Stock level must be a whole number.")
    if not isinstance(quantity, int) or isinstance(quantity, bool):
        errors.append("Quantity must be a whole number.")

    ingredient = db.session.get(Ingredient, ingredient_id) if ingredient_id else None
    if not ingredient:
        errors.append("Choose an ingredient from the catalog first.")

    parsed_date = None
    if "event_date" in data and data["event_date"]:
        try:
            parsed_date = datetime.strptime(data["event_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            errors.append("Invalid event_date format. Use YYYY-MM-DD.")

    if errors:
        return jsonify(error="; ".join(errors)), 400

    item.ingredient_id = ingredient.id
    item.stock = stock
    item.quantity = quantity
    if "event_date" in data:
        item.event_date = parsed_date
    if "location" in data:
        item.location = data.get("location") or None
    db.session.commit()
    return jsonify(_serialize(item))


@inventory_bp.route("/<int:item_id>", methods=["DELETE"])
def delete(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return "", 204


@inventory_bp.route("/<int:item_id>/transfer", methods=["POST"])
def transfer(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json(force=True)
    transfer_quantity = data.get("quantity")
    booking_date = data.get("booking_date")

    if not isinstance(transfer_quantity, int) or transfer_quantity <= 0:
        return jsonify(error="Enter a transfer quantity greater than zero."), 400
    if transfer_quantity > item.quantity:
        return jsonify(error="Transfer quantity exceeds the available quantity."), 400
    if not booking_date:
        return jsonify(error="Select the booking date this transfer is for."), 400

    try:
        parsed_date = datetime.strptime(booking_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify(error="Invalid booking_date format. Use YYYY-MM-DD."), 400

    item.quantity -= transfer_quantity
    db.session.add(
        PreparationInventory(
            source_item_id=item.id,
            product_name=item.product_name,
            quantity=transfer_quantity,
            booking_date=parsed_date,
        )
    )
    db.session.commit()
    return jsonify(message=f"Transferred {transfer_quantity} unit(s) of {item.product_name} to preparation inventory."), 200
