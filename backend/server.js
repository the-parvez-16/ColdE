// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

dotenv.config({ path: ".env" });

// ============ CONFIG ============

const ROOT_DIR = __dirname;

// MongoDB connection
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
const client = new MongoClient(mongoUrl);

let db;

// JWT Config
const SECRET_KEY = process.env.JWT_SECRET || "cold-email-agent-secret-key-2024";
const ALGORITHM = "HS256";
const ACCESS_TOKEN_EXPIRE_HOURS = 24;

// Create Express app
const app = express();

// Router with /api prefix
const apiRouter = express.Router();

// Logging (simple)
function log(...args) {
  console.log(new Date().toISOString(), "-", ...args);
}

// Middlewares
app.use(cors({
  origin: (process.env.CORS_ORIGINS || "*").split(","),
  credentials: true
}));
app.use(express.json());

// ============ AUTH HELPERS ============

function hashPassword(password) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hashed) {
  return bcrypt.compareSync(password, hashed);
}

function createAccessToken(userId) {
  const expSeconds = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRE_HOURS * 60 * 60;
  const payload = { sub: userId, exp: expSeconds };
  return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
}

async function getCurrentUser(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || "";
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ detail: "Invalid token" });
    }

    const token = parts[1];

    let payload;
    try {
      payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ detail: "Token expired" });
      }
      return res.status(401).json({ detail: "Invalid token" });
    }

    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ detail: "Invalid token" });
    }

    const user = await db.collection("users").findOne(
      { id: userId },
      { projection: { _id: 0 } }
    );

    if (!user) {
      return res.status(401).json({ detail: "User not found" });
    }

    req.currentUser = user;
    next();
  } catch (err) {
    log("Auth error", err);
    return res.status(401).json({ detail: "Invalid token" });
  }
}

// ============ MOCK N8N WORKFLOW ============

const MOCK_COMPANIES = [
  { company: "TechCorp Solutions", domain: "techcorp.com" },
  { company: "InnovateLab Inc", domain: "innovatelab.io" },
  { company: "DataDrive Analytics", domain: "datadrive.co" },
  { company: "CloudScale Systems", domain: "cloudscale.net" },
  { company: "AI Ventures", domain: "aiventures.com" },
  { company: "DigitalFirst Agency", domain: "digitalfirst.agency" },
  { company: "GrowthStack", domain: "growthstack.io" },
  { company: "Nexus Technologies", domain: "nexustech.com" },
  { company: "Quantum Soft", domain: "quantumsoft.dev" },
  { company: "Velocity Labs", domain: "velocitylabs.co" }
];

function generateMockEmail(company, index) {
  const prefixes = ["ceo", "founder", "hr", "hiring", "info", "contact", "careers"];
  return `${prefixes[index % prefixes.length]}@${company.domain}`;
}

async function simulateN8NWorkflow(campaignId) {
  try {
    const campaignsCol = db.collection("campaigns");

    const campaign = await campaignsCol.findOne(
      { id: campaignId },
      { projection: { _id: 0 } }
    );
    if (!campaign) return;

    // Phase 1: Finding emails (30%)
    await campaignsCol.updateOne(
      { id: campaignId },
      { $set: { status: "finding_emails", progress: 10 } }
    );
    await new Promise(r => setTimeout(r, 2000));

    // Generate mock targets
    const targets = [];
    for (let i = 0; i < campaign.email_limit; i++) {
      const company = MOCK_COMPANIES[i % MOCK_COMPANIES.length];
      targets.push({
        email: generateMockEmail(company, i),
        company: company.company,
        status: "pending",
        response_category: null,
        sent_at: null,
        replied_at: null
      });
    }

    await campaignsCol.updateOne(
      { id: campaignId },
      { $set: { targets, progress: 30 } }
    );
    await new Promise(r => setTimeout(r, 1000));

    // Phase 2: Sending emails (30% -> 80%)
    await campaignsCol.updateOne(
      { id: campaignId },
      { $set: { status: "sending" } }
    );

    for (let i = 0; i < targets.length; i++) {
      await new Promise(r => setTimeout(r, 300));
      targets[i].status = "sent";
      targets[i].sent_at = new Date().toISOString();

      const progress = 30 + Math.trunc(((i + 1) / targets.length) * 50);
      await campaignsCol.updateOne(
        { id: campaignId },
        { $set: { targets, progress } }
      );
    }

    // Phase 3: Simulate responses (80% -> 100%)
    await new Promise(r => setTimeout(r, 1000));

    for (let i = 0; i < targets.length; i++) {
      const rand = Math.random();
      if (rand < 0.25) {
        targets[i].status = "replied";
        targets[i].response_category = "positive";
        targets[i].replied_at = new Date().toISOString();
      } else if (rand < 0.40) {
        targets[i].status = "replied";
        targets[i].response_category = "negative";
        targets[i].replied_at = new Date().toISOString();
      } else {
        targets[i].status = "delivered";
        targets[i].response_category = "no_reply";
      }
    }

    const stats = {
      total: targets.length,
      sent: targets.filter(t => ["sent", "delivered", "replied"].includes(t.status)).length,
      delivered: targets.filter(t => ["delivered", "replied"].includes(t.status)).length,
      replied: targets.filter(t => t.status === "replied").length,
      positive: targets.filter(t => t.response_category === "positive").length,
      negative: targets.filter(t => t.response_category === "negative").length,
      no_reply: targets.filter(t => t.response_category === "no_reply").length
    };

    await campaignsCol.updateOne(
      { id: campaignId },
      {
        $set: {
          targets,
          stats,
          status: "completed",
          progress: 100,
          completed_at: new Date().toISOString()
        }
      }
    );
  } catch (err) {
    log("simulateN8NWorkflow error", err);
  }
}

