"""Reports API: list available reports and generate PDF exports."""

from io import BytesIO

from flask import Blueprint, jsonify, send_file
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from models import InventoryItem, Ingredient

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/", methods=["GET"])
def index():
    return jsonify(available_reports=["inventory"])


@reports_bp.route("/inventory.pdf", methods=["GET"])
def inventory_pdf():
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(72, 760, "Inventory Report")
    pdf.setFont("Helvetica", 10)

    y = 730
    items = InventoryItem.query.join(Ingredient).order_by(Ingredient.name).all()
    for item in items:
        line = (
            f"#{item.id}  {item.product_name}  |  {item.category}  |  "
            f"qty: {item.quantity}  |  par: {item.stock}"
            + ("  ** LOW STOCK **" if item.is_low_stock else "")
        )
        pdf.drawString(72, y, line)
        y -= 18
        if y < 60:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y = 760

    pdf.save()
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="inventory_report.pdf",
    )
