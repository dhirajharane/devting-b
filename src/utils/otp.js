const nodemailer = require("nodemailer");

// This check is crucial. It ensures your app doesn't start without the necessary credentials.
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error(
    "Missing required environment variables for email service: EMAIL_USER, EMAIL_PASS"
  );
}

// Production-ready configuration for Nodemailer in a cloud environment
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL, true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This MUST be a Gmail App Password
  },
  // Add a timeout and reject unauthorized connections for better security
  tls: {
    rejectUnauthorized: true,
  },
});


// Verify the transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Mail transporter verification failed:", error);
  } else {
    console.log("Mail transporter is ready to send emails");
  }
});

const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"DevTing" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your DevTing Verification Code",
    text: `Your OTP for DevTing is: ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; border:1px solid #e0e0e0; padding:20px; border-radius:8px; background:#f9f9f9;">
        <h2>Hello from DevTing 👋</h2>
        <p>Use the OTP below to complete your verification:</p>
        <div style="text-align:center; margin:20px 0;">
          <span style="font-size:32px; font-weight:bold; color:#1a73e8; letter-spacing:4px;">${otp}</span>
        </div>
        <p>This OTP is valid for <b>5 minutes</b>. Do not share it.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${to}:`, error);
    // Re-throw the error to be caught by the route handler
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendOtpEmail };