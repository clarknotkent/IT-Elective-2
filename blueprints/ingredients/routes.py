"""Ingredient catalog: add, search, edit, delete.

Rebuilt from the original "Ingredient List" module. The stock-in date/time
fields that used to live on each row moved to StockMovement, since a
catalog entry shouldn't need to be re-saved every time stock arrives.
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash

from extensions import db
from models import Ingredient, INGREDIENT_TYPES

ingredients_bp = Blueprint("ingredients", __name__, template_folder="../../templates/ingredients")


@ingredients_bp.route("/")
def index():
    search_query = request.args.get("search", "").strip()
    query = Ingredient.query
    if search_query:
        like = f"%{search_query}%"
        query = query.filter(
            Ingredient.name.ilike(like) | Ingredient.ingredient_type.ilike(like)
        )
    ingredients = query.order_by(Ingredient.name).all()
    return render_template(
        "ingredients/list.html", ingredients=ingredients, search_query=search_query
    )


@ingredients_bp.route("/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        ingredient_type = request.form.get("ingredient_type", "")

        error = None
        if not name:
            error = "Ingredient name is required."
        elif ingredient_type not in dict(INGREDIENT_TYPES):
            error = "Choose a valid ingredient type."
        elif Ingredient.query.filter(db.func.lower(Ingredient.name) == name.lower()).first():
            error = f'"{name}" is already in the catalog.'

        if error:
            flash(error, "danger")
            return render_template(
                "ingredients/form.html",
                ingredient=None,
                ingredient_types=INGREDIENT_TYPES,
                form_values=request.form,
            )

        ingredient = Ingredient(name=name, ingredient_type=ingredient_type)
        db.session.add(ingredient)
        db.session.commit()
        flash(f'Added "{ingredient.name}" to the ingredient catalog.', "success")
        return redirect(url_for("ingredients.index"))

    return render_template(
        "ingredients/form.html", ingredient=None, ingredient_types=INGREDIENT_TYPES, form_values={}
    )


@ingredients_bp.route("/<int:ingredient_id>/edit", methods=["GET", "POST"])
def edit(ingredient_id):
    ingredient = Ingredient.query.get_or_404(ingredient_id)

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        ingredient_type = request.form.get("ingredient_type", "")

        error = None
        if not name:
            error = "Ingredient name is required."
        elif ingredient_type not in dict(INGREDIENT_TYPES):
            error = "Choose a valid ingredient type."
        else:
            clash = Ingredient.query.filter(
                db.func.lower(Ingredient.name) == name.lower(),
                Ingredient.id != ingredient.id,
            ).first()
            if clash:
                error = f'"{name}" is already in the catalog.'

        if error:
            flash(error, "danger")
            return render_template(
                "ingredients/form.html",
                ingredient=ingredient,
                ingredient_types=INGREDIENT_TYPES,
                form_values=request.form,
            )

        ingredient.name = name
        ingredient.ingredient_type = ingredient_type
        db.session.commit()
        flash(f'Updated "{ingredient.name}".', "success")
        return redirect(url_for("ingredients.index"))

    return render_template(
        "ingredients/form.html",
        ingredient=ingredient,
        ingredient_types=INGREDIENT_TYPES,
        form_values={"name": ingredient.name, "ingredient_type": ingredient.ingredient_type},
    )


@ingredients_bp.route("/<int:ingredient_id>/delete", methods=["POST"])
def delete(ingredient_id):
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    if ingredient.inventory_items:
        flash(
            f'Can\'t delete "{ingredient.name}" — it still has inventory stocked against it.',
            "danger",
        )
        return redirect(url_for("ingredients.index"))

    db.session.delete(ingredient)
    db.session.commit()
    flash(f'Deleted "{ingredient.name}" from the catalog.', "danger")
    return redirect(url_for("ingredients.index"))
