const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const {
  machineLoggerError,
  machineLoggerInfo,
  machineLoggerWarn,
} = require("../utils/logger");

const BACKUP_DIR =
  process.env.DB_BACKUP_DIR || path.join(__dirname, "..", "backups");
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 7);

const DATABASE_HOST = process.env.DB_HOST || "127.0.0.1";
const DATABASE_PORT = process.env.DB_PORT || "5432";
const DATABASE_USER = process.env.DB_USER;
const DATABASE_PASSWORD = process.env.DB_PASSWORD || "";
const DATABASE_NAME = process.env.DB_NAME;
const PG_DUMP_CMD = process.env.DB_BACKUP_CMD || "pg_dump";

function ensureBackupDirExists() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

async function purgeOldBackups() {
  try {
    const expirationMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    const fileNames = await fs.promises.readdir(BACKUP_DIR);
    const fullPaths = fileNames
      .filter((fileName) => fileName.endsWith(".sql"))
      .map((fileName) => path.join(BACKUP_DIR, fileName));

    for (const filePath of fullPaths) {
      const stats = await fs.promises.stat(filePath);
      if (nowMs - stats.mtimeMs > expirationMs) {
        await fs.promises.rm(filePath, { force: true });
        machineLoggerInfo(
          `Deleted old backup: ${path.basename(filePath)}`,
          "purgeOldBackups"
        );
      }
    }
  } catch (error) {
    machineLoggerError(error, "purgeOldBackups");
  }
}

async function runDatabaseBackup() {
  const CONTEXT = "runDatabaseBackup";
  ensureBackupDirExists();

  if (!DATABASE_USER || !DATABASE_NAME) {
    throw new Error("Missing DB_USER or DB_NAME in environment variables");
  }

  const timestamp = generateTimestamp();
  const fileName = `${DATABASE_NAME}_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  const args = [
    "-h",
    DATABASE_HOST,
    "-p",
    String(DATABASE_PORT),
    "-U",
    DATABASE_USER,
    "-d",
    DATABASE_NAME,
    "-F",
    "p", // plain SQL
    "--no-owner",
    "--no-privileges",
  ];

  try {
    machineLoggerInfo(
      `Starting PostgreSQL backup: ${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME} -> ${fileName}`,
      CONTEXT
    );

    const dumpProcess = spawn(PG_DUMP_CMD, args, {
      env: { ...process.env, PGPASSWORD: DATABASE_PASSWORD },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const writeStream = fs.createWriteStream(filePath, { flags: "w" });
    dumpProcess.stdout.pipe(writeStream);

    let stderrBuffer = "";
    dumpProcess.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      dumpProcess.on("error", reject);
      dumpProcess.on("close", (exitCode) => {
        if (exitCode !== 0) {
          reject(
            new Error(`pg_dump exited with code ${exitCode}: ${stderrBuffer}`)
          );
        }
      });
    });

    const stats = await fs.promises.stat(filePath);
    if (stats.size <= 0) throw new Error("Backup file size is 0 bytes");

    machineLoggerInfo(
      `Backup success (${Math.round(stats.size / 1024)} KB): ${fileName}`,
      CONTEXT
    );

    await purgeOldBackups();
    return { ok: true, path: filePath };
  } catch (error) {
    machineLoggerError(error, CONTEXT);
    try {
      if (fs.existsSync(filePath))
        await fs.promises.rm(filePath, { force: true });
    } catch {
      machineLoggerWarn(`Failed to cleanup partial file: ${fileName}`, CONTEXT);
    }
    return { ok: false, error: error.message };
  }
}

module.exports = { runDatabaseBackup };
