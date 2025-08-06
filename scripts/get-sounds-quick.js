// Quick Sound Files Setup for Tomm&Danny Café
// This script provides direct links to free notification sounds

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🎵 Quick Sound Files Setup');
console.log('==========================\n');

// Check if sounds directory exists
const soundsDir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(soundsDir)) {
  console.log('📁 Creating sounds directory...');
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✅ Sounds directory created at: public/sounds/\n');
}

console.log('🚀 QUICK SETUP OPTIONS:\n');

console.log('Option 1: Download from Free Sound Websites');
console.log('===========================================');
console.log('1. Visit: https://freesound.org/');
console.log('2. Search for: "notification sound"');
console.log('3. Download 3 different sounds (1-3 seconds each)');
console.log('4. Rename them to: new-order.mp3, service-request.mp3, urgent.mp3');
console.log('5. Place them in public/sounds/ directory\n');

console.log('Option 2: Use System Default Sounds (Temporary)');
console.log('===============================================');
console.log('1. Find notification sounds in your system:');
console.log('   - Windows: C:\\Windows\\Media\\');
console.log('   - Mac: /System/Library/Sounds/');
console.log('   - Linux: /usr/share/sounds/');
console.log('2. Copy 3 notification sounds');
console.log('3. Rename them to: new-order.mp3, service-request.mp3, urgent.mp3');
console.log('4. Place them in public/sounds/ directory\n');

console.log('Option 3: Create Simple Test Sounds');
console.log('===================================');
console.log('1. Use online tone generators:');
console.log('   - https://www.szynalski.com/tone-generator/');
console.log('   - Generate tones at different frequencies');
console.log('   - Record them as MP3 files');
console.log('2. Rename them to required filenames');
console.log('3. Place them in public/sounds/ directory\n');

console.log('Option 4: Use Browser Default Sounds (Fallback)');
console.log('===============================================');
console.log('If you don\'t have sound files, the system will use browser defaults.');
console.log('This works but may not be as professional.\n');

console.log('📋 REQUIRED FILES:');
console.log('• new-order.mp3 - Sound for new orders');
console.log('• service-request.mp3 - Sound for service requests');
console.log('• urgent.mp3 - Sound for urgent orders\n');

console.log('⚙️ SOUND REQUIREMENTS:');
console.log('• Format: MP3 or WAV');
console.log('• Duration: 1-3 seconds');
console.log('• Volume: Moderate (not too loud)');
console.log('• Tone: Professional, pleasant, not jarring\n');

console.log('🔗 DIRECT LINKS TO FREE SOUNDS:');
console.log('================================');
console.log('Freesound.org (Free, requires account):');
console.log('• https://freesound.org/search/?q=notification+sound');
console.log('• https://freesound.org/search/?q=ding+sound');
console.log('• https://freesound.org/search/?q=chime+notification\n');

console.log('SoundBible.com (Free, no account needed):');
console.log('• http://soundbible.com/tags-notification.html');
console.log('• http://soundbible.com/tags-ding.html\n');

console.log('NotificationSounds.net (Free, no account needed):');
console.log('• https://notificationsounds.net/');
console.log('• https://notificationsounds.net/notification-sounds\n');

console.log('🧪 TESTING AFTER SETUP:');
console.log('=======================');
console.log('1. Start your development server: npm run dev');
console.log('2. Go to: http://localhost:3000/kitchen');
console.log('3. Click the volume icon (🔊) to test sounds');
console.log('4. Use the 🔊/🔇 button to enable/disable sounds');
console.log('5. Place a test order to hear the notification\n');

// Check for existing files
console.log('📂 Checking for existing sound files...');
const requiredFiles = ['new-order.mp3', 'service-request.mp3', 'urgent.mp3'];
let missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(soundsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    missingFiles.push(file);
  }
});

if (missingFiles.length === 0) {
  console.log('\n🎉 All sound files are present! The notification system is ready to use.');
} else {
  console.log(`\n⚠️  Missing ${missingFiles.length} sound file(s).`);
  console.log('Please download them using one of the options above.\n');
  
  console.log('💡 QUICK FIX:');
  console.log('If you want to test immediately without custom sounds:');
  console.log('1. Copy any 3 short MP3 files from your system');
  console.log('2. Rename them to the required filenames');
  console.log('3. Place them in public/sounds/ directory');
  console.log('4. Restart your development server');
}

console.log('\n📖 For detailed instructions, see: SOUND-SETUP.md'); 