import { createEmailTransporter } from '../config/email.js';

const transporter = createEmailTransporter();

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export { sendEmail };
