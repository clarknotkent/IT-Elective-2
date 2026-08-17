# Deploying to PythonAnywhere

Deployment module by Chris Maynard Ampon.

This covers the Flask API. The SPA is a static build and goes to any static
host — see the Deployment section of the README.

## 1. Get the code onto PythonAnywhere

Open a **Bash console** from the PythonAnywhere dashboard:

```bash
git clone https://github.com/clarknotkent/IT-Elective-2.git
cd IT-Elective-2
```

## 2. Create a virtualenv and install dependencies

```bash
mkvirtualenv --python=/usr/bin/python3.10 bevanda-venv
pip install -r backend/requirements.txt
```

(Check **Web → Python version** in the dashboard first — match the
`--python` flag above to whatever's actually available on your account.)

## 3. Set environment variables

In the **Web** tab, under your web app's configuration, add to the WSGI
config file (see step 5) or to a `.env` file loaded by `python-dotenv`:

```
SECRET_KEY=<generate a real one, don't use the dev default>
DATABASE_URL=sqlite:////home/<your-pythonanywhere-username>/IT-Elective-2/backend/instance/bevanda.db
```

Note the **four** slashes in `sqlite:////...` — PythonAnywhere needs an
absolute path.

## 4. Run migrations

```bash
cd ~/IT-Elective-2/backend
export FLASK_APP=app:create_app
export DATABASE_URL=sqlite:////home/<your-pythonanywhere-username>/IT-Elective-2/backend/instance/bevanda.db
flask db upgrade
```

## 5. Configure the web app

**Web** tab → **Add a new web app** → **Manual configuration** → your
Python version.

- **Source code**: `/home/<your-pythonanywhere-username>/IT-Elective-2/backend`
- **Virtualenv**: `/home/<your-pythonanywhere-username>/.virtualenvs/bevanda-venv`
- **WSGI configuration file** — replace its contents with:

```python
import sys, os

project_home = '/home/<your-pythonanywhere-username>/IT-Elective-2/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ['SECRET_KEY'] = '<same value as step 3>'
os.environ['DATABASE_URL'] = 'sqlite:////home/<your-pythonanywhere-username>/IT-Elective-2/backend/instance/bevanda.db'
os.environ['FLASK_ENV'] = 'production'

from app import create_app
application = create_app('production')
```

Hit the green **Reload** button. The API answers at
`https://<your-pythonanywhere-username>.pythonanywhere.com/api/...`.

Point the SPA's API base URL at that host when you build it, and restrict
`CORS` in `app.py` to the domain the SPA is served from.

## Updating after a push

```bash
cd ~/IT-Elective-2
git pull
workon bevanda-venv
pip install -r backend/requirements.txt   # only if requirements.txt changed
cd backend && flask db upgrade            # only if there's a new migration
```

Then hit **Reload** on the Web tab again — PythonAnywhere won't pick up
code changes until you do.

## Free-tier limits worth knowing about

- Free accounts only allow outbound requests to a fixed allowlist of
  domains. This app makes no outbound HTTP calls, so it doesn't matter
  here.
- Free web apps go to sleep after a period of inactivity and take a few
  seconds to wake back up on the next request.
- SQLite handles a workload this size comfortably. Concurrent writers are
  where it stops being the right choice, and PythonAnywhere offers hosted
  MySQL for that.
