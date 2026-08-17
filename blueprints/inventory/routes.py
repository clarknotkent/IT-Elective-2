"""Main inventory: the central stock table, plus transfers out to the
preparation inventory for a booked event.

Rebuilt from the original "inventoryManagement" module — the most complete
of the three submissions and the closest match to the Inventory Management
use-case diagram. `models.py` there was dead code (defined but never
imported); this version actually uses a single shared model.
"""

from datetime import datetime, date

from flask import Blueprint, render_template, request, redirect, url_for, flash

from extensions import db
from models import InventoryItem, Ingredient, PreparationInventory

inventory_bp = Blueprint("inventory", __name__, template_folder="../../templates/inventory")


@inventory_bp.route("/")
def index():
    search_query = request.args.get("search", "").strip()
    query = InventoryItem.query.join(Ingredient)
    if search_query:
        like = f"%{search_query}%"
        query = query.filter(
            Ingredient.name.ilike(like) | Ingredient.ingredient_type.ilike(like)
        )
    items = query.order_by(Ingredient.name).all()
    return render_template("inventory/list.html", items=items, search_query=search_query)


@inventory_bp.route("/add", methods=["GET", "POST"])
def add():
    ingredients = Ingredient.query.order_by(Ingredient.name).all()

    if request.method == "POST":
        ingredient_id = request.form.get("ingredient_id")
        stock = request.form.get("stock", "")
        quantity = request.form.get("quantity", "")
        event_date = request.form.get("event_date", "")
        location = request.form.get("location", "").strip()

        error = None
        ingredient = db.session.get(Ingredient, ingredient_id) if ingredient_id else None
        if not ingredient:
            error = "Choose an ingredient from the catalog first."
        elif not stock.isdigit() or not quantity.isdigit():
            error = "Stock level and quantity must be whole numbers."

        if error:
            flash(error, "danger")
            return render_template(
                "inventory/form.html", item=None, ingredients=ingredients, form_values=request.form
            )

        item = InventoryItem(
            ingredient_id=ingredient.id,
            stock=int(stock),
            quantity=int(quantity),
            event_date=datetime.strptime(event_date, "%Y-%m-%d").date() if event_date else None,
            location=location or None,
        )
        db.session.add(item)
        db.session.commit()
        flash(f'Added "{ingredient.name}" to the main inventory.', "success")
        return redirect(url_for("inventory.index"))

    return render_template("inventory/form.html", item=None, ingredients=ingredients, form_values={})


@inventory_bp.route("/<int:item_id>/edit", methods=["GET", "POST"])
def edit(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    ingredients = Ingredient.query.order_by(Ingredient.name).all()

    if request.method == "POST":
        ingredient_id = request.form.get("ingredient_id")
        stock = request.form.get("stock", "")
        quantity = request.form.get("quantity", "")
        event_date = request.form.get("event_date", "")
        location = request.form.get("location", "").strip()

        error = None
        ingredient = db.session.get(Ingredient, ingredient_id) if ingredient_id else None
        if not ingredient:
            error = "Choose an ingredient from the catalog first."
        elif not stock.isdigit() or not quantity.isdigit():
            error = "Stock level and quantity must be whole numbers."

        if error:
            flash(error, "danger")
            return render_template(
                "inventory/form.html", item=item, ingredients=ingredients, form_values=request.form
            )

        item.ingredient_id = ingredient.id
        item.stock = int(stock)
        item.quantity = int(quantity)
        item.event_date = datetime.strptime(event_date, "%Y-%m-%d").date() if event_date else None
        item.location = location or None
        db.session.commit()
        flash(f'Updated "{ingredient.name}".', "success")
        return redirect(url_for("inventory.index"))

    form_values = {
        "ingredient_id": item.ingredient_id,
        "stock": item.stock,
        "quantity": item.quantity,
        "event_date": item.event_date.isoformat() if item.event_date else "",
        "location": item.location or "",
    }
    return render_template(
        "inventory/form.html", item=item, ingredients=ingredients, form_values=form_values
    )


@inventory_bp.route("/<int:item_id>/delete", methods=["POST"])
def delete(item_id):
    # Uses get_or_404 rather than a bare .get() + assumed success, so a
    # stale id (double-click, back button) 404s cleanly instead of 500ing.
    item = InventoryItem.query.get_or_404(item_id)
    name = item.product_name
    db.session.delete(item)
    db.session.commit()
    flash(f'Deleted "{name}" from the main inventory.', "danger")
    return redirect(url_for("inventory.index"))


@inventory_bp.route("/<int:item_id>/transfer", methods=["GET", "POST"])
def transfer(item_id):
    item = InventoryItem.query.get_or_404(item_id)

    if request.method == "POST":
        transfer_quantity = request.form.get("transfer_quantity", "")
        booking_date = request.form.get("booking_date", "")

        error = None
        if not transfer_quantity.isdigit() or int(transfer_quantity) <= 0:
            error = "Enter a transfer quantity greater than zero."
        elif int(transfer_quantity) > item.quantity:
            error = "Transfer quantity exceeds the available quantity."
        elif not booking_date:
            error = "Select the booking date this transfer is for."

        if error:
            flash(error, "danger")
            return render_template("inventory/transfer.html", item=item)

        transfer_quantity = int(transfer_quantity)
        item.quantity -= transfer_quantity

        db.session.add(
            PreparationInventory(
                source_item_id=item.id,
                product_name=item.product_name,
                quantity=transfer_quantity,
                booking_date=datetime.strptime(booking_date, "%Y-%m-%d").date(),
            )
        )
        db.session.commit()
        flash(
            f"Transferred {transfer_quantity} unit(s) of {item.product_name} to the "
            f"preparation inventory.",
            "success",
        )
        return redirect(url_for("inventory.index"))

    return render_template("inventory/transfer.html", item=item, today=date.today().isoformat())
