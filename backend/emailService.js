
const nodemailer = require('nodemailer');

// --- Nodemailer Setup ---
// It's configured once and reused by the sendSignupEmail function.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Sends a high-fidelity, professional welcome email to a new user.
 * @param {object} user - The new user object containing fullName, email, and username.
 */
const sendSignupEmail = (user) => {
    // The base URL for links should ideally come from an environment variable.
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const brandRed = '#D71E28'; // Primary Wells Fargo red from the logo
    const bgColor = '#f0f2f5';
    const textColor = '#333333';
    const cardBg = '#ffffff';
    const logoUrl = 'https://scontent.fbni1-1.fna.fbcdn.net/v/t1.15752-9/518279970_2576104152724425_2613941382091799388_n.png?_nc_cat=102&ccb=1-7&_nc_sid=0024fc&_nc_ohc=CaY2ftgg12AQ7kNvwEyon-7&_nc_oc=Adm5tLk5AcsuRsprKsLzx2HumAU_ZUmCV3XSFUUkXOwccjxqm4XRA-UnRX8kBohwx6o&_nc_ad=z-m&_nc_cid=1361&_nc_zt=23&_nc_ht=scontent.fbni1-1.fna&oh=03_Q7cD2wF5MpU3OvFqJQCiCdaWGJMsayXmfHQXsXHwBpGyNKZHIA&oe=689A9237';


    const mailOptions = {
        from: `"Wells Fargo" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Welcome to Wells Fargo',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Wells Fargo Account is Ready</title>
            <style>
                body { margin: 0; padding: 0; word-spacing: normal; -webkit-font-smoothing: antialiased; background-color: ${bgColor}; }
                table { border-collapse: collapse; }
                td { font-family: Arial, sans-serif; }
                a { color: ${brandRed}; text-decoration: none; }
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; }
                    .content-padding { padding: 0 20px 30px !important; }
                    .header-padding { padding: 30px 20px 20px !important; }
                    .footer-padding { padding: 20px !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: ${bgColor};">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="padding: 40px 20px;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; margin: 0 auto; background-color: ${cardBg}; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
                            <!-- Branding Header -->
                            <tr>
                                <td style="padding: 30px 30px 20px;" class="header-padding">
                                    <img src="${logoUrl}" alt="Wells Fargo Logo" width="150" style="display: block;">
                                </td>
                            </tr>
                            <!-- Main Content -->
                            <tr>
                                <td style="padding: 0 30px 40px;" class="content-padding">
                                    <h2 style="margin: 0 0 24px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: bold; color: #000000;">Your Account is Ready</h2>
                                    <p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">Hello ${user.fullName},</p>
                                    <p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">Thank you for enrolling with Wells Fargo Online®. Your account has been successfully created and is ready for you to use.</p>
                                    <p style="margin: 0 0 24px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">Your username is: <strong style="color: #000000;">${user.username}</strong></p>
                                    <p style="margin: 0 0 16px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">To get started, please sign in to your new account using the credentials you created.</p>
                                    <!-- Button -->
                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 30px 0;">
                                        <tr>
                                            <td align="left">
                                                <a href="${appUrl}/#/login" target="_blank" style="background-color: ${brandRed}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-family: Arial, sans-serif; font-size: 16px;">Sign On to Your Account</a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin: 30px 0 16px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">For your security, we will never ask for your password in an email.</p>
                                    <p style="margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">Sincerely,</p>
                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${textColor};">Wells Fargo Online Customer Service</p>
                                </td>
                            </tr>
                        </table>
                         <!-- Footer -->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; margin: 0 auto;">
                           <tr>
                                <td style="padding: 30px 20px; font-size: 12px; color: #666666; text-align: center; font-family: Arial, sans-serif;" class="footer-padding">
                                    <p style="margin: 0;">© 1999 - ${new Date().getFullYear()} Wells Fargo. All rights reserved. NMLSR ID 399801</p>
                                    <p style="margin: 10px 0 0;"><a href="${appUrl}" target="_blank" style="color: #666666; text-decoration: underline;">Privacy Policy</a> &nbsp;|&nbsp; <a href="${appUrl}" target="_blank" style="color: #666666; text-decoration: underline;">Contact Us</a></p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
    };

    // Send email asynchronously. We don't wait for it to complete to keep the API response fast.
    transporter.sendMail(mailOptions).catch(err => {
        // Log the error for debugging, but don't crash the server.
        console.error(`Failed to send signup email to ${user.email}:`, err);
    });
};

module.exports = { sendSignupEmail };