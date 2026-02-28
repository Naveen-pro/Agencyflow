const crypto = require('crypto');
const key = 'wa_' + crypto.randomBytes(32).toString('hex');

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║   YOUR WHATSAPP API KEY (save this somewhere safe) ║');
console.log('╠═══════════════════════════════════════════════════╣');
console.log(`║  ${key}  ║`);
console.log('╚═══════════════════════════════════════════════════╝');
console.log('\nAdd to whatsapp-api/.env:');
console.log(`WA_API_KEY=${key}`);
console.log('\nAdd to agencyflow backend/.env:');
console.log(`WA_API_KEY=${key}`);
console.log(`WA_API_URL=http://localhost:7002\n`);
