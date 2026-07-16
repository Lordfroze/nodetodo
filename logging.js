const fs = require("fs").promises;
const path = require("path");
const LOG_FILE = path.join(__dirname, "logs", "app.log");

// cek jika file log ada
async function checkLogExist() {
    try {
        await fs.access(path.dirname(LOG_FILE));
    } catch {
        await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    }
}

// log ke file
async function log(level, message, context = {}) {
    await checkLogExist();
    const timestamp = new Date().toISOString();
    const contextStr =
        JSON.stringify(context) > 0 ? ` ${JSON.stringify(context)}` : "";

    const logEntry = `[${timestamp} ${level.toUpperCase()} - ${message}${contextStr}\n]`;

    try {
        await fs.appendFile(LOG_FILE, logEntry, "utf-8");
    } catch (err) {
        console.error("Gagal menulis file log:", err.message);
    }
}

// helper function
const logger = {
    info: (msg, ctx) => log("info", msg, ctx),
    warn: (msg, ctx) => log("warn", msg, ctx),
    error: (msg, ctx) => log("error", msg, ctx),
};

// export logger
module.exports = logger;