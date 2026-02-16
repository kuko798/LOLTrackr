import nodemailer from 'nodemailer';

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const transporter = getTransporter();

    if (!transporter) {
        console.warn(`SMTP is not configured. Verification link for ${email}: ${verifyUrl}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Verify your LOLTracker account',
        html: `
          <p>Welcome to LOLTracker.</p>
          <p>Verify your email by clicking this link:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link expires in 24 hours.</p>
        `,
    });
}
