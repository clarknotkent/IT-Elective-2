from extensions import db
from models import InventoryItem, StockMovement


def test_stock_in_increases_quantity_and_logs_movement(client, app, vodka_item):
    resp = client.post(f"/stock/{vodka_item}/in", data={"quantity": "15", "note": "delivery"}, follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 65
        movement = StockMovement.query.first()
        assert movement.movement_type == "in"
        assert movement.quantity == 15
        assert movement.note == "delivery"


def test_stock_out_decreases_quantity(client, app, vodka_item):
    resp = client.post(f"/stock/{vodka_item}/out", data={"quantity": "20"}, follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 30


def test_stock_out_cannot_exceed_available(client, app, vodka_item):
    """Regression test: the original module used an in-memory list with no
    bound on stock-out, so this could go negative silently."""
    resp = client.post(f"/stock/{vodka_item}/out", data={"quantity": "999"}, follow_redirects=True)
    assert b"only" in resp.data
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 50  # unchanged


def test_movements_survive_across_requests(client, app, vodka_item):
    """Regression test for the original bug: data used to live in a plain
    Python list and vanish on restart. Here it must persist in the DB."""
    client.post(f"/stock/{vodka_item}/in", data={"quantity": "5"})
    client.post(f"/stock/{vodka_item}/out", data={"quantity": "3"})
    with app.app_context():
        assert StockMovement.query.count() == 2
