#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envFilePath = path.join(__dirname, '.env.local');

console.log('🔧 Email Composer Environment Setup\n');

if (fs.existsSync(envFilePath)) {
  console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
  fs.copyFileSync(envFilePath, path.join(__dirname, '.env.local.backup'));
}

const questions = [
  {
    key: 'MAIL_USERNAME',
    prompt: 'Enter your Gmail address: ',
    default: 'your-email@gmail.com',
  },
  {
    key: 'MAIL_PASSWORD',
    prompt: 'Enter your Gmail App Password (not your regular password): ',
    default: 'your-app-password',
  },
  {
    key: 'MAIL_FROM_ADDRESS',
    prompt: 'Enter the "From" address (usually same as username): ',
    useUsername: true,
  },
];

let config = {
  MAIL_MAILER: 'smtp',
  MAIL_HOST: 'smtp.gmail.com',
  MAIL_PORT: '587',
  MAIL_ENCRYPTION: 'tls',
};

async function askQuestion(question) {
  return new Promise((resolve) => {
    const defaultValue = question.useUsername
      ? config.MAIL_USERNAME
      : question.default;
    const promptText =
      question.prompt +
      (defaultValue !== question.default ? `(${defaultValue}) ` : '');

    rl.question(promptText, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setupEnvironment() {
  console.log('Please provide your Gmail SMTP configuration:\n');
  console.log(
    '📋 Note: You need to use a Gmail App Password, not your regular password.'
  );
  console.log(
    '   Visit: https://myaccount.google.com/apppasswords to generate one.\n'
  );

  for (const question of questions) {
    const answer = await askQuestion(question);
    config[question.key] = answer;
  }

  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envFilePath, `# SMTP Email Configuration\n${envContent}\n`);

  console.log('\n✅ Environment configuration saved to .env.local');
  console.log('\n📧 Setup complete! You can now run the application with:');
  console.log('   pnpm dev\n');
  console.log('🔒 Security reminders:');
  console.log('   - Never commit .env.local to version control');
  console.log('   - Use App Passwords instead of your main Gmail password');
  console.log('   - Enable 2-Step Verification on your Gmail account\n');

  rl.close();
}

setupEnvironment().catch(console.error);
