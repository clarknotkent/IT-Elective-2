"""Ingredient catalog API: list, search, create, update, delete."""

from flask import Blueprint, jsonify, request

from extensions import db
from models import Ingredient, INGREDIENT_TYPES

ingredients_bp = Blueprint("ingredients", __name__)


def _serialize(ingredient):
    return {
        "id": ingredient.id,
        "name": ingredient.name,
        "ingredient_type": ingredient.ingredient_type,
        "type_label": ingredient.type_label,
        "created_at": ingredient.created_at.isoformat(),
        "inventory_count": len(ingredient.inventory_items),
    }


@ingredients_bp.route("/", methods=["GET"])
def index():
    search_query = request.args.get("search", "").strip()
    query = Ingredient.query
    if search_query:
        like = f"%{search_query}%"
        query = query.filter(
            Ingredient.name.ilike(like) | Ingredient.ingredient_type.ilike(like)
        )
    ingredients = query.order_by(Ingredient.name).all()
    return jsonify([_serialize(i) for i in ingredients])


@ingredients_bp.route("/", methods=["POST"])
def create():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    ingredient_type = data.get("ingredient_type", "")

    if not name:
        return jsonify(error="Ingredient name is required."), 400
    if ingredient_type not in dict(INGREDIENT_TYPES):
        return jsonify(error="Choose a valid ingredient type."), 400
    if Ingredient.query.filter(db.func.lower(Ingredient.name) == name.lower()).first():
        return jsonify(error=f'"{name}" is already in the catalog.'), 409

    ingredient = Ingredient(name=name, ingredient_type=ingredient_type)
    db.session.add(ingredient)
    db.session.commit()
    return jsonify(_serialize(ingredient)), 201


@ingredients_bp.route("/<int:ingredient_id>", methods=["PUT"])
def update(ingredient_id):
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    ingredient_type = data.get("ingredient_type", "")

    if not name:
        return jsonify(error="Ingredient name is required."), 400
    if ingredient_type not in dict(INGREDIENT_TYPES):
        return jsonify(error="Choose a valid ingredient type."), 400

    clash = Ingredient.query.filter(
        db.func.lower(Ingredient.name) == name.lower(),
        Ingredient.id != ingredient.id,
    ).first()
    if clash:
        return jsonify(error=f'"{name}" is already in the catalog.'), 409

    ingredient.name = name
    ingredient.ingredient_type = ingredient_type
    db.session.commit()
    return jsonify(_serialize(ingredient))


@ingredients_bp.route("/<int:ingredient_id>", methods=["DELETE"])
def delete(ingredient_id):
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    if ingredient.inventory_items:
        return jsonify(
            error=f'Can\'t delete "{ingredient.name}" — it still has inventory stocked against it.'
        ), 409

    db.session.delete(ingredient)
    db.session.commit()
    return "", 204
