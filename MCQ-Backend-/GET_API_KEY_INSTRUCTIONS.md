# How to Get Your OneSignal REST API Key

## Important: Key ID ≠ REST API Key

The **Key ID** (`yf424nf5tu6wnojs7m7naun4i`) shown in your dashboard is **NOT** the REST API Key. You need the actual **REST API Key value**.

## Steps to Get Your REST API Key

### Option 1: View Existing Key (if available)

1. In your OneSignal dashboard, go to **Settings** → **Keys & IDs**
2. Find the **"AdminKey"** in the API Keys table
3. Click the **three-dot menu (⋮)** next to "AdminKey"
4. Look for options like:
   - **"View Key"** - Click to see the full key value
   - **"Copy Key"** - Click to copy the key value
   - **"Show Key"** - Click to reveal the key

**⚠️ Note:** If you can't see the key value, it means OneSignal only shows it once when created. In that case, use Option 2.

### Option 2: Create a New REST API Key

1. In your OneSignal dashboard, go to **Settings** → **Keys & IDs**
2. In the **API Keys** section, click the **"+ Add Key"** button (blue button on the right)
3. Fill in the details:
   - **Name:** `Backend API Key` (or any name you prefer)
   - Click **"Create Key"**
4. **⚠️ IMPORTANT:** OneSignal will show you the REST API Key value **ONLY ONCE** immediately after creation
5. **Copy the key value immediately** - it looks like a long string of characters
6. Paste it into your `.env` file (see below)

### Option 3: Check Legacy API Key

If the "Legacy API Key" was previously used and you have it saved somewhere, you can use that. However, you might need to enable it first.

## What the REST API Key Looks Like

The REST API Key is a **long string** (usually 48+ characters), for example:
```
MTUyNjg5MjEtYTdjNC00ODg2LWFhY2EtMzg5ZjI5YjE0ZGVh
```

**It's NOT the same as:**
- ❌ Key ID: `yf424nf5tu6wnojs7m7naun4i` (this is just an identifier)
- ❌ App ID: `7a811e86-9a98-4206-abbf-46d38aceb027` (this is for client-side)

## After Getting the Key

1. Create a `.env` file in the `MCQ-Backend-` folder
2. Add the following:
   ```env
   ONESIGNAL_APP_ID=7a811e86-9a98-4206-abbf-46d38aceb027
   ONESIGNAL_API_KEY=paste_your_rest_api_key_here
   ```
3. Replace `paste_your_rest_api_key_here` with the actual REST API Key value you copied
4. Restart your backend server

## Verify It's Working

After adding the key and restarting, try sending a notification from the admin panel. You should see:
- ✅ `✅ [ONESIGNAL API] Notification sent successfully`
- ❌ No more `403 Forbidden` errors

## Still Can't Find It?

If you can't find or view the REST API Key:
1. Contact OneSignal support for help retrieving your existing key
2. Or create a new key (Option 2 above) and use that
