# OneSignal REST API Key Setup

## Issue
Getting `403 Forbidden` error when sending notifications: "Access denied. Please include an 'Authorization: ...' header with a valid API key"

## Solution

You need to configure the **OneSignal REST API Key** in your backend `.env` file.

### Steps to Get Your REST API Key

1. **Go to OneSignal Dashboard:**
   - Visit: https://onesignal.com/
   - Login to your account

2. **Navigate to Your App:**
   - Select your app (or create one if you haven't)

3. **Go to Settings:**
   - Click on your app
   - Go to **Settings** → **Keys & IDs**

4. **Copy the REST API Key:**
   - Look for **"REST API Key"** (NOT the App ID)
   - It should look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - This is a long string, different from your App ID

5. **Add to `.env` file:**
   ```env
   ONESIGNAL_API_KEY=your_rest_api_key_here
   ONESIGNAL_APP_ID=7a811e86-9a98-4206-abbf-46d38aceb027
   ```

6. **Restart your backend server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart it
   npm run dev
   # or
   node Server.js
   ```

## Important Notes

- **REST API Key ≠ App ID**
  - App ID: `7a811e86-9a98-4206-abbf-46d38aceb027` (used for client-side)
  - REST API Key: Long string (used for server-side API calls)

- **Where to find it:**
  - OneSignal Dashboard → Your App → Settings → Keys & IDs → REST API Key

- **Security:**
  - Never commit the REST API Key to git
  - Keep it in `.env` file (which should be in `.gitignore`)
  - The REST API Key should be kept secret

## Verify Setup

After adding the API key, try sending a notification again. You should see in the logs:
- `✅ [ONESIGNAL API] Notification sent successfully`
- No more 403 errors

## Current Status

✅ Device registration working
✅ Player ID being saved correctly
✅ Query finding users correctly
❌ **OneSignal API authentication failing** - Need to add REST API Key to .env
