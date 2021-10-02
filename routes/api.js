const { Router } = require("express");

const router = Router();

router.use('/v1/cart', require('./api/v1/cart'));
router.use('/v1/product', require('./api/v1/product'));
router.use('/v1/promo', require('./api/v1/promo'));
router.use('/v1/transaction', require('./api/v1/transaction'));
router.use('/v1/user', require('./api/v1/user'));

module.exports = router;