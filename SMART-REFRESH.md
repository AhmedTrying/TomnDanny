# Smart Auto-Refresh System

This document explains the smart auto-refresh functionality implemented in the Tomm&Danny café system for the cashier and kitchen pages.

## Overview

The smart auto-refresh system ensures that live order data is always up-to-date while respecting user activity to avoid interrupting their work.

## Features

### 🧠 **Smart Activity Detection**
- **User Activity Tracking**: Monitors mouse movements, clicks, keyboard input, scrolling, and touch events
- **Activity Threshold**: Waits 5 seconds after user activity before resuming auto-refresh
- **Non-Intrusive**: Never interrupts users while they're actively working

### ⚡ **Automatic Refresh**
- **30-Second Intervals**: Refreshes data every 30 seconds when user is not active
- **Real-time Updates**: Still receives instant updates via Supabase real-time subscriptions
- **Conditional Enablement**: Only active on relevant tabs (dashboard, orders for cashier; always for kitchen)

### 🔄 **Manual Controls**
- **Manual Refresh Button**: Users can force refresh at any time
- **Status Indicator**: Shows whether auto-refresh is active or paused due to user activity
- **Visual Feedback**: Clear indication of refresh status

## Implementation

### Custom Hook: `useSmartRefresh`

Located in `hooks/use-smart-refresh.ts`, this hook provides:

```typescript
const { manualRefresh, forceRefresh, isUserActive } = useSmartRefresh({
  interval: 30000, // 30 seconds
  enabled: true,
  onRefresh: async () => {
    // Your refresh function
  },
  userActivityThreshold: 5000 // 5 seconds
})
```

### Parameters

- **`interval`**: Refresh interval in milliseconds
- **`enabled`**: Whether auto-refresh is active
- **`onRefresh`**: Function to call when refreshing
- **`userActivityThreshold`**: Time to wait after user activity (default: 5000ms)

### Returns

- **`manualRefresh`**: Function to manually trigger refresh
- **`forceRefresh`**: Function to force refresh (ignores user activity)
- **`isUserActive`**: Boolean indicating if user is currently active

## Usage in Pages

### Kitchen Page (`/kitchen`)

```typescript
const { manualRefresh, isUserActive } = useSmartRefresh({
  interval: 30000,
  enabled: true,
  onRefresh: async () => {
    await fetchOrders()
    setLastRefresh(new Date())
  }
})
```

**Features:**
- Always enabled (kitchen staff need constant updates)
- Refreshes order data every 30 seconds
- Shows refresh status in header
- Manual refresh button available

### Cashier Page (`/cashier`)

```typescript
const { manualRefresh, isUserActive } = useSmartRefresh({
  interval: 30000,
  enabled: activeTab === "dashboard" || activeTab === "orders",
  onRefresh: async () => {
    if (activeTab === "dashboard" || activeTab === "orders") {
      await fetchOrders()
      await fetchServiceRequests()
      await fetchDailyStats()
    }
    setLastRefresh(new Date())
  }
})
```

**Features:**
- Only enabled on live order tabs (dashboard, orders)
- Refreshes orders, service requests, and daily stats
- Conditional refresh based on active tab
- Refresh controls only shown on relevant tabs

## User Experience

### Visual Indicators

1. **Refresh Button**: Circular arrow icon for manual refresh
2. **Status Badge**: 
   - 🟢 **"Auto-refresh"** (green): System is automatically refreshing
   - 🟡 **"User Active"** (yellow): Auto-refresh paused due to user activity

### Activity Detection

The system tracks these user activities:
- Mouse movements (`mousemove`)
- Mouse clicks (`mousedown`, `click`)
- Keyboard input (`keypress`)
- Scrolling (`scroll`)
- Touch events (`touchstart`)

### Refresh Behavior

1. **User Active**: Auto-refresh pauses, manual refresh still available
2. **User Inactive**: Auto-refresh resumes after 5 seconds
3. **Real-time Events**: Supabase subscriptions still work instantly
4. **Manual Override**: Users can always force refresh

## Benefits

### 🎯 **For Staff**
- **No Interruptions**: Work without being disturbed by page refreshes
- **Always Current**: Data stays up-to-date automatically
- **Manual Control**: Can refresh when needed
- **Clear Status**: Know when system is refreshing

### 🏪 **For Business**
- **Real-time Operations**: Orders appear instantly
- **Reduced Errors**: Always working with current data
- **Better UX**: Staff can work efficiently
- **Reliable System**: Combines real-time + fallback refresh

## Technical Details

### Event Listeners
- Uses passive event listeners for performance
- Automatically cleans up on component unmount
- Debounced activity detection

### Error Handling
- Graceful error handling for failed refreshes
- Console logging for debugging
- Continues operation even if refresh fails

### Performance
- Minimal impact on page performance
- Efficient activity detection
- Smart interval management

## Configuration

### Default Settings
- **Refresh Interval**: 30 seconds
- **Activity Threshold**: 5 seconds
- **Enabled Tabs**: Dashboard, Orders (cashier); Always (kitchen)

### Customization
You can adjust these settings in each page:

```typescript
// Faster refresh for busy periods
interval: 15000, // 15 seconds

// Longer activity threshold for slower users
userActivityThreshold: 10000, // 10 seconds

// Disable for specific scenarios
enabled: false
```

## Troubleshooting

### Auto-refresh not working
1. Check if the tab is enabled for auto-refresh
2. Verify user activity detection is working
3. Check console for error messages

### Too frequent refreshes
1. Increase the `interval` parameter
2. Increase the `userActivityThreshold`

### Manual refresh not working
1. Check if the `onRefresh` function is properly defined
2. Verify network connectivity
3. Check for JavaScript errors in console 