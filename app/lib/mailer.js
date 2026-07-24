import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  // Using explicit settings for maximum compatibility on hosting platforms.
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS. It's crucial this is false for port 587.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, 
  },
  // This is the correct way to force IPv4. 'family' is a top-level Node.js networking option.
  family: 4,
  // Explicitly require TLSv1.2 or higher
  tls: {
    minVersion: 'TLSv1.2',
  }
});

export const sendMail = async (to, subject, text, html) => {
  console.log(`Mailer: Attempting to send email to "${to}" with subject "${subject}"`);
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`Mailer: Email sent successfully! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Mailer: Failed to send email.', error);
    throw error; // Re-throw the error so the calling function knows it failed
  }
};