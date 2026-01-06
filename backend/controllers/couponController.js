import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';

const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired coupon',
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        valid: false,
        message: 'Coupon usage limit reached',
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (coupon.minPurchase && cart.subtotal < coupon.minPurchase) {
      return res.status(400).json({
        valid: false,
        message: `Minimum purchase of Rs. ${coupon.minPurchase} required`,
      });
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableCoupons = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const cartTotal = cart?.subtotal || 0;

    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: new Date() },
      $or: [
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
      $or: [
        { minPurchase: { $exists: false } },
        { minPurchase: { $lte: cartTotal } },
      ],
    }).select('code description discountType discountValue minPurchase maxDiscount expiryDate');

    res.json({ coupons });
  } catch (error) {
    next(error);
  }
};

export { validateCoupon, getAvailableCoupons };
