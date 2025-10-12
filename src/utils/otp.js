const { Resend } = require("resend");

// This check ensures your app has the Resend API key.
if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing required environment variable: RESEND_API_KEY");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (to, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "DevTing <onboarding@resend.dev>",
      to: [to],
      subject: "Your DevTing Verification Code",
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
    });

    if (error) {
      console.error(`❌ Failed to send OTP email to ${to}:`, error);
      throw new Error("Failed to send OTP email via Resend.");
    }

    console.log(`✅ OTP email sent successfully to ${to}`, data);
  } catch (error) {
    // This will catch any exceptions during the API call.
    console.error("An unexpected error occurred while sending email:", error);
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = { sendOtpEmail };