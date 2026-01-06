import Notification from '../models/Notification.js';

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly } = req.query;

    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (unreadOnly === 'true') {
      query.readAt = null;
    }

    const skip = (page - 1) * limit;
    const totalNotifications = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      readAt: null,
    });

    res.json({
      notifications,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: Number(page),
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, readAt: null },
      { readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (userId, data) => {
  try {
    const notification = await Notification.create({
      user: userId,
      ...data,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
};
