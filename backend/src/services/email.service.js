import nodemailer from 'nodemailer';

export const sendAlertEmail = async (userEmail, subject, textContent, snapshotPath = null) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials missing. Skipping email alert.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const attachments = [];
    let imageHtml = '';
    
    if (snapshotPath) {
      attachments.push({
        filename: 'snapshot.jpg',
        path: snapshotPath,
        cid: 'snapshot_image'
      });
      imageHtml = `<div style="margin-top: 15px;"><img src="cid:snapshot_image" alt="Camera Snapshot" style="max-width: 100%; border-radius: 8px; border: 2px solid #ef4444;" /></div>`;
    }

    const mailOptions = {
      from: `"SD-Hawk AI" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      text: textContent,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f5; border-radius: 8px;">
          <h2 style="color: #dc2626;">SD-Hawk Security Alert 🚨</h2>
          <p style="font-size: 16px; color: #3f3f46; line-height: 1.5;">${textContent}</p>
          ${imageHtml}
          <hr style="border: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a;">Log in to your SD-Hawk dashboard to view live camera feeds.</p>
        </div>
      `,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email alert sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email alert:', error);
  }
};
