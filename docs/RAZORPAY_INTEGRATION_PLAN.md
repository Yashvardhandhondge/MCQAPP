# Razorpay Integration Plan (Test Mode)

## Overview
- **Plans:** PCB, PCM, PCMB — all at **₹99** standard payment.
- **Test credentials:** Key `rzp_test_SHvUQKXy220o6o`, Secret (keep server-side only in backend `.env`).
- **Webhooks:** Used to confirm payment and upgrade user when Razorpay sends `payment.captured`.

## Quick start (test mode)
1. **Backend:** Copy `env.template` to `.env` and set:
   - `RAZORPAY_KEY_ID=rzp_test_SHvUQKXy220o6o`
   - `RAZORPAY_KEY_SECRET=<your_razorpay_secret>`
   - `RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>` (same value you will enter in Razorpay dashboard)
2. Run `npm install` in `MCQ-Backend-` (installs `razorpay` if needed).
3. Create the webhook in Razorpay dashboard (see Part A) using your **public** backend URL (e.g. `https://goldfish-app-vwvh7.ondigitalocean.app/api/payment/webhook`).
4. Frontend uses the key only for Checkout; the app gets `keyId` from the create-order API response.

---

## Part A: Razorpay Dashboard (Test Mode)

1. **Log in to Razorpay Dashboard**
   - Use your Razorpay account in **Test Mode** (toggle at top).

2. **Create Webhook**
   - Go to **Settings → Webhooks** (or **Developers → Webhooks**).
   - Click **+ Create Webhook** / **Webhook Setup**.
   - **Webhook URL\***: Your backend URL that will receive events.
     - **Production:** `https://<your-backend-domain>/api/payment/webhook`  
       e.g. `https://goldfish-app-vwvh7.ondigitalocean.app/api/payment/webhook`
     - **Local testing:** Use a tunnel (e.g. ngrok):  
       `https://<your-ngrok-id>.ngrok.io/api/payment/webhook`
   - **Secret:** Create a random string (e.g. 32 chars). Add the **same value** to your backend `.env` as `RAZORPAY_WEBHOOK_SECRET`. Razorpay will sign webhook payloads with this; the backend will verify the signature.
   - **Alert Email:** Your email (e.g. yasharadhye2@gmail.com) for webhook failure alerts.
   - **Active Events:** Enable at least:
     - `payment.captured` — **required** (we upgrade user on this).
     - `payment.failed` — optional (for logging/analytics).
   - Click **Create Webhook**.

3. **Note**
   - For **test mode**, use the **test** Key ID and Secret in your app and backend; the webhook you create in test mode will receive test payment events.

---

## Part B: Backend (Node/Express)

1. **Environment variables** (e.g. `.env`; do not commit secrets)
   - `RAZORPAY_KEY_ID=rzp_test_SHvUQKXy220o6o`
   - `RAZORPAY_KEY_SECRET=<your_razorpay_secret>`
   - `RAZORPAY_WEBHOOK_SECRET=<same_value_you_entered_in_webhook_setup>`

2. **New API routes**
   - **POST `/api/payment/create-order`** (auth required)  
     - Body: `{ planId: 'PCM' | 'PCB' | 'PCMB' }`  
     - Creates a Razorpay order for **₹99** (9900 paise).  
     - Stores `userId` and `planId` in order notes.  
     - Returns: `{ orderId, amount, currency, keyId }` for the client.

   - **POST `/api/payment/verify`** (auth required)  
     - Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`  
     - Verifies signature using Razorpay API; fetches order notes to get `userId` and `planId`.  
     - Updates user: `subscription: 'premium'`, `group: planId`.  
     - Returns success so the app can refresh user state.

   - **POST `/api/payment/webhook`** (no auth; verify using Razorpay signature)  
     - Raw body required for signature verification.  
     - On event `payment.captured`: get payment → order → notes (`userId`, `planId`), then update user to premium and set group.  
     - Respond with `200` quickly so Razorpay doesn’t retry.

3. **Pricing**
   - All three plans use **₹99** (9900 paise) in `create-order`.  
   - Premium content API can return `price: 99` for PCM, PCB, PCMB (default or DB).

---

## Part C: Frontend (React Native / Expo)

1. **Config**
   - Add Razorpay **Key ID** only (e.g. in `config.ts` or env):  
     `RAZORPAY_KEY_ID=rzp_test_SHvUQKXy220o6o`  
   - Never put the Secret in the app.

2. **Payment flow**
   - User selects a plan (PCM / PCB / PCMB) and taps Purchase.
   - App calls **POST `/api/payment/create-order`** with `{ planId }` (auth header).
   - App receives `orderId`, `amount`, `currency`, `keyId`.
   - App opens **Razorpay Checkout** (via `react-native-razorpay` or WebView) with:
     - `order_id`, `amount`, `currency`, `key_id`
     - Prefill: user email/phone if available.
   - On **success:**  
     - Send `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` to **POST `/api/payment/verify`**.  
     - On 200: refresh user (e.g. AuthContext), show success, navigate back.
   - On **failure:** Show error; do not call verify.

3. **Display**
   - Show **₹99** for all three plans (from premium content API or local constant).

---

## Part D: Flow Summary

```
[App] User taps "Purchase" for PCM/PCB/PCMB
  → [Backend] POST /api/payment/create-order { planId }
  → [Backend] Creates Razorpay order (₹99), notes: { userId, planId }
  → [App] Opens Razorpay Checkout with orderId, amount, keyId
  → [User] Pays in Razorpay UI
  → [App] On success: POST /api/payment/verify { order_id, payment_id, signature }
  → [Backend] Verifies signature, updates user to premium + group, returns 200
  → [App] Refresh user, show success
  → [Razorpay] Sends webhook "payment.captured" to your backend
  → [Backend] Webhook handler also updates user (idempotent; safe if verify already did it)
```

---

## Security Notes
- Keep **Key Secret** and **Webhook Secret** only on the server.
- Always **verify** payment on backend (signature + optional order fetch).
- Webhook handler must **verify** `X-Razorpay-Signature` using the webhook secret and raw body.

---

## After Test Integration
- For **live** payments: switch to **Live** Key/Secret in backend and app, create a **Live** webhook with a new secret, and use production backend URL in the webhook.
