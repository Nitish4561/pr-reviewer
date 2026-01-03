import { NextResponse } from "next/server";
import { Resend } from 'resend';

/**
 * GET /api/test-email
 * Test email configuration and send a test email
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testEmail = searchParams.get("to");

  // Check environment variables
  const config = {
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 6) || "NOT_SET",
    fromEmail: process.env.RESEND_FROM_EMAIL || "NOT_SET",
    adminEmails: process.env.ADMIN_EMAILS || "NOT_SET",
  };

  console.log("📧 Email Configuration Check:");
  console.log("   RESEND_API_KEY:", config.hasApiKey ? `${config.apiKeyPrefix}...` : "❌ NOT SET");
  console.log("   RESEND_FROM_EMAIL:", config.fromEmail);
  console.log("   ADMIN_EMAILS:", config.adminEmails);

  if (!config.hasApiKey) {
    return NextResponse.json({
      success: false,
      error: "RESEND_API_KEY not configured",
      config,
      help: "Add RESEND_API_KEY to your environment variables in Vercel"
    }, { status: 500 });
  }

  if (!testEmail) {
    return NextResponse.json({
      success: false,
      config,
      message: "Add ?to=your@email.com to send a test email"
    });
  }

  // Try to send a test email
  try {
    console.log(`📧 Attempting to send test email to: ${testEmail}`);
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: testEmail,
      subject: '✅ Test Email from NirikshanAI',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #10b981;">✅ Email Configuration Working!</h1>
            <p>If you're seeing this, your Resend email integration is configured correctly.</p>
            <hr>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>API Key: ${config.apiKeyPrefix}... ✅</li>
              <li>From Email: ${config.fromEmail}</li>
              <li>Test Sent: ${new Date().toISOString()}</li>
            </ul>
            <hr>
            <p style="color: #666; font-size: 14px;">
              This is a test email from NirikshanAI. If you didn't request this, you can ignore it.
            </p>
          </body>
        </html>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log("   Message ID:", result.data?.id);
    console.log("   Result:", result);

    return NextResponse.json({
      success: true,
      message: "Test email sent! Check your inbox (and spam folder)",
      config,
      messageId: result.data?.id,
      result: result.data,
    });
  } catch (error: any) {
    console.error("❌ Failed to send test email:", error);
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
    console.error("   Error details:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
      errorDetails: {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
      },
      config,
      help: "Check if your RESEND_API_KEY is valid in Resend dashboard"
    }, { status: 500 });
  }
}

