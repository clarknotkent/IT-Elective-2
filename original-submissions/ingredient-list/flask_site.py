from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy


#List all products

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///items.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Model for the Item
class Product(db.Model):
    idNum = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    ingredient_type = db.Column(db.String(50), nullable=False)  # Dropdown choice
    stock_in_date = db.Column(db.String(100), nullable=True)
    stock_in_time = db.Column(db.String(100), nullable=True)

# Create the database and tables
with app.app_context():
    db.create_all()

# Route to display all products
@app.route("/", methods=["GET", "POST"])
def index():
    # Get the search query from the request (default to empty string)
    search_query = request.args.get('search', '').strip()

    # Query the database based on the search query
    if search_query:
        products = Product.query.filter(
            (Product.product_name.ilike(f"%{search_query}%")) |
            (Product.ingredient_type.ilike(f"%{search_query}%"))
        ).all()
    else:
        products = Product.query.all()

    # Debug: Print the query and results
    print(f"Search Query: '{search_query}'")
    print(f"Filtered Products: {[product.product_name for product in products]}")

    return render_template('index.html', products=products, search_query=search_query)

# Route to create a new product
@app.route('/create', methods=['GET', 'POST'])
def create():
    if request.method == 'POST':
        # Collect form data
        product_name = request.form.get('product_name')
        ingredient_type = request.form.get('ingredient_type')
        stock_in_date = request.form.get('stock_in_date')
        stock_in_time = request.form.get('stock_in_time')

        # Add the new product to the database
        new_product = Product(
            product_name=product_name,
            ingredient_type=ingredient_type,
            stock_in_date=stock_in_date,
            stock_in_time=stock_in_time
        )
        db.session.add(new_product)
        db.session.commit()

        # Redirect to the index page
        return redirect(url_for('index'))

    return render_template('create.html')

# Route to update a product
@app.route('/update/<int:idNum>', methods=['GET', 'POST'])
def update(idNum):
    product = Product.query.get_or_404(idNum)
    if request.method == 'POST':
        product.product_name = request.form['product_name']
        product.ingredient_type = request.form['ingredient_type']
        product.stock_in_date = request.form['stock_in_date']
        product.stock_in_time = request.form['stock_in_time']
        db.session.commit()
        return redirect(url_for('index'))
    
    return render_template('update.html', product=product)

# Route to delete a product
@app.route('/delete/<int:idNum>', methods=['POST'])
def delete(idNum):
    product = Product.query.get_or_404(idNum)
    db.session.delete(product)
    db.session.commit()
    return redirect(url_for('index'))

if __name__ == "__main__":
    app.run(debug=True)
