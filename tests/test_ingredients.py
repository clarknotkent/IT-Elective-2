from app import create_app
from extensions import db
from models import Ingredient


def test_add_ingredient(client, app):
    resp = client.post(
        "/ingredients/add",
        data={"name": "Lime", "ingredient_type": "fruits"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        assert Ingredient.query.filter_by(name="Lime").count() == 1


def test_duplicate_ingredient_name_rejected(client, app, vodka):
    resp = client.post(
        "/ingredients/add",
        data={"name": "vodka", "ingredient_type": "alcoholic"},  # case-insensitive clash
        follow_redirects=True,
    )
    assert b"already in the catalog" in resp.data
    with app.app_context():
        assert Ingredient.query.count() == 1


def test_add_ingredient_requires_name(client):
    resp = client.post(
        "/ingredients/add", data={"name": "", "ingredient_type": "fruits"}, follow_redirects=True
    )
    assert b"required" in resp.data


def test_search_filters_by_name(client, app, vodka):
    with app.app_context():
        db.session.add(Ingredient(name="Lime", ingredient_type="fruits"))
        db.session.commit()

    resp = client.get("/ingredients/?search=vod")
    assert b"Vodka" in resp.data
    assert b"Lime" not in resp.data


def test_delete_blocked_when_stocked(client, app, vodka_item, vodka):
    resp = client.post(f"/ingredients/{vodka}/delete", follow_redirects=True)
    assert b"still has inventory stocked" in resp.data
    with app.app_context():
        assert Ingredient.query.count() == 1


def test_delete_allowed_when_unused(client, app, vodka):
    resp = client.post(f"/ingredients/{vodka}/delete", follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        assert Ingredient.query.count() == 0
