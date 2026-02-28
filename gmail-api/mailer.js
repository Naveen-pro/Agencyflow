const nodemailer = require('nodemailer');
const accounts = require('./accounts');

// Cache transporters per account email to avoid reconnecting
const transporterCache = {};

function getTransporter(account) {
    if (!transporterCache[account.email]) {
        transporterCache[account.email] = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: account.email,
                pass: account.password,   // Gmail App Password (16 chars)
            },
            pool: true,       // Keep connection alive
            maxConnections: 3,
            maxMessages: 50,
        });
    }
    return transporterCache[account.email];
}

/**
 * Send a single email
 */
async function sendEmail({ to, subject, html, text, from_name, reply_to }) {
    const account = accounts.getNextAccount();
    const transporter = getTransporter(account);

    const fromLabel = from_name
        ? `"${from_name}" <${account.email}>`
        : account.email;

    const mailOptions = {
        from: fromLabel,
        to: to,
        subject: subject,
        html: html || `<p>${text || ''}</p>`,
        text: text || '',
    };

    if (reply_to) mailOptions.replyTo = reply_to;

    const info = await transporter.sendMail(mailOptions);
    accounts.incrementUsage(account.email);

    return {
        success: true,
        message_id: info.messageId,
        from: account.email,
        to: to,
    };
}

/**
 * Send bulk emails to multiple contacts
 * Supports {name} {email} {company} personalization
 */
async function sendBulkEmails({
    contacts,
    subject,
    html,
    from_name,
    reply_to,
    delay_ms = 1200,
    onProgress,
}) {
    const results = [];

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const email = contact.email;
        const name = contact.name || 'there';
        const company = contact.company || '';

        // Personalize
        const personalSubject = subject
            .replace(/{name}/g, name)
            .replace(/{company}/g, company)
            .replace(/{email}/g, email);

        const personalHtml = (html || '')
            .replace(/{name}/g, name)
            .replace(/{company}/g, company)
            .replace(/{email}/g, email);

        try {
            const result = await sendEmail({
                to: email,
                subject: personalSubject,
                html: personalHtml,
                from_name: from_name,
                reply_to: reply_to,
            });

            const log = {
                index: i + 1,
                total: contacts.length,
                email: email,
                name: name,
                status: 'sent',
                id: result.message_id,
                from: result.from,
            };

            results.push(log);
            if (onProgress) onProgress(log);

        } catch (err) {
            const log = {
                index: i + 1,
                total: contacts.length,
                email: email,
                name: name,
                status: 'failed',
                error: err.message,
            };
            results.push(log);
            if (onProgress) onProgress(log);
        }

        // Delay between sends — Gmail rate limit protection
        if (i < contacts.length - 1) {
            await new Promise(r => setTimeout(r, delay_ms));
        }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return { results, sent, failed, total: contacts.length };
}

/**
 * Test SMTP connection for all accounts
 */
async function verifyAllAccounts() {
    const results = [];
    const allAccounts = accounts.accounts;

    for (const account of allAccounts) {
        const transporter = getTransporter(account);
        try {
            await transporter.verify();
            results.push({ email: account.email, status: 'ok' });
        } catch (err) {
            results.push({ email: account.email, status: 'error', error: err.message });
        }
    }
    return results;
}

module.exports = { sendEmail, sendBulkEmails, verifyAllAccounts };
