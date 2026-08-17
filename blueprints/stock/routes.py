"""Stock in / stock out against existing inventory items.

The original "Stock-in_Stock-out" module (adapted from a public Flask CRUD
template — see docs/CONTRIBUTORS.md) kept its data in a plain Python list,
so every server restart silently wiped every ingredient it held. This
version writes every stock-in and stock-out to StockMovement and derives
InventoryItem.quantity from it, so nothing is lost and there's now an
audit trail of who moved what, when.
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash

from extensions import db
from models import InventoryItem, Ingredient, StockMovement

stock_bp = Blueprint("stock", __name__, template_folder="../../templates/stock")


@stock_bp.route("/")
def index():
    items = InventoryItem.query.join(Ingredient).order_by(Ingredient.name).all()
    recent_movements = StockMovement.query.order_by(StockMovement.created_at.desc()).limit(20).all()
    return render_template("stock/index.html", items=items, recent_movements=recent_movements)


@stock_bp.route("/<int:item_id>/in", methods=["POST"])
def stock_in(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    quantity = request.form.get("quantity", "")
    note = request.form.get("note", "").strip()

    if not quantity.isdigit() or int(quantity) <= 0:
        flash("Enter a stock-in quantity greater than zero.", "danger")
        return redirect(url_for("stock.index"))

    quantity = int(quantity)
    item.quantity += quantity
    db.session.add(
        StockMovement(item_id=item.id, movement_type="in", quantity=quantity, note=note or None)
    )
    db.session.commit()
    flash(f"Stocked in {quantity} unit(s) of {item.product_name}.", "success")
    return redirect(url_for("stock.index"))


@stock_bp.route("/<int:item_id>/out", methods=["POST"])
def stock_out(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    quantity = request.form.get("quantity", "")
    note = request.form.get("note", "").strip()

    if not quantity.isdigit() or int(quantity) <= 0:
        flash("Enter a stock-out quantity greater than zero.", "danger")
        return redirect(url_for("stock.index"))

    quantity = int(quantity)
    if quantity > item.quantity:
        flash(
            f"Can't stock out {quantity} — only {item.quantity} of {item.product_name} on hand.",
            "danger",
        )
        return redirect(url_for("stock.index"))

    item.quantity -= quantity
    db.session.add(
        StockMovement(item_id=item.id, movement_type="out", quantity=quantity, note=note or None)
    )
    db.session.commit()
    flash(f"Stocked out {quantity} unit(s) of {item.product_name}.", "success")
    return redirect(url_for("stock.index"))
