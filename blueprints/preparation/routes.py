"""Preparation inventory: what's been transferred out of the main
inventory for a specific booking date, and reconciling it afterwards.

Rebuilt from the "Preparation Inventory" half of the original
inventoryManagement module.
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash

from extensions import db
from models import PreparationInventory

preparation_bp = Blueprint(
    "preparation", __name__, template_folder="../../templates/preparation"
)


@preparation_bp.route("/")
def index():
    search_query = request.args.get("search", "").strip()
    query = PreparationInventory.query
    if search_query:
        query = query.filter(PreparationInventory.product_name.ilike(f"%{search_query}%"))
    transfers = query.order_by(PreparationInventory.booking_date.desc()).all()
    return render_template(
        "preparation/list.html", transfers=transfers, search_query=search_query
    )


@preparation_bp.route("/<int:transfer_id>/edit", methods=["GET", "POST"])
def edit(transfer_id):
    transfer = PreparationInventory.query.get_or_404(transfer_id)

    if request.method == "POST":
        quantity = request.form.get("quantity", "")
        if not quantity.isdigit():
            flash("Quantity must be a whole number.", "danger")
            return render_template("preparation/form.html", transfer=transfer)

        transfer.quantity = int(quantity)
        db.session.commit()
        flash(f"Updated {transfer.product_name}.", "success")
        return redirect(url_for("preparation.index"))

    return render_template("preparation/form.html", transfer=transfer)


@preparation_bp.route("/<int:transfer_id>/delete", methods=["POST"])
def delete(transfer_id):
    """Used, broken, or lost items — deducted from the preparation
    inventory without going back to the main inventory."""
    transfer = PreparationInventory.query.get_or_404(transfer_id)
    name = transfer.product_name
    db.session.delete(transfer)
    db.session.commit()
    flash(f"Removed {name} from the preparation inventory.", "danger")
    return redirect(url_for("preparation.index"))


@preparation_bp.route("/<int:transfer_id>/return", methods=["POST"])
def return_to_inventory(transfer_id):
    """Unused items — sent back to the main inventory in one action."""
    transfer = PreparationInventory.query.get_or_404(transfer_id)

    if not transfer.source_item:
        flash(
            f"{transfer.product_name} has no linked inventory item to return to "
            f"(it may have been deleted). Remove it manually instead.",
            "danger",
        )
        return redirect(url_for("preparation.index"))

    transfer.source_item.quantity += transfer.quantity
    name = transfer.product_name
    qty = transfer.quantity
    db.session.delete(transfer)
    db.session.commit()
    flash(f"Returned {qty} unit(s) of {name} to the main inventory.", "success")
    return redirect(url_for("preparation.index"))
