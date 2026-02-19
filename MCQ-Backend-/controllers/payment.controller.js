const createError = require('http-errors');
const crypto = require('crypto');
const User = require('../Modals/UserModal');
const { connectDB } = require('../config/db');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  Razorpay = null;
}

const STANDARD_AMOUNT_PAISE = 9900; // ₹99
const VALID_PLANS = ['PCM', 'PCB', 'PCMB'];

/**
 * Create Razorpay order for premium subscription
 * POST /api/payment/create-order
 * Body: { planId: 'PCM' | 'PCB' | 'PCMB' }
 */
const createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId || !VALID_PLANS.includes(planId)) {
      return next(createError(400, 'Invalid planId. Must be one of: PCM, PCB, PCMB'));
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return next(createError(500, 'Razorpay is not configured'));
    }

    if (!Razorpay) {
      return next(createError(500, 'Razorpay SDK not installed'));
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const userId = req.user._id.toString();

    const order = await instance.orders.create({
      amount: STANDARD_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `premium_${planId}_${userId.slice(-6)}`,
      notes: {
        userId,
        planId,
      },
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return next(createError(500, error.message || 'Failed to create order'));
  }
};

/**
 * Verify payment signature and upgrade user (called from app after successful checkout)
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(createError(400, 'Missing razorpay_order_id, razorpay_payment_id or razorpay_signature'));
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return next(createError(500, 'Razorpay is not configured'));
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return next(createError(400, 'Invalid payment signature'));
    }

    if (!Razorpay) {
      return next(createError(500, 'Razorpay SDK not installed'));
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: keySecret,
    });
    const order = await instance.orders.fetch(razorpay_order_id);
    const notes = order.notes || {};
    const userId = notes.userId;
    const planId = notes.planId;

    if (!userId || !planId || !VALID_PLANS.includes(planId)) {
      return next(createError(400, 'Invalid order notes'));
    }

    // Only allow upgrading the authenticated user's own order
    if (userId !== req.user._id.toString()) {
      return next(createError(403, 'Order does not belong to this user'));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { subscription: 'premium', group: planId },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(createError(404, 'User not found'));
    }

    const safeUser = user.toJSON ? user.toJSON() : user;
    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription upgraded',
      user: safeUser,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return next(createError(500, error.message || 'Payment verification failed'));
  }
};

/**
 * Razorpay webhook handler (payment.captured)
 * POST /api/payment/webhook
 * Raw body required for signature verification. No auth.
 */
const webhook = async (req, res, next) => {
  try {
    await connectDB();
    const rawBody = req.body;
    if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      return res.status(400).send('Bad Request');
    }

    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) {
      return res.status(400).send('Missing webhook secret or signature');
    }

    const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    let payload;
    try {
      payload = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      return res.status(400).send('Invalid JSON');
    }

    const event = payload.event;
    if (event !== 'payment.captured') {
      return res.status(200).json({ received: true });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity || paymentEntity.status !== 'captured') {
      return res.status(200).json({ received: true });
    }

    const orderId = paymentEntity.order_id;
    if (!orderId) {
      return res.status(200).json({ received: true });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || !Razorpay) {
      console.error('Razorpay not configured for webhook');
      return res.status(200).json({ received: true });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: keySecret,
    });
    const order = await instance.orders.fetch(orderId);
    const notes = order.notes || {};
    const userId = notes.userId;
    const planId = notes.planId;

    if (!userId || !planId || !VALID_PLANS.includes(planId)) {
      console.error('Webhook: invalid order notes', { orderId, notes });
      return res.status(200).json({ received: true });
    }

    await User.findByIdAndUpdate(userId, {
      subscription: 'premium',
      group: planId,
    });

    console.log('Webhook: user upgraded to premium', { userId, planId });
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Webhook handler error');
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  webhook,
};
