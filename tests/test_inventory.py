from extensions import db
from models import InventoryItem, PreparationInventory


def test_add_inventory_item(client, app, vodka):
    resp = client.post(
        "/inventory/add",
        data={"ingredient_id": vodka, "stock": "5", "quantity": "20", "event_date": "", "location": ""},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        assert InventoryItem.query.count() == 1


def test_low_stock_flagged(client, app, vodka_item):
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        item.quantity = item.stock  # exactly at par -> low stock
        db.session.commit()

    resp = client.get("/inventory/")
    assert b"Low stock" in resp.data


def test_delete_stale_id_returns_404_not_500(client):
    resp = client.post("/inventory/9999/delete")
    assert resp.status_code == 404


def test_transfer_moves_quantity_to_preparation(client, app, vodka_item):
    resp = client.post(
        f"/inventory/{vodka_item}/transfer",
        data={"transfer_quantity": "10", "booking_date": "2025-03-01"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 40
        prep = PreparationInventory.query.first()
        assert prep.quantity == 10
        assert prep.product_name == "Vodka"


def test_transfer_rejects_quantity_over_available(client, app, vodka_item):
    resp = client.post(
        f"/inventory/{vodka_item}/transfer",
        data={"transfer_quantity": "999", "booking_date": "2025-03-01"},
        follow_redirects=True,
    )
    assert b"exceeds the available quantity" in resp.data
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 50
