from extensions import db
from models import Ingredient


def test_add_ingredient(client, app):
    resp = client.post("/api/ingredients/", json={"name": "Lime", "ingredient_type": "fruits"})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["name"] == "Lime"
    assert data["ingredient_type"] == "fruits"
    assert data["type_label"] == "Fruits"
    with app.app_context():
        assert Ingredient.query.filter_by(name="Lime").count() == 1


def test_duplicate_ingredient_name_rejected(client, app, vodka):
    resp = client.post("/api/ingredients/", json={"name": "vodka", "ingredient_type": "alcoholic"})
    assert resp.status_code == 409
    data = resp.get_json()
    assert "already in the catalog" in data["error"]
    with app.app_context():
        assert Ingredient.query.count() == 1


def test_add_ingredient_requires_name(client):
    resp = client.post("/api/ingredients/", json={"name": "", "ingredient_type": "fruits"})
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"]


def test_search_filters_by_name(client, app, vodka):
    with app.app_context():
        db.session.add(Ingredient(name="Lime", ingredient_type="fruits"))
        db.session.commit()

    resp = client.get("/api/ingredients/?search=vod")
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "Vodka"


def test_delete_blocked_when_stocked(client, app, vodka_item, vodka):
    resp = client.delete(f"/api/ingredients/{vodka}")
    assert resp.status_code == 409
    assert "still has inventory stocked" in resp.get_json()["error"]
    with app.app_context():
        assert Ingredient.query.count() == 1


def test_delete_allowed_when_unused(client, app, vodka):
    resp = client.delete(f"/api/ingredients/{vodka}")
    assert resp.status_code == 204
    with app.app_context():
        assert Ingredient.query.count() == 0


def test_update_ingredient(client, app, vodka):
    resp = client.put(f"/api/ingredients/{vodka}", json={"name": "Grey Goose", "ingredient_type": "alcoholic"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "Grey Goose"


def test_update_duplicate_name_rejected(client, app, vodka):
    with app.app_context():
        db.session.add(Ingredient(name="Rum", ingredient_type="alcoholic"))
        db.session.commit()

    resp = client.put(f"/api/ingredients/{vodka}", json={"name": "rum", "ingredient_type": "alcoholic"})
    assert resp.status_code == 409
    assert "already in the catalog" in resp.get_json()["error"]


def test_ingredient_type_must_be_a_slug_not_a_label(client):
    resp = client.post("/api/ingredients/", json={"name": "Vodka", "ingredient_type": "Alcoholic"})
    assert resp.status_code == 400
    assert "valid ingredient type" in resp.get_json()["error"]

    resp = client.post("/api/ingredients/", json={"name": "Vodka", "ingredient_type": "alcoholic"})
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["ingredient_type"] == "alcoholic"
    assert body["type_label"] == "Alcoholic"
