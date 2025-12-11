# Network Troubleshooting Guide

## Current Configuration
- **Backend IP**: `192.168.1.7:8000` ✅ Correct
- **Backend Status**: ✅ Working (tested with curl)
- **Frontend**: React Native with Expo Tunnel

## Issue: Network Error from React Native App

The backend is accessible from your computer, but the React Native app can't connect.

## Solutions

### Solution 1: Check Windows Firewall (Most Likely Issue)

Windows Firewall might be blocking port 8000. Add an exception:

**Option A: Using PowerShell (Run as Administrator)**
```powershell
New-NetFirewallRule -DisplayName "MCQ Backend Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

**Option B: Using Windows Firewall GUI**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `8000` → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "MCQ Backend Port 8000" → Finish

### Solution 2: Use Android Emulator IP (If Testing on Emulator)

If you're using Android Emulator, use this IP instead:
```typescript
export const API_BASE_URL = 'http://10.0.2.2:8000';
```

### Solution 3: Use Localhost (If Testing on Same Device)

If testing on the same computer, try:
```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

### Solution 4: Check Network Connection

1. **Ensure device and computer are on the same WiFi network**
2. **Ping test from device** (if possible):
   - Try accessing `http://192.168.1.7:8000/health` from device browser
   - If it works in browser but not in app, it's an app configuration issue

### Solution 5: Use ngrok or Expo Tunnel for Backend (Alternative)

If firewall is too restrictive, use ngrok to expose backend:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 8000
# Use the ngrok URL in config.ts
```

## Quick Test Commands

### Test Backend Accessibility:
```bash
# From computer (should work)
curl http://192.168.1.7:8000/health

# Test login
curl -X POST http://192.168.1.7:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Check if Port is Open:
```powershell
Test-NetConnection -ComputerName 192.168.1.7 -Port 8000
```

## Recommended Fix Order

1. ✅ **First**: Add Windows Firewall exception (Solution 1)
2. ✅ **Then**: Restart backend server
3. ✅ **Then**: Reload React Native app
4. ✅ **If still failing**: Try Solution 2 or 3 based on your setup

## Current Status

- ✅ IP Address: Correct (`192.168.1.7`)
- ✅ Backend Server: Running and accessible
- ✅ Backend Listening: On `0.0.0.0:8000` (all interfaces)
- ❌ **Issue**: Windows Firewall likely blocking incoming connections




