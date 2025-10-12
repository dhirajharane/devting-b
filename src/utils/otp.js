const sgMail = require('@sendgrid/mail');

// This check ensures your app has the SendGrid API key before it starts.
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing required environment variable: SENDGRID_API_KEY");
}


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (to, otp) => {
  // The 'from' email address must be a verified sender in your SendGrid account.
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'dhirajharane@gmail.com';

  const msg = {
  to,
  from: fromEmail,
  subject: "🔐 Your DevTing Verification Code",
  text: `Your DevTing verification code is: ${otp}. It will expire in 5 minutes.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8f9fa; border-radius: 10px; border: 1px solid #e0e0e0;">
      <h2 style="color: #333; text-align: center;">🔐 DevTing Verification Code</h2>
      <p style="color: #555; font-size: 16px; text-align: center;">
        Use the code below to verify your email address. It is valid for <strong>5 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 30px; font-weight: bold; color: #1a73e8; letter-spacing: 4px; background: #fff; padding: 14px 28px; border-radius: 8px; border: 1px solid #1a73e8;">
          ${otp}
        </span>
      </div>
      <p style="color: #777; font-size: 14px; text-align: center;">
         If you did not request this code, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} DevTing • Made with 💻 in India
      </p>
    </div>
  `,
};


  try {
    await sgMail.send(msg);
    console.log(`✅ OTP email sent successfully to ${to} via SendGrid`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${to} via SendGrid:`, error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = { sendOtpEmail };