const Database = require('better-sqlite3');
const db = new Database('email_logs.db');

// Create tables on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id           TEXT PRIMARY KEY,
    name         TEXT,
    total        INTEGER DEFAULT 0,
    sent         INTEGER DEFAULT 0,
    failed       INTEGER DEFAULT 0,
    status       TEXT DEFAULT 'running',
    subject      TEXT,
    from_name    TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS email_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id  TEXT,
    to_email     TEXT NOT NULL,
    to_name      TEXT,
    subject      TEXT,
    from_email   TEXT,
    status       TEXT DEFAULT 'pending',
    message_id   TEXT,
    error        TEXT,
    sent_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_campaign ON email_logs(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_status   ON email_logs(status);
`);

const createCampaign = (id, data) => {
    db.prepare(`
    INSERT INTO campaigns (id, name, total, subject, from_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.name || id, data.total || 0, data.subject, data.from_name);
};

const updateCampaign = (id, data) => {
    const sets = Object.keys(data).map(k => `${k}=?`).join(', ');
    db.prepare(`UPDATE campaigns SET ${sets} WHERE id=?`)
        .run(...Object.values(data), id);
};

const logEmail = (data) => {
    db.prepare(`
    INSERT INTO email_logs
      (campaign_id, to_email, to_name, subject, from_email, status, message_id, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        data.campaign_id, data.to_email, data.to_name,
        data.subject, data.from_email, data.status,
        data.message_id || null, data.error || null
    );
};

const getCampaigns = (limit = 50) =>
    db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ?').all(limit);

const getCampaign = (id) =>
    db.prepare('SELECT * FROM campaigns WHERE id=?').get(id);

const getCampaignLogs = (campaign_id) =>
    db.prepare('SELECT * FROM email_logs WHERE campaign_id=? ORDER BY sent_at DESC').all(campaign_id);

module.exports = { createCampaign, updateCampaign, logEmail, getCampaigns, getCampaign, getCampaignLogs };
