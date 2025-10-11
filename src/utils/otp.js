const nodemailer = require("nodemailer");

// Check for essential environment variables at startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "Missing required environment variables for email service (EMAIL_USER, EMAIL_PASS)"
  );
  // process.exit(1); // optional
}

const MAIL_HOST = process.env.MAIL_HOST || "smtp.gmail.com";
const MAIL_PORT = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587;
const MAIL_SECURE = process.env.MAIL_SECURE === "true"; // use "true" in env for secure connections

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("Mail transporter verify failed:", err);
  } else {
    console.log("Mail transporter ready");
  }
});

const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your DevTing Verification Code",
    text: `Your OTP for DevTing is: ${otp}. It is valid for 5 minutes.`,
    html: `... same html as before ...`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending OTP email to ${to}:`, error);
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = { sendOtpEmail };
