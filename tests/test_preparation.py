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

    resp = client.post(f"/preparation/{transfer_id}/return", follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 50  # 50 - 10 transferred + 10 returned
        assert PreparationInventory.query.count() == 0


def test_delete_used_or_broken_does_not_restore_inventory(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.post(f"/preparation/{transfer_id}/delete", follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        item = db.session.get(InventoryItem, vodka_item)
        assert item.quantity == 40  # stays deducted — it was used/broken/lost
        assert PreparationInventory.query.count() == 0


def test_edit_updates_quantity(client, app, vodka_item):
    transfer_id = _make_transfer(app, vodka_item, quantity=10)

    resp = client.post(f"/preparation/{transfer_id}/edit", data={"quantity": "7"}, follow_redirects=True)
    assert resp.status_code == 200
    with app.app_context():
        transfer = db.session.get(PreparationInventory, transfer_id)
        assert transfer.quantity == 7
