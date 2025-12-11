const { Router } = require('express');
const { register, login, profile } = require('../controllers/auth.controller');
const { authGuard } = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authGuard, profile);

module.exports = router;

