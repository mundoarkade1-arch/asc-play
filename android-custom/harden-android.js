// Roda no build (chamado pelo setup.sh): endurece o AndroidManifest e cria os XML de seguranca.
const fs = require('fs'), path = require('path');
const main = path.join('android', 'app', 'src', 'main');
const mf = path.join(main, 'AndroidManifest.xml');
if (!fs.existsSync(mf)) { console.error('AndroidManifest.xml nao encontrado.'); process.exit(1); }
let x = fs.readFileSync(mf, 'utf8');
const m = x.match(/<application\b[^>]*>/);
if (!m) { console.error('Tag <application> nao encontrada.'); process.exit(1); }
let tag = m[0];
const set = (name, val) => {
  const re = new RegExp('\\s' + name + '="[^"]*"');
  tag = re.test(tag) ? tag.replace(re, ' ' + name + '="' + val + '"') : tag.replace('<application', '<application ' + name + '="' + val + '"');
};
set('android:allowBackup', 'false');
set('android:fullBackupContent', '@xml/backup_rules');
set('android:dataExtractionRules', '@xml/data_extraction_rules');
set('android:networkSecurityConfig', '@xml/network_security_config');
set('android:usesCleartextTraffic', 'true'); // necessario para servidores IPTV em http://
x = x.replace(m[0], tag);
for (const p of ['android.permission.POST_NOTIFICATIONS', 'android.permission.REQUEST_INSTALL_PACKAGES']) {
  if (!x.includes('"' + p + '"')) x = x.replace('<application', '<uses-permission android:name="' + p + '" />\n    <application');
}
fs.writeFileSync(mf, x);

const H = '<?xml version="1.0" encoding="utf-8"?>\n';
const ex = ['root', 'file', 'database', 'sharedpref', 'external'];
const files = {
  // So certificados do sistema: Charles/mitmproxy com certificado instalado pelo usuario nao interceptam.
  // HTTP puro segue liberado porque muitos servidores IPTV so funcionam assim.
  'network_security_config.xml': H + '<network-security-config>\n  <base-config cleartextTrafficPermitted="true">\n    <trust-anchors><certificates src="system" /></trust-anchors>\n  </base-config>\n</network-security-config>\n',
  'data_extraction_rules.xml': H + '<data-extraction-rules>\n  <cloud-backup>' + ex.map(d => '<exclude domain="' + d + '" />').join('') + '</cloud-backup>\n  <device-transfer>' + ex.map(d => '<exclude domain="' + d + '" />').join('') + '</device-transfer>\n</data-extraction-rules>\n',
  'backup_rules.xml': H + '<full-backup-content>' + ex.map(d => '<exclude domain="' + d + '" path="." />').join('') + '</full-backup-content>\n',
};
const dst = path.join(main, 'res', 'xml');
fs.mkdirSync(dst, { recursive: true });
for (const [n, c] of Object.entries(files)) fs.writeFileSync(path.join(dst, n), c);
console.log('Seguranca do Android aplicada.');
