# Contributors

Part of **Bevanda Mobile Bar: Booking and Inventory System**, coursework for
IT Elective 2. Each module below was written by a different member of the
group; this codebase brings them together under one schema.

| Module | Author |
|---|---|
| Inventory Management (main inventory, transfer, PDF report) | James Douglas Ancheta & Kent Elrond Andionne Aspa |
| Ingredient Catalog | Angel Gabriel Litob |
| Stock In / Stock Out | Trisha Ryle Pusta |
| Deployment (PythonAnywhere) | Chris Maynard Ampon |
| Unified schema, tests, docs | Kent Elrond Andionne Aspa |

Preparation Inventory and Bundle Management are named as separate use cases
in the project documentation, with actors Admin and Head Bartender.
Preparation Inventory ships as part of Inventory Management and is credited
the same way above. There is no code for Bundle Management, so it isn't part
of this build.

## A note on the Stock In / Stock Out module

That module starts from a public template,
[`keerti1924/Python-Flask-CRUD-App`](https://github.com/keerti1924/Python-Flask-CRUD-App)
— a student-record CRUD demo built for a different course. Leftover files
like `students.json`, `teacher.png`, and an Azure deployment workflow come
from that template and have no place here, so they aren't carried over.

What Pusta built on top of that starting point is real work: the stock-in
and stock-out screens, the modal-based add/edit/stock flows, and retargeting
every field from student records to ingredients. What the template got wrong
is storage — it holds records in an in-memory Python list, so every restart
silently erases the data. Stock movements here are written to the
`stock_movements` table instead, with `InventoryItem.quantity` derived from
them rather than held in memory.

Credit for adapted work belongs in the open, which is why it's written down
here.
