#!/usr/bin/env node

/**
 * Deployment Readiness Check Script
 * Verifies that the project is ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found', 'red');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = ['build', 'start', 'dev'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

  if (missingScripts.length === 0) {
    log('✅ Required npm scripts present', 'green');
    return true;
  } else {
    log(`❌ Missing npm scripts: ${missingScripts.join(', ')}`, 'red');
    return false;
  }
}

function checkEnvExample() {
  const envPath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envPath)) {
    log('❌ .env.example not found', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

  if (missingVars.length === 0) {
    log('✅ Required environment variables documented', 'green');
    return true;
  } else {
    log(`❌ Missing environment variables in .env.example: ${missingVars.join(', ')}`, 'red');
    return false;
  }
}

function checkGitIgnore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    log('❌ .gitignore not found', 'red');
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  // Check for environment files (either .env* pattern or specific entries)
  const hasEnvFiles = gitignoreContent.includes('.env*') || 
                     (gitignoreContent.includes('.env.local') && gitignoreContent.includes('.env'));
  
  const hasNodeModules = gitignoreContent.includes('node_modules');
  
  const issues = [];
  if (!hasEnvFiles) issues.push('environment files (.env* or .env.local)');
  if (!hasNodeModules) issues.push('node_modules');

  if (issues.length === 0) {
    log('✅ .gitignore properly configured', 'green');
    return true;
  } else {
    log(`❌ Missing entries in .gitignore: ${issues.join(', ')}`, 'red');
    return false;
  }
}

function checkDatabaseScripts() {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const requiredScripts = ['Database.sql', 'fix-permissions.sql', 'setup-users.sql'];
  
  let allPresent = true;
  requiredScripts.forEach(script => {
    const scriptPath = path.join(scriptsDir, script);
    if (!fs.existsSync(scriptPath)) {
      log(`❌ Database script missing: ${script}`, 'red');
      allPresent = false;
    }
  });

  if (allPresent) {
    log('✅ Database setup scripts present', 'green');
  }
  
  return allPresent;
}

function runDeploymentCheck() {
  log('\n🚀 Vercel Deployment Readiness Check', 'bold');
  log('=====================================\n', 'blue');

  const checks = [
    () => checkFile('package.json', 'Package.json exists'),
    () => checkPackageJson(),
    () => checkFile('next.config.mjs', 'Next.js config exists'),
    () => checkFile('vercel.json', 'Vercel config exists'),
    () => checkFile('.env.example', 'Environment example exists'),
    () => checkEnvExample(),
    () => checkFile('.gitignore', '.gitignore exists'),
    () => checkGitIgnore(),
    () => checkFile('README.md', 'README.md exists'),
    () => checkFile('VERCEL-DEPLOYMENT.md', 'Deployment guide exists'),
    () => checkDatabaseScripts(),
    () => checkFile('app/layout.tsx', 'Next.js app structure'),
    () => checkFile('components/ui', 'UI components directory'),
    () => checkFile('lib/supabase.ts', 'Supabase configuration')
  ];

  const results = checks.map(check => check());
  const passed = results.filter(Boolean).length;
  const total = results.length;

  log('\n📊 Results:', 'bold');
  log(`Passed: ${passed}/${total} checks`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 Your project is ready for Vercel deployment!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Push your code to GitHub', 'blue');
    log('2. Connect your repository to Vercel', 'blue');
    log('3. Add environment variables in Vercel dashboard', 'blue');
    log('4. Deploy and test your application', 'blue');
    log('\nFor detailed instructions, see VERCEL-DEPLOYMENT.md', 'blue');
  } else {
    log('\n⚠️  Please fix the issues above before deploying', 'yellow');
    log('\nFor help, check:', 'blue');
    log('- VERCEL-DEPLOYMENT.md for deployment guide', 'blue');
    log('- README.md for setup instructions', 'blue');
    log('- .env.example for required environment variables', 'blue');
  }

  log('\n');
  return passed === total;
}

if (require.main === module) {
  runDeploymentCheck();
}

module.exports = { runDeploymentCheck };