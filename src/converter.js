const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const TMP_DIR = path.join(__dirname, "..", "tmp");

function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const filePath = path.join(TMP_DIR, `${Date.now()}.pdf`);
    const file = fs.createWriteStream(filePath);

    const request = (currentUrl, redirects = 0) => {
      if (redirects > 5) return reject(new Error("Too many redirects"));
      const p = currentUrl.startsWith("https") ? https : http;

      p.get(currentUrl, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          return request(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          fs.unlinkSync(filePath);
          return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(filePath)));
      }).on("error", (err) => {
        fs.unlinkSync(filePath);
        reject(err);
      });
    };

    request(url);
  });
}

function pdfToImages(pdfPath) {
  const baseName = path.basename(pdfPath, ".pdf");
  const outPrefix = path.join(TMP_DIR, baseName);

  execSync(`pdftoppm -png -r 200 "${pdfPath}" "${outPrefix}"`, {
    timeout: 60_000,
  });

  const files = fs
    .readdirSync(TMP_DIR)
    .filter((f) => f.startsWith(baseName + "-") && f.endsWith(".png"))
    .sort();

  return files.map((f) => path.join(TMP_DIR, f));
}

function cleanup(files) {
  for (const f of files) {
    try {
      fs.unlinkSync(f);
    } catch {}
  }
}

module.exports = { downloadFile, pdfToImages, cleanup, ensureTmpDir };
