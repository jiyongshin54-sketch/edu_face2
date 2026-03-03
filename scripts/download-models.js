/**
 * Downloads face-api.js tiny model weights into /public/models/
 * Run: node scripts/download-models.js
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const BASE =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";

const FILES = [
  // 얼굴 감지 (Tiny, ~190KB)
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  // 랜드마크 68점 (Tiny, ~76KB)
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_landmark_68_tiny_model-shard1",
  // 얼굴 인식 / 128차원 descriptor (~6.2MB) ← Supabase 저장·비교용
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

const OUT_DIR = path.join(__dirname, "../public/models");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function download(filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(OUT_DIR, filename);
    if (fs.existsSync(dest)) {
      console.log(`  ✓ 이미 존재: ${filename}`);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    const url = BASE + filename;
    console.log(`  ↓ 다운로드: ${filename}`);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          https
            .get(res.headers.location, (r) => {
              r.pipe(file);
              file.on("finish", () => file.close(resolve));
            })
            .on("error", reject);
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

(async () => {
  console.log("🤖 face-api.js 모델 다운로드 시작...\n");
  for (const f of FILES) {
    await download(f);
  }
  console.log("\n✅ 완료! /public/models/ 에 저장되었습니다.");
})();
