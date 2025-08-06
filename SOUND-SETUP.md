# Sound Notifications Setup

This guide explains how to set up sound notifications for new orders in the Tomm&Danny café system.

## Overview

The system now supports sound notifications for:
- **New Orders** - Alert when new orders are placed
- **Service Requests** - Alert when customers request service
- **Urgent Orders** - Alert for orders older than 15 minutes

## Required Sound Files

Place the following sound files in the `public/sounds/` directory:

### Required Files
1. **`new-order.mp3`** - Sound for new orders (recommended: short, pleasant notification)
2. **`service-request.mp3`** - Sound for service requests (recommended: different tone from new orders)
3. **`urgent.mp3`** - Sound for urgent orders (recommended: attention-grabbing sound)

### Recommended Sound Characteristics
- **Duration**: 1-3 seconds
- **Format**: MP3 or WAV
- **Volume**: Moderate (not too loud)
- **Tone**: Professional, pleasant, not jarring

## Where to Get Sound Files

### Free Sound Resources
1. **Freesound.org** - Free sound effects library
2. **Zapsplat.com** - Free sound effects (registration required)
3. **SoundBible.com** - Free sound effects
4. **NotificationSounds.net** - Free notification sounds

### Recommended Search Terms
- "notification sound"
- "order alert"
- "ding sound"
- "chime notification"
- "service bell"

### Commercial Options
- **AudioJungle** - Professional sound effects
- **Envato Elements** - Subscription-based sound library

## Quick Setup

### Option 1: Use Default Browser Sounds
If you don't have custom sound files, the system will fall back to browser default sounds:

```typescript
// In your component
const { checkNewOrders } = useSoundNotifications({
  enabled: true,
  volume: 0.5
})
```

### Option 2: Custom Sound Files
1. Download or create your sound files
2. Place them in `public/sounds/` directory
3. Ensure they're named correctly:
   - `new-order.mp3`
   - `service-request.mp3`
   - `urgent.mp3`

## Implementation

### Kitchen Page
```typescript
const { checkNewOrders } = useSoundNotifications({
  enabled: true,
  volume: 0.5,
  soundType: 'new-order'
})

// In your fetchOrders function
const fetchOrders = async () => {
  // ... fetch orders logic
  setOrders(filteredOrders)
  checkNewOrders(filteredOrders.length) // Check for new orders
}
```

### Cashier Page
```typescript
const { checkNewOrders, checkNewServiceRequests } = useSoundNotifications({
  enabled: true,
  volume: 0.5
})

// Check for new orders and service requests
checkNewOrders(orders.length)
checkNewServiceRequests(serviceRequests.length)
```

## Configuration Options

### Volume Control
```typescript
const { checkNewOrders } = useSoundNotifications({
  enabled: true,
  volume: 0.3 // 30% volume
})
```

### Enable/Disable
```typescript
const { checkNewOrders } = useSoundNotifications({
  enabled: false // Disable sound notifications
})
```

### Custom Sound
```typescript
const { checkNewOrders } = useSoundNotifications({
  enabled: true,
  soundType: 'custom',
  customSoundUrl: '/sounds/my-custom-sound.mp3'
})
```

## Browser Compatibility

### Supported Browsers
- Chrome 66+
- Firefox 60+
- Safari 11+
- Edge 79+

### Mobile Support
- iOS Safari (requires user interaction first)
- Android Chrome
- Mobile Firefox

## Troubleshooting

### Sound Not Playing
1. **Check Browser Permissions**: Ensure the site has permission to play audio
2. **User Interaction**: Some browsers require user interaction before playing audio
3. **File Path**: Verify sound files are in the correct directory
4. **File Format**: Ensure files are in supported format (MP3, WAV)

### Volume Issues
1. **System Volume**: Check system volume and browser volume
2. **Browser Settings**: Check browser audio settings
3. **Code Volume**: Adjust the `volume` parameter (0.0 to 1.0)

### Multiple Sounds
1. **Sound Overlap**: Sounds will queue and play sequentially
2. **Performance**: Multiple simultaneous sounds may cause issues
3. **Debouncing**: Consider implementing debouncing for rapid notifications

## Testing

### Test Sound Function
```typescript
const { testSound } = useSoundNotifications({
  enabled: true
})

// Add a test button
<Button onClick={testSound}>Test Sound</Button>
```

### Manual Trigger
```typescript
const { triggerSound } = useSoundNotifications({
  enabled: true
})

// Trigger specific sounds
triggerSound('new-order')
triggerSound('service-request')
triggerSound('urgent')
```

## Best Practices

### Sound Selection
- **Keep it Short**: 1-3 seconds maximum
- **Professional**: Avoid cartoon or game-like sounds
- **Distinctive**: Different sounds for different events
- **Volume**: Moderate volume, not too loud

### User Experience
- **Respectful**: Don't play sounds too frequently
- **Configurable**: Allow users to disable sounds
- **Visual Cues**: Combine with visual notifications
- **Accessibility**: Consider users with hearing impairments

### Performance
- **Preload**: Audio files are preloaded for instant playback
- **Cleanup**: Audio elements are properly cleaned up
- **Error Handling**: Graceful fallback if sounds fail to play 