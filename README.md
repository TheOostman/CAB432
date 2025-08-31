# PDF Forge (CAB432 Assessment 1)

PDF Forge is a simple Node.js web application for **CAB432 Assessment 1**.  
It demonstrates:
- A **health endpoint** (`/health`)
- A **PDF rendering service** (`/render`)
- A **CPU-intensive demo task** (`/cpu`)
- A minimal web client (`public/index.html`)

---

## Requirements
- [Node.js](https://nodejs.org/) v20+  
- npm 

---

## Setup & Run

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Start the app:
   ```bash
   npm run dev
   ```
   By default, the server runs on **http://localhost:3000**


---

## API Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```
**Response**
```json
{
  "ok": true,
  "service": "pdf-forge",
  "time": "2025-08-31T12:00:00.000Z"
}
```

---

### 2. Render PDF (POST)
Create a PDF from supplied text.

```bash
curl -X POST http://localhost:3000/render   -H "Content-Type: application/json"   -d "{\"text\":\"Hello from pdf-forge\"}"   --output render.pdf
```

- Saves PDF to your local `output/` folder  
- Streams the PDF back in the response

---

### 3. CPU Demo
Prime-number calculation up to a limit (capped at 500,000).

```bash
curl "http://localhost:3000/cpu?limit=200000"
```

**Example Response**
```json
{
  "limit": 200000,
  "count": 17984,
  "largest": 199999,
  "ms": 3
}
```

---

## Web Client
You can also use the minimal HTML client:  
- Open [http://localhost:3000/](http://localhost:3000/) in your browser  
- Enter text -> click **Render PDF** -> PDF opens in a new tab  

---

## Project Structure
```
pdf-forge/
|src/
| - server.js       # Express app & API endpoints
| public/
| - index.html      # Simple frontend client
|output/            # Generated PDFs are stored here
|package.json
|README.md
```

---

## Error Handling
- `/render` -> returns `400` if text is missing
- `/cpu` -> caps limit at 500,000, returns safe JSON response
- `/health` -> always returns `200` with service status

---

## Testing (Optional)
If you use Vitest + Supertest, add a test like:

```bash
npm test
```

Example test (in `test/health.test.js`):

```js
import request from "supertest";
import app from "../src/server.js";

test("GET /health works", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
```

---

"# CAB432" 
