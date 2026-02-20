const { Router } = require('express');
const { createOrder, verifyPayment, getMyPaymentHistory } = require('../controllers/payment.controller');
const { authGuard } = require('../middleware/auth.middleware');

const router = Router();

router.post('/create-order', authGuard, createOrder);
router.post('/verify', authGuard, verifyPayment);
router.get('/me/history', authGuard, getMyPaymentHistory);

module.exports = router;
