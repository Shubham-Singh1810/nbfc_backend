const nodemailer = require("nodemailer");
const User = require("../model/user.Schema");
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.sendEmailToUsers = async (notifyUserIds, title, subTitle, icon) => {
  const users = await User.find({ _id: { $in: notifyUserIds } }).select(
    "email"
  );
  const emailList = users.map((u) => u.email).join(",");
  if (!emailList) {
    console.log("No users found for email notification");
    return;
  }
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "tpaunikar92@gmail.com",
      pass: "yapnmzshchqbvnwy",
    },
  });
  const info = await transporter.sendMail({
    from: `"Rupee Loan" <"tpaunikar92@gmail.com">`,
    to: emailList,
    subject: title,
    html: `
        <div style="font-family:Arial; padding:10px;">
          <h3>${title}</h3>
          <p>${subTitle}</p>
          ${icon ? `<img src="${icon}" alt="icon" width="50" />` : ""}
        </div>
      `,
  });
  return info;
};

exports.sendSMSToUsers = async (notifyUserIds, title, subTitle, icon) => {
  console.log("sms");
};



exports.sendPushToUsers = async (notifyUserIds, title, subTitle, icon) => {
  const users = await User.find({ _id: { $in: notifyUserIds } })
    .select("deviceId");
  
  const deviceTokens = users
    .map((u) => u.deviceId)
    .filter((i) => i);
  console.log(deviceTokens)
  if (!deviceTokens.length) {
    console.log("No device tokens found");
    return;
  }

  const message = {
    notification: {
      title: title || "Default Title",
      body: subTitle || "Default Body",
      image: icon || null,
    },
    tokens: deviceTokens,
  };

  try {
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast(message);

    console.log("Success:", response.successCount);
    console.log("Failed:", response.failureCount);

    // remove invalid tokens
    response.responses.forEach(async (res, index) => {
      if (!res.success) {
        await User.updateOne(
          { deviceId: deviceTokens[index] },
          { $unset: { deviceId: "" } }
        );
      }
    });

    return response;
  } catch (error) {
    console.error("Push sending failed:", error);
  }
};

