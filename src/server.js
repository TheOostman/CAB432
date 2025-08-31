import express from "express";
import "dotenv/config";
import PDFDocument from "pdfkit";
import { performance } from "node:perf_hooks";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuid } from "uuid";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const OUT_DIR = path.resolve("output");
fs.mkdirSync(OUT_DIR, { recursive: true });

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pdf-forge",
    time: new Date().toISOString(),
  });
});

app.post("/render", (req, res) => {
  const text = (req.body?.text || "").toString().trim();
  if (!text) {
    return res.status(400).json({ error: "Missing 'text'" });
  }

  const id = uuid();
  const filePath = path.join(OUT_DIR, `render-${id}.pdf`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="render-${id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  const fileStream = fs.createWriteStream(filePath);
  doc.pipe(fileStream);
  doc.pipe(res);

  doc.fontSize(14).text(text, { align: "left" });
  doc.end();

  fileStream.on("finish", () => {
    console.log("Saved:", filePath);
  });
});

function countPrimes(limit = 200000) {
  if (limit < 2) return { count: 0, largest: null };
  const sieve = new Uint8Array(limit + 1).fill(1);
  sieve[0] = sieve[1] = 0;
  for (let p = 2; p * p <= limit; p++) {
    if (sieve[p]) {
      for (let k = p * p; k <= limit; k += p) sieve[k] = 0;
    }
  }
  let count = 0;
  let largest = null;
  for (let i = 2; i <= limit; i++) {
    if (sieve[i]) {
      count++;
      largest = i;
    }
  }
  return { count, largest };
}

app.get("/cpu", (req, res) => {
  const raw = req.query.limit ?? "200000";
  const parsed = parseInt(raw, 10);
  const limit = Number.isFinite(parsed) ? parsed : 200000;
  const safeLimit = Math.min(limit, 500000);
  const t0 = performance.now();
  const { count, largest } = countPrimes(safeLimit);
  const ms = Math.round(performance.now() - t0);
  res.json({ limit: safeLimit, count, largest, ms });
});

export default app;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`PDF Forge listening on :${PORT}`);
    console.log(`curl http://localhost:${PORT}/health`);
  });
}
