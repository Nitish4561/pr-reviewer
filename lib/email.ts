import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendApprovalEmailParams {
  to: string;
  name: string;
  installationLink: string;
  dashboardLink: string;
}

export async function sendApprovalEmail({
  to,
  name,
  installationLink,
  dashboardLink,
}: SendApprovalEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "NirikshanAI <onboarding@resend.dev>",
      to: [to],
      subject: "🎉 Welcome to NirikshanAI Beta!",
      html: getApprovalEmailHTML(name, installationLink, dashboardLink),
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("✅ Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

function getApprovalEmailHTML(
  name: string,
  installationLink: string,
  dashboardLink: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NirikshanAI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9fafb;
      padding: 40px 30px;
      border-radius: 0 0 10px 10px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .section {
      background: white;
      padding: 25px;
      margin: 20px 0;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .section h2 {
      margin-top: 0;
      color: #667eea;
      font-size: 20px;
    }
    .steps {
      margin: 20px 0;
    }
    .step {
      margin: 15px 0;
      padding-left: 30px;
      position: relative;
    }
    .step:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 20px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 0;
      font-weight: 600;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .features {
      margin: 20px 0;
    }
    .feature {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Private Beta</div>
    <h1>🎉 Welcome to NirikshanAI!</h1>
  </div>
  
  <div class="content">
    <p class="greeting">Hi ${name},</p>
    
    <p>Great news! Your request for <strong>NirikshanAI beta access</strong> has been approved.</p>
    
    <div class="section">
      <h2>🚀 Get Started in 3 Steps</h2>
      
      <div class="steps">
        <div class="step">
          <strong>Install the GitHub App</strong><br>
          <a href="${installationLink}" class="button">Install NirikshanAI →</a>
        </div>
        
        <div class="step">
          <strong>Add your OpenAI API key</strong><br>
          <a href="${dashboardLink}" class="button">Go to Dashboard →</a>
        </div>
        
        <div class="step">
          <strong>Open or update a Pull Request</strong><br>
          NirikshanAI will automatically review it!
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>✨ What You Get</h2>
      <div class="features">
        <div class="feature">Line-by-line code review comments</div>
        <div class="feature">Security & performance suggestions</div>
        <div class="feature">Best practice recommendations</div>
        <div class="feature">Automatic PR labeling</div>
      </div>
    </div>
    
    <div class="section">
      <h2>🔒 Privacy & Security</h2>
      <p style="margin: 0; color: #6b7280;">
        Your OpenAI API key is encrypted and stored securely. We only analyze PR diffs and never store your code permanently.
      </p>
    </div>
    
    <p style="margin-top: 30px;">
      Questions or feedback? Just reply to this email—I'd love to hear from you!
    </p>
    
    <p style="margin-top: 20px;">
      Best regards,<br>
      <strong>Nitish</strong><br>
      Creator, NirikshanAI
    </p>
  </div>
  
  <div class="footer">
    <p>This is a private beta invitation. Access is limited.</p>
    <p>You received this email because you requested beta access to NirikshanAI.</p>
  </div>
</body>
</html>
  `.trim();
}
