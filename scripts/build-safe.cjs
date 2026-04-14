const { spawnSync } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const portCheck = spawnSync(
  "powershell",
  ["-NoProfile", "-Command", "netstat -ano | Select-String ':3000' | Select-String 'LISTENING'"],
  {
    cwd: projectRoot,
    encoding: "utf8"
  }
);

if (portCheck.status === 0 && portCheck.stdout.trim()) {
  console.error("Port 3000 is active. Stop the running frontend dev server before building.");
  process.exit(1);
}

const cleanScript = path.join(projectRoot, "scripts", "clean-next.cjs");
const cleanResult = spawnSync(process.execPath, [cleanScript], {
  cwd: projectRoot,
  stdio: "inherit"
});

if (cleanResult.status !== 0) {
  process.exit(cleanResult.status ?? 1);
}

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const buildResult = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: projectRoot,
  stdio: "inherit"
});

process.exit(buildResult.status ?? 1);
