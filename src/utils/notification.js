const fetch = require('node-fetch'); 

exports.sendNotification = async (deviceToken, title, body) => {
  try {
    const message = {
      to: deviceToken,
      notification: {
        title: title,
        body: body,
      },
      priority: "high"
    };
    const data = await response.json();
    console.log('Push Notification Response:', data);
    return data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};
