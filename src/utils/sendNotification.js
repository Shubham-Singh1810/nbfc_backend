const Notification = require("../model/notification.Schema");
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.sendNotification = async (data) => {
  console.log(data.fcmToken)
  try {
    let notificationCreated
    if(!data?.onlyPushNotification){
       notificationCreated = await Notification.create(data);
    }
    // io.emit("notificationCreated", {
    //   message: "A New Notification Added",
    // });
    // Check if FCM token is present
    if (!data?.fcmToken) {
      console.warn("FCM token missing — notification not sent.");
      return notificationCreated;
    }
    // Prepare FCM message
    const message = {
      notification: {
        title: data?.title || "Default Title",
        body: data?.subTitle || "Default Body",
        image: data?.icon || null,
      },
      token: data.fcmToken,
    };
    // Send notification via Firebase
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);

    return {
      notification: notificationCreated || "Notify",
      fcmResponse: response,
    };
  } catch (error) {
    
    // If token invalid or unregistered — handle & remove token from DB if you store it
    if (error.errorInfo?.code === "messaging/registration-token-not-registered") {
      console.warn("❌ Invalid/expired FCM token — should delete from DB if stored.");
      // Example: await User.updateOne({ fcmToken: data.fcmToken }, { $unset: { fcmToken: "" } });
    } else {
      console.error("❌ Error sending notification:", error);
    }
  }
};
