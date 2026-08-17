"""Preparation inventory API: list, edit, delete (used/broken), return to inventory."""

from flask import Blueprint, jsonify, request

from extensions import db
from models import PreparationInventory

preparation_bp = Blueprint("preparation", __name__)


def _serialize(transfer):
    return {
        "id": transfer.id,
        "product_name": transfer.product_name,
        "quantity": transfer.quantity,
        "booking_date": transfer.booking_date.isoformat(),
        "transferred_at": transfer.transferred_at.isoformat(),
        "source_item_id": transfer.source_item_id,
    }


@preparation_bp.route("/", methods=["GET"])
def index():
    search_query = request.args.get("search", "").strip()
    query = PreparationInventory.query
    if search_query:
        query = query.filter(PreparationInventory.product_name.ilike(f"%{search_query}%"))
    transfers = query.order_by(PreparationInventory.booking_date.desc()).all()
    return jsonify([_serialize(t) for t in transfers])


@preparation_bp.route("/<int:transfer_id>", methods=["PUT"])
def edit(transfer_id):
    transfer = PreparationInventory.query.get_or_404(transfer_id)
    data = request.get_json(force=True)
    quantity = data.get("quantity")

    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity <= 0:
        return jsonify(error="Quantity must be a whole number greater than zero."), 400

    transfer.quantity = quantity
    db.session.commit()
    return jsonify(_serialize(transfer))


@preparation_bp.route("/<int:transfer_id>", methods=["DELETE"])
def delete(transfer_id):
    """Used, broken, or lost items — deducted without returning to inventory."""
    transfer = PreparationInventory.query.get_or_404(transfer_id)
    db.session.delete(transfer)
    db.session.commit()
    return "", 204


@preparation_bp.route("/<int:transfer_id>/return", methods=["POST"])
def return_to_inventory(transfer_id):
    """Unused items — sent back to the main inventory."""
    transfer = PreparationInventory.query.get_or_404(transfer_id)

    if not transfer.source_item:
        return jsonify(
            error=f"{transfer.product_name} has no linked inventory item to return to "
                  f"(it may have been deleted). Remove it manually instead."
        ), 400

    transfer.source_item.quantity += transfer.quantity
    name = transfer.product_name
    qty = transfer.quantity
    db.session.delete(transfer)
    db.session.commit()
    return jsonify(message=f"Returned {qty} unit(s) of {name} to the main inventory."), 200
