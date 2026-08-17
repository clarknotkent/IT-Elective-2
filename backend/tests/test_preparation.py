from datetime import date

from extensions import db
from models import InventoryItem, PreparationInventory


def _make_transfer(app, vodka_item, quantity=10):
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        item.quantity -= quantity
        transfer = PreparationInventory(
            source_item_id=item.id, product_name=item.product_name,
            quantity=quantity, booking_date=date(2025, 3, 1),
        )
        db.session.add(transfer)
        db.session.commit()
        return transfer.id


def test_return_unused_restores_inventory_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.post(f"/api/preparation/{transfer_id}/return")
    assert resp.status_code == 200
    assert "Returned" in resp.get_json()["message"]
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 50  # 50 - 10 transferred + 10 returned
        assert PreparationInventory.query.count() == 0


def test_delete_used_or_broken_does_not_restore_inventory(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.delete(f"/api/preparation/{transfer_id}")
    assert resp.status_code == 204
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 40  # stays deducted — it was used/broken/lost
        assert PreparationInventory.query.count() == 0


def test_edit_updates_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.put(f"/api/preparation/{transfer_id}", json={"quantity": 7})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["quantity"] == 7
    with app.app_context():
        transfer = db.session.get(PreparationInventory, transfer_id)
        assert transfer.quantity == 7


def test_list_preparation_items(client, app, vodka_item):
    _make_transfer(app, vodka_item, quantity=10)
    resp = client.get("/api/preparation/")
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["product_name"] == "Vodka"
    assert data[0]["quantity"] == 10


def test_stale_id_returns_404(client):
    resp = client.delete("/api/preparation/9999")
    assert resp.status_code == 404
    resp = client.post("/api/preparation/9999/return")
    assert resp.status_code == 404


def test_edit_rejects_negative_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.put(f"/api/preparation/{transfer_id}", json={"quantity": -5})
    assert resp.status_code == 400
    data = resp.get_json()
    assert "greater than zero" in data["error"]


def test_edit_rejects_zero_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.put(f"/api/preparation/{transfer_id}", json={"quantity": 0})
    assert resp.status_code == 400
    data = resp.get_json()
    assert "greater than zero" in data["error"]


def test_edit_rejects_boolean_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.put(f"/api/preparation/{transfer_id}", json={"quantity": True})
    assert resp.status_code == 400
    data = resp.get_json()
    assert "greater than zero" in data["error"]


def test_edit_rejects_non_integer_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.put(f"/api/preparation/{transfer_id}", json={"quantity": "ten"})
    assert resp.status_code == 400
    data = resp.get_json()
    assert "greater than zero" in data["error"]
