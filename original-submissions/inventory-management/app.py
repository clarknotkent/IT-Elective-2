from flask import Flask, render_template, request, redirect, url_for, flash, Response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from reportlab.pdfgen import canvas
from datetime import date

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database and migration
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Define models
class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    event_date = db.Column(db.String(50), nullable=False)

class PreparationInventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    transfer_date = db.Column(db.String(50), nullable=False)

# Routes
@app.route('/', methods=['GET', 'POST'])
def index():
    search_query = request.args.get('search', '')  # Get the search query from the request
    if search_query:
        inventory = Inventory.query.filter(
            Inventory.product_name.ilike(f"%{search_query}%") |
            Inventory.category.ilike(f"%{search_query}%")
        ).all()
    else:
        inventory = Inventory.query.all()
    return render_template('inventory_list.html', inventory=inventory, search_query=search_query)

@app.route('/add', methods=['GET', 'POST'])
def add_inventory():
    if request.method == 'POST':
        product_name = request.form['product_name']
        category = request.form['category']
        stock = request.form['stock']
        quantity = request.form['quantity']
        event_date = request.form['event_date']

        new_item = Inventory(
            product_name=product_name,
            category=category,
            stock=int(stock),
            quantity=int(quantity),
            event_date=event_date
        )

        db.session.add(new_item)
        db.session.commit()
        flash("Inventory item added successfully!", "success")
        return redirect(url_for('index'))

    return render_template('add_inventory.html')

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_inventory(id):
    item = Inventory.query.get_or_404(id)
    if request.method == 'POST':
        item.product_name = request.form['product_name']
        item.category = request.form['category']
        item.stock = int(request.form['stock'])
        item.quantity = int(request.form['quantity'])
        item.event_date = request.form['event_date']

        db.session.commit()
        flash("Inventory item updated successfully!", "success")
        return redirect(url_for('index'))

    return render_template('edit_inventory.html', item=item)

@app.route('/delete/<int:id>')
def delete_inventory(id):
    item = Inventory.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    flash("Inventory item deleted successfully!", "danger")
    return redirect(url_for('index'))

@app.route('/transfer/<int:id>', methods=['GET', 'POST'])
def transfer_item(id):
    item = Inventory.query.get_or_404(id)
    if request.method == 'POST':
        transfer_quantity = int(request.form['transfer_quantity'])
        if transfer_quantity > item.quantity:
            flash("Transfer quantity exceeds available quantity.", "danger")
        else:
            # Deduct from Inventory
            item.quantity -= transfer_quantity

            # Add to PreparationInventory
            new_transfer = PreparationInventory(
                product_name=item.product_name,
                quantity=transfer_quantity,
                transfer_date=date.today().strftime("%Y-%m-%d")
            )
            db.session.add(new_transfer)
            db.session.commit()

            flash(f"Transferred {transfer_quantity} units of {item.product_name}.", "success")
        return redirect(url_for('index'))
    return render_template('transfer_item.html', item=item)

@app.route('/preparation_inventory')
def preparation_inventory():
    transfers = PreparationInventory.query.all()
    return render_template('preparation_inventory.html', transfers=transfers)

# Add update route for preparation inventory
@app.route('/preparation_inventory/update/<int:id>', methods=['GET', 'POST'])
def update_preparation_inventory(id):
    item = PreparationInventory.query.get_or_404(id)
    if request.method == 'POST':
        item.product_name = request.form['product_name']
        item.quantity = int(request.form['quantity'])
        item.transfer_date = request.form['transfer_date']
        
        db.session.commit()
        flash("Preparation inventory item updated successfully!", "success")
        return redirect(url_for('preparation_inventory'))
    
    return render_template('update_preparation_inventory.html', item=item)

# Add delete route for preparation inventory
@app.route('/preparation_inventory/delete/<int:id>', methods=['POST'])
def delete_preparation_inventory(id):
    item = PreparationInventory.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    flash("Preparation inventory item deleted successfully!", "danger")
    return redirect(url_for('preparation_inventory'))

# Add the download report route
@app.route('/download_report')
def download_report():
    # Create a PDF response
    response = Response(content_type='application/pdf')
    response.headers['Content-Disposition'] = 'inline; filename=inventory_report.pdf'

    # Generate PDF using ReportLab
    pdf = canvas.Canvas(response.stream)
    pdf.drawString(100, 800, "Inventory Report")
    pdf.drawString(100, 780, "=================")

    y = 750
    for item in Inventory.query.all():
        pdf.drawString(100, y, f"ID: {item.id} | Name: {item.product_name} | Category: {item.category} | Quantity: {item.quantity}")
        y -= 20
        if y < 50:  # Create a new page if the content reaches the bottom
            pdf.showPage()
            y = 750

    pdf.save()
    return response

if __name__ == '__main__':
    app.run(debug=True)
