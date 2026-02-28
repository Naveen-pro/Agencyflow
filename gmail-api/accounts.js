/**
 * Gmail Account Rotation Manager
 *
 * HOW TO GET GMAIL APP PASSWORD (do this for each Gmail account):
 * 1. Go to myaccount.google.com
 * 2. Security → 2-Step Verification → ENABLE IT
 * 3. Search "App passwords" at top of page
 * 4. App: Mail → Device: Other → Name: AgencyFlow
 * 5. Copy the 16-character password (no spaces)
 *
 * Add accounts in .env like this:
 *   GMAIL_ACCOUNT_1=youremail@gmail.com
 *   GMAIL_PASSWORD_1=abcdabcdabcdabcd
 *   GMAIL_ACCOUNT_2=another@gmail.com
 *   GMAIL_PASSWORD_2=efghefghefghefgh
 *
 * Each Gmail account can send 500 emails/day FREE.
 * 2 accounts = 1000/day. 10 accounts = 5000/day.
 */

require('dotenv').config();

class AccountManager {
    constructor() {
        this.accounts = [];
        this.currentIndex = 0;
        this.dailyUsage = {};   // { email: count }
        this.DAILY_LIMIT = 480; // Stay under Gmail's 500/day limit

        this.loadAccounts();
    }

    loadAccounts() {
        let i = 1;
        while (process.env[`GMAIL_ACCOUNT_${i}`]) {
            const email = process.env[`GMAIL_ACCOUNT_${i}`];
            const password = process.env[`GMAIL_PASSWORD_${i}`];
            if (email && password) {
                this.accounts.push({ email, password, index: i });
                if (this.dailyUsage[email] === undefined) {
                    this.dailyUsage[email] = 0;
                }
                console.log(`✅ Loaded Gmail account ${i}: ${email}`);
            }
            i++;
        }

        if (this.accounts.length === 0) {
            console.error('❌ No Gmail accounts found in .env!');
            console.error('Add GMAIL_ACCOUNT_1 and GMAIL_PASSWORD_1 to .env');
            // process.exit(1); // Avoid exiting in agent mode if possible, but the code needs it
        }

        console.log(`📧 Total accounts: ${this.accounts.length} (Max ${this.accounts.length * this.DAILY_LIMIT} emails/day)`);
    }

    getNextAccount() {
        // Find accounts that haven't hit the limit
        const available = this.accounts.filter(
            acc => (this.dailyUsage[acc.email] || 0) < this.DAILY_LIMIT
        );

        if (available.length === 0) {
            throw new Error(`All ${this.accounts.length} Gmail accounts have hit daily limit (480/day). Total sent today: ${Object.values(this.dailyUsage).reduce((a, b) => a + b, 0)}`);
        }

        // Pick the account with the minimum usage (balances the load)
        // For 100k+ scale, we sort once or use a smarter pointer if performance becomes an issue
        available.sort((a, b) => (this.dailyUsage[a.email] || 0) - (this.dailyUsage[b.email] || 0));

        return available[0];
    }

    incrementUsage(email) {
        this.dailyUsage[email] = (this.dailyUsage[email] || 0) + 1;
    }

    resetDailyUsage() {
        // Reset at midnight every day
        this.accounts.forEach(acc => {
            this.dailyUsage[acc.email] = 0;
        });
        console.log('🔄 Daily email usage reset at midnight');
    }

    getStats() {
        return this.accounts.map(acc => ({
            email: acc.email,
            used_today: this.dailyUsage[acc.email] || 0,
            remaining: this.DAILY_LIMIT - (this.dailyUsage[acc.email] || 0),
            limit: this.DAILY_LIMIT,
        }));
    }
}

// Reset usage every midnight
const manager = new AccountManager();
const msToMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
};
setTimeout(function resetLoop() {
    manager.resetDailyUsage();
    setTimeout(resetLoop, 24 * 60 * 60 * 1000);
}, msToMidnight());

module.exports = manager;
