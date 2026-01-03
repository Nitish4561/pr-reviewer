import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
const APP_NAME = 'NirikshanAI';
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4002';

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/**
 * Send email to admin when a new access request is submitted
 */
export async function sendAdminAccessRequestNotification(request: {
  name: string;
  email: string;
  githubUsername: string;
  message?: string;
}) {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured - skipping admin notification');
    return { success: false, message: 'Email not configured' };
  }

  try {
    console.log(`📧 Sending admin notification for access request: ${request.email}`);

    const emailPromises = ADMIN_EMAILS.map(adminEmail =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `🔔 New Access Request - ${APP_NAME}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .info-row { margin: 10px 0; }
                .label { font-weight: 600; color: #555; display: inline-block; width: 150px; }
                .value { color: #333; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">🔔 New Access Request</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone wants to join ${APP_NAME}</p>
                </div>
                <div class="content">
                  <p>Hello Admin,</p>
                  <p>A new user has requested access to <strong>${APP_NAME}</strong>. Please review their request:</p>
                  
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">👤 Name:</span>
                      <span class="value">${request.name}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">📧 Email:</span>
                      <span class="value">${request.email}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">🐙 GitHub:</span>
                      <span class="value">@${request.githubUsername}</span>
                    </div>
                    ${request.message ? `
                    <div class="info-row" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <span class="label">💬 Message:</span>
                      <div style="margin-top: 10px; padding: 15px; background: #f3f4f6; border-radius: 6px; color: #333;">
                        ${request.message}
                      </div>
                    </div>
                    ` : ''}
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${APP_URL}/admin" class="button" style="color: white;">
                      🔍 Review in Admin Dashboard
                    </a>
                  </div>

                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Go to your admin dashboard to approve or reject this request.
                  </p>
                </div>
                <div class="footer">
                  <p>You're receiving this because you're an admin of ${APP_NAME}</p>
                  <p style="margin-top: 10px;">
                    <a href="${APP_URL}" style="color: #667eea;">Visit Dashboard</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    );

    const results = await Promise.all(emailPromises);
    console.log(`✅ Admin notification sent to ${ADMIN_EMAILS.length} admin(s)`);
    
    return { 
      success: true, 
      messageIds: results.map(r => r.data?.id),
    };
  } catch (error: any) {
    console.error('❌ Failed to send admin notification:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Send email to user when their access request is approved
 */
export async function sendAccessApprovedEmail(user: {
  name: string;
  email: string;
  githubUsername: string;
}) {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured - skipping approval notification');
    return { success: false, message: 'Email not configured' };
  }

  try {
    console.log(`📧 Sending approval notification to: ${user.email}`);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `✅ Access Approved - Welcome to ${APP_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-icon { font-size: 60px; margin-bottom: 10px; }
              .button { display: inline-block; padding: 14px 35px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
              .steps { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
              .step { margin: 15px 0; padding-left: 35px; position: relative; }
              .step-number { position: absolute; left: 0; top: 0; background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">🎉</div>
                <h1 style="margin: 0; font-size: 32px;">Access Approved!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to ${APP_NAME}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>Great news! Your access request to <strong>${APP_NAME}</strong> has been approved. You can now start using AI-powered code reviews for your pull requests.</p>

                <div style="text-align: center;">
                  <a href="${APP_URL}" class="button" style="color: white;">
                    🚀 Get Started Now
                  </a>
                </div>

                <div class="steps">
                  <h3 style="margin-top: 0; color: #10b981;">📋 Next Steps:</h3>
                  
                  <div class="step">
                    <div class="step-number">1</div>
                    <strong>Sign in with GitHub</strong><br>
                    <span style="color: #666; font-size: 14px;">Use your GitHub account (@${user.githubUsername}) to sign in</span>
                  </div>

                  <div class="step">
                    <div class="step-number">2</div>
                    <strong>Install NirikshanAI GitHub App</strong><br>
                    <span style="color: #666; font-size: 14px;">Connect it to your repositories</span>
                  </div>

                  <div class="step">
                    <div class="step-number">3</div>
                    <strong>Add your OpenAI API Key</strong><br>
                    <span style="color: #666; font-size: 14px;">This powers the AI code reviews (your key, your control)</span>
                  </div>

                  <div class="step">
                    <div class="step-number">4</div>
                    <strong>Start reviewing!</strong><br>
                    <span style="color: #666; font-size: 14px;">Open a PR and watch NirikshanAI review it automatically</span>
                  </div>
                </div>

                <p style="margin-top: 30px;">
                  Need help? Check out our <a href="${APP_URL}" style="color: #10b981;">documentation</a> or reach out to support.
                </p>
              </div>
              <div class="footer">
                <p>Happy coding! 🚀</p>
                <p style="margin-top: 10px;">
                  <a href="${APP_URL}" style="color: #10b981;">Visit Dashboard</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Approval notification sent to: ${user.email}`);
    return { 
      success: true, 
      messageId: result.data?.id 
    };
  } catch (error: any) {
    console.error('❌ Failed to send approval notification:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Send email to user when their access request is rejected
 */
export async function sendAccessRejectedEmail(user: {
  name: string;
  email: string;
  githubUsername: string;
}) {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured - skipping rejection notification');
    return { success: false, message: 'Email not configured' };
  }

  try {
    console.log(`📧 Sending rejection notification to: ${user.email}`);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Access Request Update - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Access Request Update</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">${APP_NAME}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>Thank you for your interest in <strong>${APP_NAME}</strong>.</p>
                
                <div class="info-box">
                  <p style="margin: 0;"><strong>⚠️ Access Request Status:</strong> Not Approved</p>
                </div>

                <p>Unfortunately, we're unable to approve your access request at this time. This could be due to:</p>
                <ul style="color: #666;">
                  <li>Limited beta capacity</li>
                  <li>Verification requirements</li>
                  <li>Other administrative reasons</li>
                </ul>

                <p>If you believe this is an error or would like to reapply, please feel free to reach out or submit a new request.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${APP_URL}" class="button" style="color: white;">
                    Visit Homepage
                  </a>
                </div>

                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  Thank you for your understanding.
                </p>
              </div>
              <div class="footer">
                <p>Best regards,<br>The ${APP_NAME} Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Rejection notification sent to: ${user.email}`);
    return { 
      success: true, 
      messageId: result.data?.id 
    };
  } catch (error: any) {
    console.error('❌ Failed to send rejection notification:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
