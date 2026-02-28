const crypto = require('crypto');

const key = 'email_' + crypto.randomBytes(32).toString('hex');

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║   YOUR GMAIL API KEY (save this somewhere safe) ║');
console.log('╠════════════════════════════════════════════════╣');
console.log(`║  ${key}  ║`);
console.log('╚════════════════════════════════════════════════╝');
console.log('\nAdd this to gmail-api/.env:');
console.log(`EMAIL_API_KEY=${key}`);
console.log('\nAdd this to agencyflow backend/.env:');
console.log(`EMAIL_API_KEY=${key}`);
console.log(`EMAIL_API_URL=http://localhost:7003\n`);
