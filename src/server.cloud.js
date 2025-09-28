import express from "express";
import "dotenv/config";
import PDFDocument from "pdfkit";
import { v4 as uuid } from "uuid";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { PassThrough } from "stream";
import { S3KeyFor, uploadPdfStreamToS3, getDownloadUrl } from "./storage/s3.js";
import { putDoc, putJob, getJob } from "./storage/dynamo.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const ownerFromRequest = () => "demo-user"; // will use Cognito "sub" in Step 2

// Health check route
app.get("/health", (req, res) => res.status(200).send("OK"));

app.post("/render", async (req, res) => {
  try {
    const owner = ownerFromRequest(req);
    const { title = "Untitled", body = "Hello", repeats = 1 } = req.body || {};
    const pages = Math.max(1, Math.min(50, Number(repeats) || 1));

    const docId = uuid();
    const jobId = uuid();
    const key = S3KeyFor("renders", jobId);  // fixed casing
    const createdAt = new Date().toISOString();

    const pdf = new PDFDocument({ autoFirstPage: false });
    const pipe = new PassThrough();
    const uploadPromise = uploadPdfStreamToS3(pipe, key);

    for (let i = 0; i < pages; i++) {
      pdf.addPage();
      pdf.fontSize(24).text(title, 72, 72);
      pdf.moveDown().fontSize(14).text(`${body} (page ${i + 1}/${pages})`, { width: 468 });
    }
    pdf.pipe(pipe);
    pdf.end();
    await uploadPromise;

    await putDoc({ docId, owner, name: title, s3Key: key, createdAt });
    await putJob({ jobId, owner, docId, status: "done", pages, repeats: pages, s3Key: key, createdAt });

    const url = await getDownloadUrl(key, 900);
    res.status(201).json({ jobId, docId, s3Key: key, downloadUrl: url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "render_failed", detail: String(e) });
  }
});

app.get("/jobs/:id", async (req, res) => {
  const job = await getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "not_found" });
  res.json(job);
});

app.listen(PORT, HOST, () => {
  console.log(`Cloud server listening on http://${HOST}:${PORT}`);
});
