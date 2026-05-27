import pg from "pg";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Dual-mode database pool manager
// Connection is dynamically initialized either through DATABASE_URL (PostgreSQL) or Local JSON Fallback (.data/db.json)

const DATA_DIR = path.join(process.cwd(), ".data");
const JSON_DB_PATH = path.join(DATA_DIR, "db.json");

interface DbSchema {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
    skills: string[];
    resumeText: string;
    experienceLevel?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    createdAt: string;
  }>;
  job_applications: Array<{
    id: string;
    userId: string;
    company: string;
    title: string;
    location: string;
    salary: string;
    status: "saved" | "applied" | "interviewing" | "offered" | "rejected";
    matchRate: number;
    appliedDate: string;
    portal: "LinkedIn" | "Indeed" | "Naukri" | "Manual";
    link: string;
    notes: string;
    coverLetter: string;
    createdAt: string;
  }>;
  automation_logs: Array<{
    id: string;
    userId: string;
    timestamp: string;
    level: "info" | "success" | "warning" | "error" | "agent";
    message: string;
    createdAt: string;
  }>;
  resume_uploads: Array<{
    id: string;
    userId: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    parsedText: string;
  }>;
}

const defaultSchema: DbSchema = {
  users: [
    {
      id: "user-default",
      email: "devdattasalunkhe0707@gmail.com",
      passwordHash: crypto.createHash("sha256").update("password123").digest("hex"),
      name: "Devdatta Salunkhe",
      phone: "+1 (555) 349-8812",
      skills: ["React", "TypeScript", "Node.js", "Express", "Tailwind CSS", "Next.js", "Python", "FastAPI", "PostgreSQL"],
      resumeText: `DEVYAT SALUNKHE
devdattasalunkhe0707@gmail.com | Silicon Valley, CA
Full-Stack Software Engineer | React, Node.js, Python, PostgreSQL

EXPERIENCE
Full Stack Engineer - TechCorp Solutions (2024 - Present)
- Built enterprise scale web dashboards using React 18 and Next.js, boosting user signups by 24%.
- Designed custom RESTful Microservices in FastAPI and Python connected to PostgreSQL database warehouses.
- Developed background automation workflows using Selenium to scrape internal intelligence pipelines.

Frontend Developer - Innovate Digital (2022 - 2024)
- Crafted eye-safe modern user interfaces with Tailwind CSS and Framer Motion.
- Refactored legacy monolithic application into modular component architecture, reducing loadtimes by 40%.

SKILLS
Frontend: React, Next.js, TypeScript, Tailwind CSS, Redux Toolkit, Framer Motion
Backend: Node.js, Express, FastAPI, Python, REST APIs, GraphQL
Databases & Cloud: PostgreSQL, MongoDB, Redis, Docker, AWS (S3, EC2), Render, Vercel
Automation & Tools: Selenium, LangChain, Git, CI/CD, Jesta`,
      experienceLevel: "Mid-Level",
      githubUrl: "https://github.com/devdatta-salunkhe",
      linkedinUrl: "https://linkedin.com/in/devdatta-salunkhe",
      createdAt: new Date().toISOString()
    }
  ],
  job_applications: [
    {
      id: "app-1",
      userId: "user-default",
      company: "Stripe",
      title: "Senior Software Engineer - React Foundations",
      location: "San Francisco, CA (Hybrid)",
      salary: "$165k - $210k",
      status: "interviewing",
      matchRate: 94,
      appliedDate: "2026-05-24",
      portal: "LinkedIn",
      link: "https://linkedin.com/jobs/view/stripe-react-foundations",
      notes: "First Technical Screen scheduled for next week. Reviewing Stripe developer API products.",
      coverLetter: "Dear Stripe Hiring Team,\n\nI am thrilled to submit my application...",
      createdAt: new Date().toISOString()
    },
    {
      id: "app-2",
      userId: "user-default",
      company: "Vercel",
      title: "Frontend Frameworks Core Engineer",
      location: "Remote (USA/Canada)",
      salary: "$170k - $215k",
      status: "applied",
      matchRate: 88,
      appliedDate: "2026-05-25",
      portal: "Indeed",
      link: "https://indeed.com/jobs/view/vercel-core-frameworks",
      notes: "Self-referred via developer advocate contact on Twitter. Automation matched keywords cleanly.",
      coverLetter: "Dear Vercel Engineering Team,\n\nAs a passionate Next.js developer...",
      createdAt: new Date().toISOString()
    },
    {
      id: "app-3",
      userId: "user-default",
      company: "Linear",
      title: "Product Engineer (UI Foundations)",
      location: "Remote",
      salary: "Equity + $180k",
      status: "applied",
      matchRate: 91,
      appliedDate: "2026-05-26",
      portal: "LinkedIn",
      link: "https://linkedin.com/jobs/view/linear-product-engineer",
      notes: "Applied automatically via AIHawk Agent setup. Form-questions automatically answered by Gemini agent.",
      coverLetter: "Dear Linear Team,\n\nLinear is known for its legendary craft...",
      createdAt: new Date().toISOString()
    },
    {
      id: "app-4",
      userId: "user-default",
      company: "Supabase",
      title: "Developer Advocate (Full-Stack PostgreSQL)",
      location: "Singapore / Remote",
      salary: "$150k - $185k",
      status: "saved",
      matchRate: 85,
      appliedDate: "2026-05-27",
      portal: "Manual",
      link: "https://supabase.com/careers/da-postgresql",
      notes: "Queued for automated run tonight. Matches PostgreSQL and TypeScript profiles perfectly.",
      coverLetter: "Dear Supabase Team,\n\nI love open source and I love database analytics...",
      createdAt: new Date().toISOString()
    }
  ],
  automation_logs: [],
  resume_uploads: []
};

