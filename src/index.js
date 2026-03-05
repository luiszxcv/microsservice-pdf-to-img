require("dotenv").config();

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { downloadFile, pdfToImages, cleanup, ensureTmpDir } = require("./converter");
const { uploadImage } = require("./uploader");

const app = express();
app.use(express.json());

ensureTmpDir();

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/convert", auth, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' field" });
  }

  let pdfPath;
  let imagePaths = [];

  try {
    pdfPath = await downloadFile(url);
    imagePaths = pdfToImages(pdfPath);

    const jobId = uuidv4();
    const urls = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const key = `pdf-to-img/${jobId}/page-${i + 1}.png`;
      const cdnUrl = await uploadImage(imagePaths[i], key);
      urls.push(cdnUrl);
    }

    return res.json({ pages: urls.length, images: urls });
  } catch (err) {
    console.error("Conversion error:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    const toClean = [...imagePaths];
    if (pdfPath) toClean.push(pdfPath);
    cleanup(toClean);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`pdf-to-img running on :${PORT}`));