// ============ AUTH ROUTES ============

// POST /api/auth/register
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ detail: "Missing fields" });
    }

    const usersCol = db.collection("users");

    const existing = await usersCol.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: "Email already registered" });
    }

    const userId = require("crypto").randomUUID();
    const createdAt = new Date().toISOString();

    const userDoc = {
      id: userId,
      email,
      name,
      password_hash: hashPassword(password),
      created_at: createdAt
    };

    await usersCol.insertOne(userDoc);

    const token = createAccessToken(userId);

    return res.json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: userId,
        email,
        name,
        created_at: createdAt
      }
    });
  } catch (err) {
    log("register error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// POST /api/auth/login
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ detail: "Missing fields" });
    }

    const usersCol = db.collection("users");
    const user = await usersCol.findOne(
      { email },
      { projection: { _id: 0 } }
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    const token = createAccessToken(user.id);

    return res.json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });
  } catch (err) {
    log("login error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// GET /api/auth/me
apiRouter.get("/auth/me", getCurrentUser, async (req, res) => {
  const u = req.currentUser;
  return res.json({
    id: u.id,
    email: u.email,
    name: u.name,
    created_at: u.created_at
  });
});

// ============ CAMPAIGN ROUTES ============

// POST /api/campaigns
apiRouter.post("/campaigns", getCurrentUser, async (req, res) => {
  try {
    const { name, work_description, email_limit } = req.body || {};
    if (!name || !work_description || typeof email_limit !== "number") {
      return res.status(400).json({ detail: "Missing fields" });
    }
    if (email_limit < 1 || email_limit > 100) {
      return res.status(400).json({ detail: "email_limit must be between 1 and 100" });
    }

    const campaignsCol = db.collection("campaigns");

    const campaignId = require("crypto").randomUUID();
    const createdAt = new Date().toISOString();

    const campaignDoc = {
      id: campaignId,
      user_id: req.currentUser.id,
      name,
      work_description,
      email_limit,
      status: "processing",
      progress: 0,
      targets: [],
      stats: {},
      created_at: createdAt,
      completed_at: null
    };

    await campaignsCol.insertOne(campaignDoc);

    // Start mock n8n workflow in "background"
    simulateN8NWorkflow(campaignId);

    const { _id, ...rest } = campaignDoc;
    return res.json(rest);
  } catch (err) {
    log("create_campaign error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// GET /api/campaigns
apiRouter.get("/campaigns", getCurrentUser, async (req, res) => {
  try {
    const campaignsCol = db.collection("campaigns");
    const campaigns = await campaignsCol
      .find({ user_id: req.currentUser.id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();

    return res.json(campaigns);
  } catch (err) {
    log("get_campaigns error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// GET /api/campaigns/:campaign_id
apiRouter.get("/campaigns/:campaignId", getCurrentUser, async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const campaignsCol = db.collection("campaigns");
    const campaign = await campaignsCol.findOne(
      { id: campaignId, user_id: req.currentUser.id },
      { projection: { _id: 0 } }
    );
    if (!campaign) {
      return res.status(404).json({ detail: "Campaign not found" });
    }
    return res.json(campaign);
  } catch (err) {
    log("get_campaign error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// DELETE /api/campaigns/:campaign_id
apiRouter.delete("/campaigns/:campaignId", getCurrentUser, async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const campaignsCol = db.collection("campaigns");
    const result = await campaignsCol.deleteOne({
      id: campaignId,
      user_id: req.currentUser.id
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: "Campaign not found" });
    }
    return res.json({ message: "Campaign deleted" });
  } catch (err) {
    log("delete_campaign error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// ============ DASHBOARD STATS ============

// GET /api/dashboard/stats
apiRouter.get("/dashboard/stats", getCurrentUser, async (req, res) => {
  try {
    const campaignsCol = db.collection("campaigns");
    const campaigns = await campaignsCol
      .find({ user_id: req.currentUser.id }, { projection: { _id: 0 } })
      .limit(1000)
      .toArray();

    const total_campaigns = campaigns.length;
    const total_emails_sent = campaigns.reduce(
      (acc, c) => acc + (c.stats?.sent || 0),
      0
    );
    const total_positive = campaigns.reduce(
      (acc, c) => acc + (c.stats?.positive || 0),
      0
    );
    const total_negative = campaigns.reduce(
      (acc, c) => acc + (c.stats?.negative || 0),
      0
    );
    const total_no_reply = campaigns.reduce(
      (acc, c) => acc + (c.stats?.no_reply || 0),
      0
    );
    const active_campaigns = campaigns.filter(
      c => c.status !== "completed" && c.status !== "draft"
    ).length;

    const response_rate =
      total_emails_sent > 0
        ? ((total_positive + total_negative) / total_emails_sent) * 100
        : 0;

    return res.json({
      total_campaigns,
      active_campaigns,
      total_emails_sent,
      total_positive,
      total_negative,
      total_no_reply,
      response_rate: Math.round(response_rate * 10) / 10
    });
  } catch (err) {
    log("dashboard_stats error", err);
    return res.status(500).json({ detail: "Internal server error" });
  }
});

// ============ HEALTH CHECK ============

apiRouter.get("/", async (req, res) => {
  return res.json({ message: "Cold Email AI Agent API", status: "running" });
});

apiRouter.get("/health", async (req, res) => {
  return res.json({ status: "healthy" });
});

// Mount /api router
app.use("/api", apiRouter);

// ============ START / SHUTDOWN ============

async function start() {
  try {
    await client.connect();
    db = client.db(dbName);
    log("Connected to MongoDB");

    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  log("Shutting down...");
  await client.close();
  process.exit(0);
});

start();
