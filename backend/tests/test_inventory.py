from extensions import db
from models import InventoryItem, PreparationInventory


def test_add_inventory_item(client, app, vodka):
    resp = client.post("/api/inventory/", json={
        "ingredient_id": vodka, "stock": 5, "quantity": 20,
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["product_name"] == "Vodka"
    assert data["quantity"] == 20
    with app.app_context():
        assert InventoryItem.query.count() == 1


def test_low_stock_flagged(client, app, vodka_item):
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        item.quantity = item.stock  # exactly at par -> low stock
        db.session.commit()

    resp = client.get("/api/inventory/")
    data = resp.get_json()
    assert any(i["is_low_stock"] for i in data)


def test_delete_stale_id_returns_404_not_500(client):
    resp = client.delete("/api/inventory/9999")
    assert resp.status_code == 404


def test_transfer_moves_quantity_to_preparation(client, app, vodka_item):
    resp = client.post(f"/api/inventory/{vodka_item}/transfer", json={
        "quantity": 10, "booking_date": "2025-03-01",
    })
    assert resp.status_code == 200
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 40
        prep = PreparationInventory.query.first()
        assert prep.quantity == 10
        assert prep.product_name == "Vodka"


def test_transfer_rejects_quantity_over_available(client, app, vodka_item):
    resp = client.post(f"/api/inventory/{vodka_item}/transfer", json={
        "quantity": 999, "booking_date": "2025-03-01",
    })
    assert resp.status_code == 400
    assert "exceeds the available quantity" in resp.get_json()["error"]
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 50


def test_update_inventory_item(client, app, vodka_item, vodka):
    resp = client.put(f"/api/inventory/{vodka_item}", json={
        "ingredient_id": vodka, "stock": 15, "quantity": 30,
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["stock"] == 15
    assert data["quantity"] == 30


def test_delete_inventory_item(client, app, vodka_item):
    resp = client.delete(f"/api/inventory/{vodka_item}")
    assert resp.status_code == 204
    with app.app_context():
        assert InventoryItem.query.count() == 0
