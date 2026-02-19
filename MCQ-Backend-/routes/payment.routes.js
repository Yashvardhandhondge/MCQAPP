const { Router } = require('express');
const { createOrder, verifyPayment } = require('../controllers/payment.controller');
const { authGuard } = require('../middleware/auth.middleware');

const router = Router();

router.post('/create-order', authGuard, createOrder);
router.post('/verify', authGuard, verifyPayment);

module.exports = router;
