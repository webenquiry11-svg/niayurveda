import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD, 
  },
  // Force IPv4 to resolve a common issue on hosting platforms like Render.
  // The server fails to connect to smtp.gmail.com over IPv6.
  dns: {
    family: 4,
  },
  // Add these for better debugging on the server
  logger: true,
  debug: true,
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