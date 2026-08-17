from extensions import db
from models import InventoryItem, StockMovement


def test_stock_in_increases_quantity_and_logs_movement(client, app, vodka_item):
    resp = client.post(f"/api/stock/{vodka_item}/in", json={"quantity": 15, "note": "delivery"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["new_quantity"] == 65
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 65
        movement = StockMovement.query.first()
        assert movement.movement_type == "in"
        assert movement.quantity == 15
        assert movement.note == "delivery"


def test_stock_out_decreases_quantity(client, app, vodka_item):
    resp = client.post(f"/api/stock/{vodka_item}/out", json={"quantity": 20})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["new_quantity"] == 30
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 30


def test_stock_out_cannot_exceed_available(client, app, vodka_item):
    """Regression: the original module had no bound on stock-out."""
    resp = client.post(f"/api/stock/{vodka_item}/out", json={"quantity": 999})
    assert resp.status_code == 400
    assert "only" in resp.get_json()["error"]
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 50  # unchanged


def test_movements_survive_across_requests(client, app, vodka_item):
    """Regression: data used to live in a plain Python list and vanish on restart."""
    client.post(f"/api/stock/{vodka_item}/in", json={"quantity": 5})
    client.post(f"/api/stock/{vodka_item}/out", json={"quantity": 3})
    with app.app_context():
        assert StockMovement.query.count() == 2


def test_stock_index_returns_items_and_movements(client, app, vodka_item):
    client.post(f"/api/stock/{vodka_item}/in", json={"quantity": 5})
    resp = client.get("/api/stock/")
    data = resp.get_json()
    assert "items" in data
    assert "recent_movements" in data
    assert len(data["items"]) == 1
    assert len(data["recent_movements"]) == 1
