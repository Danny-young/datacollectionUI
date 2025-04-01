import axios from 'axios';
import { Router } from "express";
import nodemailer from 'nodemailer';

const router = Router();

interface EmailData {
  to: string;
  agentCode: string;
  temporaryPassword: string;
  name: string;
}

export const sendCredentialsEmail = async (data: EmailData) => {
  try {
    const response = await axios.post('/send-credentials', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};



// Create transporter (email configuration)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EXPO_PUBLIC_EMAIL_USER, // Your system email that sends the credentials
    pass: process.env.EXPO_PUBLIC_EMAIL_APP_PASSWORD // Your app-specific password
  }
});

// Email sending endpoint
router.post('/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_SENDER, // Sender email address
    to,                            // Recipient (user's) email
    subject,                       // Email subject
    html                          // Email content in HTML format
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

export default router; 