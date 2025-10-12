const nodemailer = require("nodemailer");

let configOptions = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure:false,
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
};

// Check for essential environment variables at startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "Missing required environment variables for email service (EMAIL_USER, EMAIL_PASS)"
  );
}

const transporter = nodemailer.createTransport({
configOptions
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
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        border: 1px solid #e0e0e0;
        padding: 20px;
        border-radius: 8px;
        background-color: #f9f9f9;
      ">
        <h2 style="color: #333;">Hello from DevTing 👋</h2>
        <p style="color: #555; font-size: 16px;">
          Use the OTP below to complete your verification:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="
            font-size: 32px;
            font-weight: bold;
            color: #1a73e8;
            letter-spacing: 4px;
          ">
            ${otp}
          </span>
        </div>
        <p style="color: #555; font-size: 14px;">
          This OTP is valid for <b>5 minutes</b>. Do not share it with anyone.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you didn’t request this OTP, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #777; font-size: 12px; text-align: center;">
          DevTing Inc.<br>
          &copy; ${new Date().getFullYear()} DevTing. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${to}:`, error);
    throw new Error("Failed to send OTP email");
  }
};


module.exports = { sendOtpEmail };
