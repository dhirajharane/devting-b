const sgMail = require('@sendgrid/mail');

// This check ensures your app has the SendGrid API key before it starts.
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("Missing required environment variable: SENDGRID_API_KEY");
}

// Set the API key for the SendGrid mail service.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOtpEmail = async (to, otp) => {
  // The 'from' email address must be a verified sender in your SendGrid account.
  // This can be your personal email address during development.
  const fromEmail ='dhirajharane@gmail.com';

  const msg = {
    to: to, // The recipient's email address.
    from: fromEmail, // Your verified sender email.
    subject: `Your DevTing Verification Code: ${otp}`,
    text: `Your OTP for DevTing is: ${otp}. It is valid for 5 minutes.`, // Fallback for clients that don't render HTML.
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