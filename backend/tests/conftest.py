import pytest

from app import create_app
from extensions import db
from models import Ingredient, InventoryItem


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(autouse=True)
def _guard_db(app):
    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    assert "bevanda.db" not in uri, f"tests must not touch the dev database (got {uri})"


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def vodka(app):
    with app.app_context():
        ingredient = Ingredient(name="Vodka", ingredient_type="alcoholic")
        db.session.add(ingredient)
        db.session.commit()
        return ingredient.id


@pytest.fixture
def vodka_item(app, vodka):
    with app.app_context():
        item = InventoryItem(ingredient_id=vodka, stock=10, quantity=50)
        db.session.add(item)
        db.session.commit()
        return item.id
