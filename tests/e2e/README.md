# System tests (end-to-end)

Two scripts that walk through the complete workflow of every type of user on the running system. They are the system tests reported in Chapter 7.3 of the FYP report (Table 10, Figure 48).

| Script | What it does | Checks |
| --- | --- | --- |
| `api_flow.py` | Calls the REST API as Staff, Admin, HOD, Trainer, Top Management and a public visitor | 125 |
| `ui_flow.cjs` | Drives a headless Chrome browser through the main screens with Puppeteer | 30 |

## Before you run them

1. Use a development database, not the UAT one: the scripts register new users and create courses.
2. Seed the demo data, because the scripts log in as the demo accounts (`admin01@test.com`, `raj@test.com`, `trainer01@test.com`, `mgmt01@test.com`, password `pass123`):

   ```bash
   cd backend
   php artisan migrate:fresh --seed
   ```

3. Start the backend (`php artisan serve`, port 8000), Redis, PostgreSQL, and for `ui_flow.cjs` also the frontend (`npm run dev` or `npm run build && npm start`, port 3000).

## Run

From the repository root:

```bash
pip install requests
python tests/e2e/api_flow.py

node tests/e2e/ui_flow.cjs
```

Each script prints one PASS/FAIL line per check and a `TOTAL ... PASS ... FAIL ...` line at the end, and exits with code 1 if any check fails. Results are saved in `tests/e2e/output/` (JSON files, plus screenshots for `ui_flow.cjs`).

Optional settings: `API_URL` (default `http://127.0.0.1:8000`), `APP_URL` (default `http://localhost:3000`) and `CHROME_PATH` (to use an installed Chrome instead of the one Puppeteer downloads).

Run `api_flow.py` on a freshly seeded database: a few checks rely on the IDs of the seeded users.
