const nodemailer = require("nodemailer");
exports.sendResponse = (res, code, message, data) => {
    if (data) {
      data = data;
    }
    return res.status(code).json(data);
  };
exports.generateOTP = () => {
    const min = 1000;
    const max = 9999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.sendMail = async (email, subject) => {
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
    from: `"NBFC" <"tpaunikar92@gmail.com">`,
    to: email,
    subject:subject,
    text: subject
  });
  return info;
};