# Inventory Management System
Overview

The Inventory Management System is a web-based application built with Flask. It allows users to manage inventory items, transfer items to a preparation inventory, generate reports in PDF format, and perform CRUD operations efficiently. This project is designed to streamline inventory tracking and preparation for events.

# Features

Inventory Management:
Add, edit, delete, and search inventory items.
View detailed inventory information.

Preparation Inventory:
Transfer items from the main inventory to a preparation inventory.
Update and delete items in the preparation inventory.

PDF Report Generation:
Generate a downloadable PDF report of all inventory items.

# Installation

Prerequisites
Python 3.x installed on your system.
A virtual environment set up for Python projects.

Setup Instructions

Download the Files:
Download the folder from the provided Google Drive link and extract it to a location on your computer.
Set Up a Virtual Environment:

Navigate to the extracted folder:
cd InventoryManagementApp

Create and activate a virtual environment:
python -m venv venv
On Windows: .\venv\Scripts\activate

Install Dependencies:
pip install -r requirements.txt

Initialize the Database:
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

Run the Application:
python app.py

Open your browser and visit:
http://127.0.0.1:5000/

# Usage

Inventory Management
Navigate to the "Inventory List" page to view all items.
Add a new inventory item by clicking "Add New Item."
Edit or delete existing inventory items using the action buttons.

Preparation Inventory
Transfer items from the main inventory to the preparation inventory.
Update or delete items in the preparation inventory.

PDF Report
Download a PDF report of all inventory items by clicking "Download Report" on the Inventory List page.

# Technologies Used

Backend: Flask, Flask-SQLAlchemy, Flask-Migrate
Frontend: HTML, Bootstrap, Jinja2
PDF Generation: ReportLab
Database: SQLite
