# Original submissions

Each folder is one person's own code, kept for the record. Not run, not
maintained — `../` is the working app. Virtual environments,
committed databases, and unrelated leftover files were stripped out; the
application code, templates, and any real screenshots were kept as-is,
typos and all.

## `inventory-management/`

James Douglas Ancheta & Kent Elrond Andionne Aspa. The most complete of
the three — Inventory + Preparation Inventory + PDF report, matching both
use-case diagrams closely. `models.py` here is exactly as submitted: it
defines an `Inventory` model that `app.py` never actually imports. That's
not a typo I introduced — the real model lived inline in `app.py` the
whole time.

## `ingredient-list/`

Angel Gabriel Litob. A standalone ingredient catalog — name, type,
stock-in date/time. `flask_site.py` is the original entry point name.

## `stock-in-stock-out/`

Trisha Ryle Pusta. Started from a public template
([`keerti1924/Python-Flask-CRUD-App`](https://github.com/keerti1924/Python-Flask-CRUD-App))
and retargeted from student records to ingredients — see
`TEMPLATE_ORIGIN_README.md`, which is the *template's* original readme,
unedited. The storage layer is a plain Python list (`ingredients = []` in
`app.py`); every restart wiped it. No screenshots are included here —
the only image in the original submission was the template author's own
preview screenshot of the unmodified student-list demo, which doesn't
represent Pusta's work and isn't included for that reason.

## Why keep these at all

So the merged schema can be read against what it came from. Diffing
`../models.py` against `inventory-management/models.py` and
`stock-in-stock-out/app.py` shows which decisions were inherited and which
were made here — the three modules each modelled "a thing with a name and
a quantity" separately, and that is the problem the shared schema solves.
