const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const nextDir = path.join(projectRoot, ".next");
const cacheDir = path.join(nextDir, "cache");

if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log("Removed .next/cache");
} else if (fs.existsSync(nextDir)) {
  console.log(".next exists, no cache directory to remove");
} else {
  console.log(".next directory not present");
}
