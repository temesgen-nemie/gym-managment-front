const { spawnSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const devResult = spawnSync(process.execPath, [nextBin, "dev"], {
  cwd: projectRoot,
  stdio: "inherit"
});

process.exit(devResult.status ?? 1);
