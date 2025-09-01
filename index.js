require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");

const app = express();
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "primary",
    dataPath: ".wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

let latestQR = null;

client.on("qr", (qr) => {
  // Store QR for web access
  latestQR = qr;

  console.log("Visit this URL to scan the QR code: \n");
  console.log(
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      qr
    )}`
  );
});

client.on("authenticated", () => {
  console.log("[WWebJS] Authenticated.");
  latestQR = null;
});
client.on("auth_failure", (m) => console.error("[WWebJS] Auth failure:", m));
client.on("ready", () => console.log("[WWebJS] Client is ready."));
client.on("disconnected", (r) => {
  console.error("[WWebJS] Disconnected:", r);

  setTimeout(() => {
    console.log("[WWebJS] Attempting to reconnect...");
    client.initialize();
  }, 5000);
});

// Auto-reply configuration
let autoReplyEnabled = true;
let autoReplyMessage = `Hi {name}! Thanks for reaching out. 🙌 This is an automated response.

👉 If you're contacting me for *professional services* (cybersecurity, scripting, development, or collaborations), please email me at:
✉ contact@abhishekpanthee.com.np

👉 If it's a *personal chat*, please wait I'll get back to you when I'm free. 😊

📄 In the meantime, feel free to check out my CV here:
https://abhishekpanthee.com.np/cv`;

const autoRepliedContacts = new Set();

async function getPersonalizedAutoReply(message) {
  try {
    // Get contact info to extract name
    const contact = await message.getContact();
    let name = "";
    let number = "";

    // Try to get the contact's name from different sources
    if (contact.name) {
      name = contact.name;
    } else if (contact.pushname) {
      name = contact.pushname;
    } else if (contact.verifiedName) {
      name = contact.verifiedName;
    } else {
      name = "there";
    }

    // Get phone number
    number = contact.number || message.from.replace("@c.us", "");

    let personalizedMessage = autoReplyMessage
      .replace(/{name}/g, name)
      .replace(/{number}/g, number)
      .replace(/{phone}/g, number);

    return personalizedMessage;
  } catch (error) {
    return autoReplyMessage
      .replace(/{name}/g, "there")
      .replace(/{number}/g, "")
      .replace(/{phone}/g, "");
  }
}

// Listen for incoming messages
client.on("message", async (message) => {
  // Skip if message is from self or from status updates
  if (message.fromMe || message.from === "status@broadcast") {
    return;
  }

  if (autoReplyEnabled && !autoRepliedContacts.has(message.from)) {
    try {
      const personalizedReply = await getPersonalizedAutoReply(message);

      await client.sendMessage(message.from, personalizedReply);
      autoRepliedContacts.add(message.from);

      // Remove from auto-replied set after 24 hours (1 day) to allow auto-reply again
      setTimeout(() => {
        autoRepliedContacts.delete(message.from);
      }, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.error(`[ERROR] Failed to send auto-reply:`, error);
    }
  } else if (autoReplyEnabled && autoRepliedContacts.has(message.from)) {
  }

  // Check if this message is a reply to another message
  if (message.hasQuotedMsg) {
    try {
      const quotedMsg = await message.getQuotedMessage();

      // Check if the quoted message is one we sent and are tracking
      if (sentMessages.has(quotedMsg.id.id)) {
        const trackedMessage = sentMessages.get(quotedMsg.id.id);
        trackedMessage.replied = true;
        trackedMessage.replyText = message.body;
        trackedMessage.replyTimestamp = Date.now();
      }
    } catch (error) {
      console.error("[ERROR] Failed to get quoted message:", error);
    }
  }

  const contactNumber = message.from.replace("@c.us", "");
});

client.initialize(); // start!  (QR shows on first run)

/** Helpers **/
const DEFAULT_CC = process.env.DEFAULT_CC || "";
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

let clientReady = false;

client.on("ready", () => {
  clientReady = true;
});

client.on("disconnected", (r) => {
  clientReady = false;

  setTimeout(() => {
    client.initialize();
  }, 5000);
});

client.on("auth_failure", (m) => {
  console.error("[WWebJS] Auth failure:", m);
  clientReady = false;
});

async function ensureClientReady(maxWaitTime = 30000) {
  if (clientReady) return true;

  const startTime = Date.now();

  while (!clientReady && Date.now() - startTime < maxWaitTime) {
    await sleep(1000);
  }

  if (!clientReady) {
    throw new Error("Client is not ready after waiting");
  }

  return true;
}

const sentMessages = new Map();

function trackSentMessage(messageId, to, originalMessage) {
  sentMessages.set(messageId, {
    to,
    originalMessage,
    timestamp: Date.now(),
    replied: false,
  });

  setTimeout(() => {
    sentMessages.delete(messageId);
  }, 24 * 60 * 60 * 1000);
}

async function ensureChatId(to) {
  if (/@(c|g)\.us$/.test(to)) return to;

  let number = to.trim();
  if (!number.startsWith("+") && DEFAULT_CC) number = DEFAULT_CC + number;

  const cleanNumber = number.replace(/\D/g, "");
  if (cleanNumber.length < 10) {
    throw new Error(`Invalid phone number format: ${number}`);
  }

  const chatId = cleanNumber + "@c.us";

  return chatId;
}

app.get("/status", async (_req, res) => {
  try {
    const state = await client.getState().catch(() => null);
    const info = client.info || null;
    res.json({
      ok: true,
      state,
      me: info?.me,
      platform: info?.platform,
      pushname: info?.pushname,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post("/send-text", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message)
      return res
        .status(400)
        .json({ ok: false, error: "to and message are required" });

    await ensureClientReady();

    const chatId = await ensureChatId(to);

    const msg = await client.sendMessage(chatId, message);

    trackSentMessage(msg.id.id, chatId, message);

    res.json({ ok: true, id: msg.id.id, timestamp: msg.timestamp, to: chatId });
  } catch (e) {
    if (
      e.message.includes("Session closed") ||
      e.message.includes("Protocol error")
    ) {
      clientReady = false;
      setTimeout(() => {
        client.initialize();
      }, 2000);
    }

    res.status(400).json({ ok: false, error: String(e) });
  }
});

app.get("/check-replies", async (_req, res) => {
  try {
    const trackedMessages = Array.from(sentMessages.entries()).map(
      ([messageId, data]) => ({
        messageId,
        ...data,
      })
    );

    res.json({
      ok: true,
      trackedMessages,
      totalTracked: sentMessages.size,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/check-reply/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const messageData = sentMessages.get(messageId);

    if (!messageData) {
      return res.status(404).json({
        ok: false,
        error: "Message not found or no longer tracked",
      });
    }

    res.json({
      ok: true,
      messageId,
      ...messageData,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/auto-reply/status", (req, res) => {
  res.json({
    ok: true,
    enabled: autoReplyEnabled,
    message: autoReplyMessage,
    totalAutoReplied: autoRepliedContacts.size,
  });
});

app.post("/auto-reply/toggle", (req, res) => {
  autoReplyEnabled = !autoReplyEnabled;

  res.json({
    ok: true,
    enabled: autoReplyEnabled,
    message: autoReplyMessage,
  });
});

app.post("/auto-reply/message", (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ ok: false, error: "Message is required" });
  }

  autoReplyMessage = message;

  res.json({
    ok: true,
    enabled: autoReplyEnabled,
    message: autoReplyMessage,
  });
});

app.post("/auto-reply/clear/:number", (req, res) => {
  const { number } = req.params;
  const chatId = number.includes("@") ? number : `${number}@c.us`;

  if (autoRepliedContacts.has(chatId)) {
    autoRepliedContacts.delete(chatId);

    res.json({ ok: true, message: `Cooldown cleared for ${number}` });
  } else {
    res.json({ ok: true, message: `No cooldown found for ${number}` });
  }
});

app.post("/auto-reply/clear-all", (req, res) => {
  const count = autoRepliedContacts.size;
  autoRepliedContacts.clear();

  res.json({ ok: true, message: `Cleared ${count} cooldowns` });
});

app.post("/send-bulk", async (req, res) => {
  const { items, delayMs = 1200 } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ ok: false, error: "items must be a non-empty array" });
  }
  const results = [];
  for (const it of items) {
    try {
      const chatId = await ensureChatId(it.to);
      const m = await client.sendMessage(chatId, it.message);

      trackSentMessage(m.id.id, chatId, it.message);

      results.push({ to: chatId, ok: true, id: m.id.id });
      await sleep(delayMs);
    } catch (e) {
      results.push({ to: it.to, ok: false, error: String(e) });
    }
  }
  res.json({ ok: true, results });
});

const upload = multer({ dest: "uploads/" });
app.post("/send-media", upload.single("file"), async (req, res) => {
  try {
    const { to, caption } = req.body;
    if (!to || !req.file)
      return res
        .status(400)
        .json({ ok: false, error: "to and file are required" });

    const chatId = await ensureChatId(to);
    const filePath = path.resolve(req.file.path);
    const b64 = fs.readFileSync(filePath, { encoding: "base64" });
    const filename = req.file.originalname || path.basename(filePath);

    const { default: mime } = await import("mime");
    const mimetype =
      req.file.mimetype || mime.getType(filename) || "application/octet-stream";

    const media = new MessageMedia(mimetype, b64, filename);
    const m = await client.sendMessage(chatId, media, { caption });
    fs.unlink(filePath, () => {});
    res.json({ ok: true, id: m.id.id, to: chatId, filename });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e) });
  }
});

app.post("/send-group", async (req, res) => {
  try {
    const { groupId, message } = req.body;
    if (!groupId || !message || !/@g\.us$/.test(groupId)) {
      return res.status(400).json({
        ok: false,
        error: "Valid groupId (@g.us) and message required",
      });
    }
    const m = await client.sendMessage(groupId, message);
    res.json({ ok: true, id: m.id.id, to: groupId });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e) });
  }
});

app.get("/qr", (req, res) => {
  if (!latestQR) {
    return res.status(404).json({ ok: false, error: "No QR code available" });
  }

  res.json({ ok: true, qr: latestQR });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {});