let dbClient: pg.Pool | null = null;
let usePostgres = false;
let currentDbUrl = process.env.DATABASE_URL || "";

export function getDbMode(): { mode: "PostgreSQL" | "SQLite-JSON"; isConnected: boolean; url?: string } {
  return {
    mode: usePostgres ? "PostgreSQL" : "SQLite-JSON",
    isConnected: usePostgres ? !!dbClient : true,
    url: usePostgres ? currentDbUrl.replace(/:[^:@]+@/, ":****@") : JSON_DB_PATH
  };
}

// Ensure local backup folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory caching for JSON fallback
let memoryDb: DbSchema = defaultSchema;

function loadJsonDb() {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const raw = fs.readFileSync(JSON_DB_PATH, "utf-8");
      memoryDb = { ...defaultSchema, ...JSON.parse(raw) };
    } else {
      saveJsonDb();
    }
  } catch (err) {
    console.error("Failed to load JSON database backup, reverting to internal defaults", err);
  }
}

function saveJsonDb() {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to JSON backup storage file", err);
  }
}

// Core DB initializer
export async function initializeDatabase(customDbUrl?: string): Promise<boolean> {
  const urlToUse = customDbUrl || process.env.DATABASE_URL || "";
  
  if (urlToUse) {
    try {
      console.log(`[DB] Testing Postgres Database Connection...`);
      const testPool = new pg.Pool({
        connectionString: urlToUse,
        ssl: urlToUse.includes("localhost") || urlToUse.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
      });
      
      // Attempt query to verify connection
      await testPool.query("SELECT NOW()");
      
      console.log(`[DB] Postgres Connection SUCCESS! Creating tables if they do not exist...`);
      
      // Auto-bootstrap schemas in PostgreSQL
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          skills TEXT[],
          resume_text TEXT,
          experience_level VARCHAR(100),
          github_url VARCHAR(255),
          linkedin_url VARCHAR(255),
          created_at TIMESTAMP NOT NULL
        )
      `);

      await testPool.query(`
        CREATE TABLE IF NOT EXISTS job_applications (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          salary VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL,
          match_rate INTEGER NOT NULL,
          applied_date VARCHAR(50) NOT NULL,
          portal VARCHAR(100) NOT NULL,
          link TEXT,
          notes TEXT,
          cover_letter TEXT,
          created_at TIMESTAMP NOT NULL
        )
      `);

      await testPool.query(`
        CREATE TABLE IF NOT EXISTS automation_logs (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
          timestamp VARCHAR(50) NOT NULL,
          level VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
      `);

      await testPool.query(`
        CREATE TABLE IF NOT EXISTS resume_uploads (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          uploaded_at TIMESTAMP NOT NULL,
          parsed_text TEXT NOT NULL
        )
      `);

      // Seed default user if tables are empty
      const userCheck = await testPool.query("SELECT 1 FROM users LIMIT 1");
      if (userCheck.rowCount === 0) {
        console.log("[DB] Seeding default records into PostgreSQL...");
        const defUser = defaultSchema.users[0];
        await testPool.query(`
          INSERT INTO users (id, email, password_hash, name, phone, skills, resume_text, experience_level, github_url, linkedin_url, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          defUser.id, defUser.email, defUser.passwordHash, defUser.name, defUser.phone, 
          defUser.skills, defUser.resumeText, defUser.experienceLevel, defUser.githubUrl, defUser.linkedinUrl, defUser.createdAt
        ]);

        for (const app of defaultSchema.job_applications) {
          await testPool.query(`
            INSERT INTO job_applications (id, user_id, company, title, location, salary, status, match_rate, applied_date, portal, link, notes, cover_letter, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            app.id, app.userId, app.company, app.title, app.location, app.salary, 
            app.status, app.matchRate, app.appliedDate, app.portal, app.link, app.notes, app.coverLetter, app.createdAt
          ]);
        }
      }

      dbClient = testPool;
      usePostgres = true;
      currentDbUrl = urlToUse;
      return true;
    } catch (err) {
      console.error("[DB] PostgreSQL Connection failed! Rolling back to persistent JSON-SQLite filesystem database.", err);
      usePostgres = false;
      dbClient = null;
      loadJsonDb();
      return false;
    }
  } else {
    console.log("[DB] No Postgres URL configured. Using local JSON SQLite database core.");
    usePostgres = false;
    dbClient = null;
    loadJsonDb();
    return true;
  }
}

// Dynamic database query commands supporting both backends
export async function getUsers(): Promise<DbSchema["users"]> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("SELECT * FROM users ORDER BY created_at DESC");
    return res.rows.map(row => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      phone: row.phone,
      skills: row.skills || [],
      resumeText: row.resume_text || "",
      experienceLevel: row.experience_level,
      githubUrl: row.github_url,
      linkedinUrl: row.linkedin_url,
      createdAt: row.created_at.toISOString()
    }));
  } else {
    loadJsonDb();
    return memoryDb.users;
  }
}

export async function getUserByEmail(email: string): Promise<DbSchema["users"][0] | null> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      phone: row.phone,
      skills: row.skills || [],
      resumeText: row.resume_text || "",
      experienceLevel: row.experience_level,
      githubUrl: row.github_url,
      linkedinUrl: row.linkedin_url,
      createdAt: row.created_at.toISOString()
    };
  } else {
    loadJsonDb();
    const user = memoryDb.users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    return user || null;
  }
}

export async function getUserById(id: string): Promise<DbSchema["users"][0] | null> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("SELECT * FROM users WHERE id = $1", [id]);
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      phone: row.phone,
      skills: row.skills || [],
      resumeText: row.resume_text || "",
      experienceLevel: row.experience_level,
      githubUrl: row.github_url,
      linkedinUrl: row.linkedin_url,
      createdAt: row.created_at.toISOString()
    };
  } else {
    loadJsonDb();
    const user = memoryDb.users.find(u => u.id === id);
    return user || null;
  }
}

export async function createUser(user: Partial<DbSchema["users"][0]>): Promise<DbSchema["users"][0]> {
  const newUser = {
    id: user.id || "user-" + Math.random().toString(36).substr(2, 9),
    email: (user.email || "").toLowerCase().trim(),
    passwordHash: user.passwordHash || "",
    name: user.name || "Anonymous Professional",
    phone: user.phone || "",
    skills: user.skills || [],
    resumeText: user.resumeText || "",
    experienceLevel: user.experienceLevel || "Mid-Level",
    githubUrl: user.githubUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    createdAt: new Date().toISOString()
  };

  if (usePostgres && dbClient) {
    await dbClient.query(`
      INSERT INTO users (id, email, password_hash, name, phone, skills, resume_text, experience_level, github_url, linkedin_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      newUser.id, newUser.email, newUser.passwordHash, newUser.name, newUser.phone,
      newUser.skills, newUser.resumeText, newUser.experienceLevel, newUser.githubUrl, newUser.linkedinUrl, newUser.createdAt
    ]);
  } else {
    loadJsonDb();
    memoryDb.users.push(newUser);
    saveJsonDb();
  }
  return newUser;
}

export async function updateUser(id: string, fields: Partial<DbSchema["users"][0]>): Promise<DbSchema["users"][0] | null> {
  const current = await getUserById(id);
  if (!current) return null;

  const updated = { ...current, ...fields };

  if (usePostgres && dbClient) {
    await dbClient.query(`
      UPDATE users SET 
        name = $1, email = $2, phone = $3, skills = $4, resume_text = $5, 
        experience_level = $6, github_url = $7, linkedin_url = $8
      WHERE id = $9
    `, [
      updated.name, updated.email, updated.phone, updated.skills, updated.resumeText,
      updated.experienceLevel, updated.githubUrl, updated.linkedinUrl, id
    ]);
  } else {
    loadJsonDb();
    const idx = memoryDb.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      memoryDb.users[idx] = updated;
      saveJsonDb();
    }
  }
  return updated;
}

