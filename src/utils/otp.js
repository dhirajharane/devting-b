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
    to: to, 
    from: fromEmail,
    subject: `Your DevTing Verification Code`, 
    text: `Your verification code is: ${otp}`, 
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your DevTing Verification Code</h2>
        <p>Here is your code. It is valid for 5 minutes.</p>
        <p style="font-size:24px; font-weight:bold; letter-spacing:2px;">${otp}</p>
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