const Notification = require("../model/notification.Schema"); 

exports.sendNotification = async (data) => {
  try {
    const notificationCreated = await Notification.create(data);
    return notificationCreated;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};