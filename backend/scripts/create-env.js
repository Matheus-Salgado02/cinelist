import readline from 'readline';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function main() {
  console.log('This helper creates a .env file for the backend.');
  console.log('You can paste a full MongoDB URI or enter components.');

  const full = (await question('Paste full MONGO_URI (leave empty to build from components): ')).trim();

  let mongoUri = full;
  if (!mongoUri) {
    const user = (await question('DB user: ')).trim();
    const pass = (await question('DB password (will NOT be shown): ')).trim();
    const host = (await question('Host (e.g. cluster0.abcd.mongodb.net): ')).trim();
    const db = (await question('Database name (e.g. tcc-mamahalls): ')).trim() || 'tcc-mamahalls';
    if (!user || !pass || !host) {
      console.error('Missing values. Aborting.');
      rl.close();
      process.exit(1);
    }
    // Note: do not attempt to URL-encode here; prefer user supply an encoded password if it has special chars
    mongoUri = `mongodb+srv://${user}:${pass}@${host}/${db}?retryWrites=true&w=majority&appName=tcc-mamahalls`;
  }

  const port = (await question('PORT (default 3333): ')).trim() || '3333';

  const envContent = `MONGO_URI=${mongoUri}\nPORT=${port}\n`;

  // compute project root path (two levels up from script)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, '..');
  const targetPath = resolve(projectRoot, '.env');

  await writeFile(targetPath, envContent, { encoding: 'utf8', flag: 'w' });
  console.log(`.env created at ${targetPath}`);
  console.log('Important: if your password contains @/: etc, please URL-encode it before using (or paste full encoded URI).');
  rl.close();
}

main().catch(err => {
  console.error('Error creating .env:', err);
  rl.close();
  process.exit(1);
});