export async function getJobApplications(userId: string): Promise<DbSchema["job_applications"]> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return res.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      company: row.company,
      title: row.title,
      location: row.location,
      salary: row.salary,
      status: row.status,
      matchRate: row.match_rate,
      appliedDate: row.applied_date,
      portal: row.portal,
      link: row.link || "",
      notes: row.notes || "",
      coverLetter: row.cover_letter || "",
      createdAt: row.created_at.toISOString()
    }));
  } else {
    loadJsonDb();
    return memoryDb.job_applications.filter(app => app.userId === userId);
  }
}

export async function createJobApplication(app: Partial<DbSchema["job_applications"][0]>): Promise<DbSchema["job_applications"][0]> {
  const newApp = {
    id: app.id || "app-" + Date.now() + Math.random().toString(36).substr(2, 4),
    userId: app.userId || "user-default",
    company: app.company || "Unknown Enterprise",
    title: app.title || "Software Developer",
    location: app.location || "Remote",
    salary: app.salary || "DOE",
    status: app.status || "saved",
    matchRate: app.matchRate || 75,
    appliedDate: app.appliedDate || new Date().toISOString().split("T")[0],
    portal: app.portal || "Manual",
    link: app.link || "",
    notes: app.notes || "",
    coverLetter: app.coverLetter || "",
    createdAt: new Date().toISOString()
  };

  if (usePostgres && dbClient) {
    await dbClient.query(`
      INSERT INTO job_applications (id, user_id, company, title, location, salary, status, match_rate, applied_date, portal, link, notes, cover_letter, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      newApp.id, newApp.userId, newApp.company, newApp.title, newApp.location, newApp.salary,
      newApp.status, newApp.matchRate, newApp.appliedDate, newApp.portal, newApp.link, newApp.notes, newApp.coverLetter, newApp.createdAt
    ]);
  } else {
    loadJsonDb();
    memoryDb.job_applications.unshift(newApp);
    saveJsonDb();
  }
  return newApp;
}

export async function updateJobApplication(id: string, userId: string, fields: Partial<DbSchema["job_applications"][0]>): Promise<DbSchema["job_applications"][0] | null> {
  if (usePostgres && dbClient) {
    const check = await dbClient.query("SELECT * FROM job_applications WHERE id = $1 AND user_id = $2", [id, userId]);
    if (check.rowCount === 0) return null;
    const current = check.rows[0];
    const updated = {
      company: fields.company !== undefined ? fields.company : current.company,
      title: fields.title !== undefined ? fields.title : current.title,
      location: fields.location !== undefined ? fields.location : current.location,
      salary: fields.salary !== undefined ? fields.salary : current.salary,
      status: fields.status !== undefined ? fields.status : current.status,
      matchRate: fields.matchRate !== undefined ? Number(fields.matchRate) : current.match_rate,
      appliedDate: fields.appliedDate !== undefined ? fields.appliedDate : current.applied_date,
      portal: fields.portal !== undefined ? fields.portal : current.portal,
      link: fields.link !== undefined ? fields.link : current.link,
      notes: fields.notes !== undefined ? fields.notes : current.notes,
      coverLetter: fields.coverLetter !== undefined ? fields.coverLetter : current.cover_letter,
    };

    await dbClient.query(`
      UPDATE job_applications SET
        company = $1, title = $2, location = $3, salary = $4, status = $5,
        match_rate = $6, applied_date = $7, portal = $8, link = $9, notes = $10, cover_letter = $11
      WHERE id = $12 AND user_id = $13
    `, [
      updated.company, updated.title, updated.location, updated.salary, updated.status,
      updated.matchRate, updated.appliedDate, updated.portal, updated.link, updated.notes, updated.coverLetter, id, userId
    ]);

    return { id, userId, ...updated, createdAt: current.created_at.toISOString() };
  } else {
    loadJsonDb();
    const idx = memoryDb.job_applications.findIndex(app => app.id === id && app.userId === userId);
    if (idx === -1) return null;
    const updated = { ...memoryDb.job_applications[idx], ...fields };
    memoryDb.job_applications[idx] = updated;
    saveJsonDb();
    return updated;
  }
}

export async function deleteJobApplication(id: string, userId: string): Promise<boolean> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("DELETE FROM job_applications WHERE id = $1 AND user_id = $2", [id, userId]);
    return (res.rowCount || 0) > 0;
  } else {
    loadJsonDb();
    const len = memoryDb.job_applications.length;
    memoryDb.job_applications = memoryDb.job_applications.filter(app => !(app.id === id && app.userId === userId));
    saveJsonDb();
    return memoryDb.job_applications.length < len;
  }
}

export async function getAutomationLogs(userId: string): Promise<DbSchema["automation_logs"]> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("SELECT * FROM automation_logs WHERE user_id = $1 ORDER BY created_at ASC", [userId]);
    return res.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      timestamp: row.timestamp,
      level: row.level,
      message: row.message,
      createdAt: row.created_at.toISOString()
    }));
  } else {
    loadJsonDb();
    return memoryDb.automation_logs.filter(log => log.userId === userId);
  }
}

export async function createAutomationLog(log: Partial<DbSchema["automation_logs"][0]>): Promise<DbSchema["automation_logs"][0]> {
  const newLog = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    userId: log.userId || "user-default",
    timestamp: log.timestamp || new Date().toLocaleTimeString(),
    level: log.level || "info",
    message: log.message || "",
    createdAt: new Date().toISOString()
  };

  if (usePostgres && dbClient) {
    await dbClient.query(`
      INSERT INTO automation_logs (id, user_id, timestamp, level, message, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      newLog.id, newLog.userId, newLog.timestamp, newLog.level, newLog.message, newLog.createdAt
    ]);
  } else {
    loadJsonDb();
    memoryDb.automation_logs.push(newLog);
    if (memoryDb.automation_logs.length > 200) {
      memoryDb.automation_logs.shift();
    }
    saveJsonDb();
  }
  return newLog;
}

