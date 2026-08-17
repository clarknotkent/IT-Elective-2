import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import config_by_name
from extensions import db, migrate


def create_app(env=None):
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name[env])

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    CORS(app)

    from blueprints.ingredients.routes import ingredients_bp
    from blueprints.inventory.routes import inventory_bp
    from blueprints.stock.routes import stock_bp
    from blueprints.preparation.routes import preparation_bp
    from blueprints.reports.routes import reports_bp

    app.register_blueprint(ingredients_bp, url_prefix="/api/ingredients")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(stock_bp, url_prefix="/api/stock")
    app.register_blueprint(preparation_bp, url_prefix="/api/preparation")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    @app.route("/api/dashboard")
    def dashboard():
        from models import Ingredient, InventoryItem

        return jsonify(
            ingredient_count=Ingredient.query.count(),
            inventory_count=InventoryItem.query.count(),
            low_stock_count=sum(1 for i in InventoryItem.query.all() if i.is_low_stock),
        )

    @app.route("/")
    def index():
        return jsonify(
            name="Bevanda Inventory API",
            version="2.0",
            endpoints=[
                "/api/dashboard",
                "/api/ingredients",
                "/api/inventory",
                "/api/stock",
                "/api/preparation",
                "/api/reports",
            ],
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        if request.path.startswith("/api/"):
            return jsonify(error=e.description), e.code
        return e

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=app.config.get("DEBUG", False))
