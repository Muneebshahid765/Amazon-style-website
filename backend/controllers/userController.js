import User from '../models/User.js';
import Order from '../models/Order.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  res.json({ user });
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.email = email;
      updates.isVerified = false;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);

    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'novamart/avatars',
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'face',
      },
      async (error, result) => {
        if (error) {
          return next(error);
        }

        user.avatar = {
          public_id: result.public_id,
          url: result.secure_url,
        };

        await user.save();
        res.json({ message: 'Avatar uploaded successfully', avatar: user.avatar });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    next(error);
  }
};

const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.avatar?.public_id) {
      return res.status(400).json({ message: 'No avatar to delete' });
    }

    await cloudinary.uploader.destroy(user.avatar.public_id);
    user.avatar = undefined;
    await user.save();

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const user = await User.findById(req.user._id);

    const normalizedAddress = {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault: true,
    };

    if (user.addresses.length > 0) {
      user.addresses = [normalizedAddress];
    } else {
      user.addresses.push(normalizedAddress);
    }

    await user.save();
    res.status(201).json({ message: 'Address saved', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

const getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.json({ addresses: user.addresses });
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(id);

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    Object.assign(address, updates);
    await user.save();

    res.json({ message: 'Address updated successfully', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    
    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: 'Address deleted successfully', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === id;
    });

    await user.save();
    res.json({ message: 'Default address updated', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();

    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();

    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name slug price discountPrice images stock rating category',
    });

    res.json({ wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Support both logged-in users and guest users
    const query = {};
    if (req.user?._id) {
      query.user = req.user._id;
    } else if (req.guestId) {
      query.guestId = req.guestId;
    } else {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderItems.product', 'name images slug');

    const count = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

const getUserOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'name images slug price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization for both logged-in users and guests
    const isOwner = 
      (req.user?._id && order.user?.toString() === req.user._id.toString()) ||
      (req.guestId && order.guestId === req.guestId);
    
    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

const getUserTransactions = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const baseMatch = { user: req.user._id };

    if (status) {
      baseMatch.status = status;
    }

    if (startDate || endDate) {
      baseMatch.createdAt = {};
      if (startDate) baseMatch.createdAt.$gte = new Date(startDate);
      if (endDate) baseMatch.createdAt.$lte = new Date(endDate);
    }

    const numericLimit = Number(limit) || 20;
    const currentPage = Number(page) || 1;
    const skip = (currentPage - 1) * numericLimit;

    const [orders, total, summaryAgg] = await Promise.all([
      Order.find(baseMatch)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .select(
          'orderNumber createdAt totalPrice totalAmount status paymentMethod paymentCardBrand paymentCardLast4 orderItems items currency'
        ),
      Order.countDocuments(baseMatch),
      Order.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: { $ifNull: ['$totalPrice', '$totalAmount'] } },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const transactions = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      total: order.totalPrice ?? order.totalAmount ?? 0,
      status: order.status,
      paymentMethod: order.paymentDisplayMethod || order.paymentMethod,
      currency: order.currency || 'PKR',
      itemsCount: order.orderItems?.length || order.items?.length || 0,
    }));

    const totalOrders = summaryAgg[0]?.totalOrders || total || 0;
    const totalSpent = summaryAgg[0]?.totalSpent || 0;

    res.json({
      transactions,
      pagination: {
        total,
        totalPages: Math.ceil(total / numericLimit) || 1,
        currentPage,
      },
      summary: {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders ? totalSpent / totalOrders : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getUserOrders,
  getUserOrderById,
  getUserTransactions,
  listUsers,
};