export async function clearAutomationLogs(userId: string): Promise<void> {
  if (usePostgres && dbClient) {
    await dbClient.query("DELETE FROM automation_logs WHERE user_id = $1", [userId]);
  } else {
    loadJsonDb();
    memoryDb.automation_logs = memoryDb.automation_logs.filter(log => log.userId !== userId);
    saveJsonDb();
  }
}

export async function getResumeUploads(userId: string): Promise<DbSchema["resume_uploads"]> {
  if (usePostgres && dbClient) {
    const res = await dbClient.query("SELECT * FROM resume_uploads WHERE user_id = $1 ORDER BY uploaded_at DESC", [userId]);
    return res.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      filename: row.filename,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      uploadedAt: row.uploaded_at.toISOString(),
      parsedText: row.parsed_text
    }));
  } else {
    loadJsonDb();
    return memoryDb.resume_uploads.filter(res => res.userId === userId);
  }
}

export async function saveResumeUpload(item: Partial<DbSchema["resume_uploads"][0]>): Promise<DbSchema["resume_uploads"][0]> {
  const newItem = {
    id: "res-" + Date.now() + Math.random().toString(36).substr(2, 5),
    userId: item.userId || "user-default",
    filename: item.filename || "resume.txt",
    fileSize: item.fileSize || 0,
    mimeType: item.mimeType || "text/plain",
    uploadedAt: new Date().toISOString(),
    parsedText: item.parsedText || ""
  };

  if (usePostgres && dbClient) {
    await dbClient.query(`
      INSERT INTO resume_uploads (id, user_id, filename, file_size, mime_type, uploaded_at, parsed_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      newItem.id, newItem.userId, newItem.filename, newItem.fileSize, newItem.mimeType, newItem.uploadedAt, newItem.parsedText
    ]);
  } else {
    loadJsonDb();
    memoryDb.resume_uploads.unshift(newItem);
    saveJsonDb();
  }
  return newItem;
}
