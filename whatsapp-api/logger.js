const Database = require('better-sqlite3');
const db = new Database('whatsapp_logs.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id           TEXT PRIMARY KEY,
    total        INTEGER DEFAULT 0,
    sent         INTEGER DEFAULT 0,
    failed       INTEGER DEFAULT 0,
    status       TEXT DEFAULT 'running',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS message_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id  TEXT,
    phone        TEXT NOT NULL,
    name         TEXT,
    message      TEXT,
    status       TEXT DEFAULT 'pending',
    message_id   TEXT,
    error        TEXT,
    direction    TEXT DEFAULT 'out',
    sent_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_camp ON message_logs(campaign_id);
`);

const createCampaign = (id, total) =>
    db.prepare('INSERT INTO campaigns (id, total) VALUES (?, ?)').run(id, total);

const updateCampaign = (id, data) => {
    const sets = Object.keys(data).map(k => `${k}=?`).join(', ');
    db.prepare(`UPDATE campaigns SET ${sets} WHERE id=?`).run(...Object.values(data), id);
};

const logMessage = (data) => {
    db.prepare(`
    INSERT INTO message_logs (campaign_id, phone, name, message, status, message_id, error, direction)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        data.campaign_id, data.phone, data.name || '',
        data.message, data.status,
        data.message_id || null, data.error || null,
        data.direction || 'out'
    );
};

const getCampaigns = () =>
    db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 50').all();

const getCampaignLogs = (id) =>
    db.prepare('SELECT * FROM message_logs WHERE campaign_id=? ORDER BY sent_at DESC').all(id);

module.exports = { createCampaign, updateCampaign, logMessage, getCampaigns, getCampaignLogs };
