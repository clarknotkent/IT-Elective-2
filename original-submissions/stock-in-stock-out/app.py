from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime

app = Flask(__name__)

# Mock database
ingredients = []

@app.route('/')
def index():
    return render_template('index.html', ingredients=ingredients)

@app.route('/stock-out')
def index1():
    return render_template('index1.html', ingredients=ingredients)

@app.route('/add_ingredient', methods=['POST'])
def add_ingredient():
    name = request.form['name']
    quantity = int(request.form['quantity'])
    now = datetime.now()
    ingredients.append({
        'name': name,
        'quantity': quantity,
        'stock_in_date': now.strftime('%Y-%m-%d'),
        'stock_in_time': now.strftime('%H:%M:%S'),
        'stock_out_date': '',
        'stock_out_time': ''
    })
    return redirect(url_for('index'))

@app.route('/edit_ingredient/<int:ingredient_id>', methods=['POST'])
def edit_ingredient(ingredient_id):
    name = request.form['name']
    quantity = int(request.form['quantity'])
    ingredients[ingredient_id]['name'] = name
    ingredients[ingredient_id]['quantity'] = quantity
    return redirect(url_for('index'))

@app.route('/delete_ingredient/<int:ingredient_id>')
def delete_ingredient(ingredient_id):
    ingredients.pop(ingredient_id)
    return redirect(url_for('index'))

@app.route('/stock_in/<int:ingredient_id>', methods=['POST'])
def stock_in(ingredient_id):
    additional_quantity = int(request.form['additional_quantity'])
    ingredients[ingredient_id]['quantity'] += additional_quantity
    now = datetime.now()
    ingredients[ingredient_id]['stock_in_date'] = now.strftime('%Y-%m-%d')
    ingredients[ingredient_id]['stock_in_time'] = now.strftime('%H:%M:%S')
    return redirect(url_for('index'))

@app.route('/stock_out/<int:ingredient_id>', methods=['POST'])
def stock_out(ingredient_id):
    decrease_quantity = int(request.form['decrease_quantity'])
    if ingredients[ingredient_id]['quantity'] >= decrease_quantity:
        ingredients[ingredient_id]['quantity'] -= decrease_quantity
        now = datetime.now()
        ingredients[ingredient_id]['stock_out_date'] = now.strftime('%Y-%m-%d')
        ingredients[ingredient_id]['stock_out_time'] = now.strftime('%H:%M:%S')
    return redirect(url_for('index1'))

if __name__ == '__main__':
    app.run(debug=True)
