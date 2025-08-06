const fs = require('fs');
const path = require('path');

console.log('🎵 Windows System Sounds Copy Script');
console.log('====================================\n');

const soundsDir = path.join(__dirname, '../public/sounds');
const windowsMediaDir = 'C:\\Windows\\Media';

// Create sounds directory if it doesn't exist
if (!fs.existsSync(soundsDir)) {
  console.log('📁 Creating sounds directory...');
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✅ Sounds directory created at: public/sounds/\n');
}

// Common Windows notification sounds
const windowsSounds = [
  'notify.wav',
  'ding.wav', 
  'chimes.wav',
  'chord.wav',
  'tada.wav',
  'ringin.wav',
  'ringout.wav',
  'start.wav',
  'windows notify.wav',
  'windows error.wav',
  'windows exclamation.wav',
  'windows information bar.wav'
];

console.log('🔍 Looking for Windows system sounds...\n');

let foundSounds = [];
let copiedCount = 0;

// Check which sounds exist in Windows Media directory
windowsSounds.forEach(sound => {
  const sourcePath = path.join(windowsMediaDir, sound);
  if (fs.existsSync(sourcePath)) {
    foundSounds.push(sound);
    console.log(`✅ Found: ${sound}`);
  }
});

if (foundSounds.length === 0) {
  console.log('❌ No Windows system sounds found in C:\\Windows\\Media\\');
  console.log('This might be due to permissions or the sounds being in a different location.\n');
  
  console.log('💡 ALTERNATIVE SOLUTIONS:');
  console.log('1. Manual copy: Navigate to C:\\Windows\\Media\\ and copy 3 .wav files');
  console.log('2. Download free sounds: Use the links in get-sounds-quick.js');
  console.log('3. Use browser fallback: The system will use browser-generated sounds\n');
  
  console.log('🔗 Quick Download Links:');
  console.log('• https://notificationsounds.net/');
  console.log('• http://soundbible.com/tags-notification.html');
  console.log('• https://freesound.org/search/?q=notification+sound');
  
  process.exit(1);
}

console.log(`\n📋 Found ${foundSounds.length} system sounds. Copying the first 3...\n`);

// Copy the first 3 sounds with appropriate names
const targetNames = ['new-order', 'service-request', 'urgent'];
const maxToCopy = Math.min(3, foundSounds.length);

for (let i = 0; i < maxToCopy; i++) {
  const sourceSound = foundSounds[i];
  const targetName = targetNames[i];
  const sourcePath = path.join(windowsMediaDir, sourceSound);
  const targetPath = path.join(soundsDir, `${targetName}.wav`);
  
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied: ${sourceSound} → ${targetName}.wav`);
    copiedCount++;
  } catch (error) {
    console.log(`❌ Failed to copy ${sourceSound}: ${error.message}`);
  }
}

if (copiedCount > 0) {
  console.log(`\n🎉 Successfully copied ${copiedCount} sound files!`);
  console.log('The notification system should now work with these sounds.\n');
  
  console.log('🧪 NEXT STEPS:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Go to: http://localhost:3000/kitchen');
  console.log('3. Click the 🔊 button to test sounds');
  console.log('4. Place a test order to hear the notification\n');
  
  console.log('💡 Note: These are system sounds and may not be ideal for a café.');
  console.log('Consider downloading professional notification sounds later.');
} else {
  console.log('\n❌ Failed to copy any sound files.');
  console.log('This might be due to file permissions or the files being in use.\n');
  
  console.log('🔧 TROUBLESHOOTING:');
  console.log('1. Run this script as Administrator');
  console.log('2. Check if Windows Media files are accessible');
  console.log('3. Try downloading sounds manually from the provided links');
}

console.log('\n📖 For more options, see: SOUND-SETUP.md'); 