import os

from flask import Flask, render_template

from config import config_by_name
from extensions import db, migrate


def create_app(env=None):
    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name[env])

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from blueprints.ingredients.routes import ingredients_bp
    from blueprints.inventory.routes import inventory_bp
    from blueprints.stock.routes import stock_bp
    from blueprints.preparation.routes import preparation_bp
    from blueprints.reports.routes import reports_bp

    app.register_blueprint(ingredients_bp, url_prefix="/ingredients")
    app.register_blueprint(inventory_bp, url_prefix="/inventory")
    app.register_blueprint(stock_bp, url_prefix="/stock")
    app.register_blueprint(preparation_bp, url_prefix="/preparation")
    app.register_blueprint(reports_bp, url_prefix="/reports")

    @app.route("/")
    def home():
        from models import Ingredient, InventoryItem

        return render_template(
            "index.html",
            ingredient_count=Ingredient.query.count(),
            inventory_count=InventoryItem.query.count(),
            low_stock_count=sum(1 for i in InventoryItem.query.all() if i.is_low_stock),
        )

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=app.config.get("DEBUG", False))
