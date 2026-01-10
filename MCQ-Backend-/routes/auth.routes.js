const { Router } = require('express');
const { register, profile, updateGroup, upgradeSubscription, sendOTP, verifyOTP, login } = require('../controllers/auth.controller');
const { authGuard } = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', authGuard, profile);
router.put('/profile/group', authGuard, updateGroup);
router.put('/profile/subscription/upgrade', authGuard, upgradeSubscription);

module.exports = router;

