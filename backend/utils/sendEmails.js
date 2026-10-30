import nodemailer from "nodemailer";

let transporter;

if (process.env.NODE_ENV === "production") {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  let testAccount;
  try {
    testAccount = await nodemailer.createTestAccount();
  } catch {
    testAccount = { user: "test@ethereal.email", pass: "test" };
  }
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log("Ethereal account:", testAccount.user);
}

export async function sendLeakAlertEmail(to, matches) {
  const body = matches
    .map((m) => `<li><strong>${m.field}</strong>: ${m.value} &mdash; ${m.source}</li>`)
    .join("");

  const mailOptions = {
    from: '"PhishNet Exchange" <no-reply@phishnet.exchange>',
    to,
    subject: "Leak Detected on the Dark Web",
    html: `
      <h3>We found potential data leaks from your recent scan</h3>
      <ul>${body}</ul>
      <p>Please take immediate action to secure your accounts.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Leak alert sent:", info.messageId);

  if (process.env.NODE_ENV !== "production") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendTrialConfirmationEmail({ name, email, company, tier, magicUrl }) {
  const tierLabel = { sentry: "Sentry", sentinel: "Sentinel", citadel: "Citadel" }[tier] || "Sentry";
  const activateUrl = magicUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/magic`;
  const mailOptions = {
    from: '"SecureFix.KE" <trials@securefix.ke>',
    to: email,
    subject: `Your SecureFix.KE ${tierLabel} Trial — Activate Your Account`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">SecureFix.KE</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0;">Trial Activation</p>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <p style="color: #1a202c; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
            Thank you for your interest in SecureFix.KE. We've received your request for a 
            <strong style="color: #2563eb;">${tierLabel}</strong> trial on behalf of <strong>${company}</strong>.
          </p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
            Click the button below to create your account and start your 15-day free trial immediately.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activateUrl}" 
               style="background: #2563eb; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
              Activate Your Trial →
            </a>
          </div>
          <p style="color: #718096; font-size: 13px; text-align: center; margin-bottom: 24px;">
            This link expires in 7 days. No credit card required.
          </p>
          <p style="color: #4a5568; font-size: 14px; line-height: 1.6;">
            Once activated, you'll have full access to all ${tierLabel} features. Our team is also available if you need help getting started.
          </p>
          <p style="color: #718096; font-size: 13px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            SecureFix.KE — Enterprise Cybersecurity Solutions for Kenyan Businesses
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Trial confirmation sent:", info.messageId);
  if (process.env.NODE_ENV !== "production") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendTeamInvitationEmail(to, teamName, inviteUrl) {
  const mailOptions = {
    from: '"PhishNet Exchange" <no-reply@phishnet.exchange>',
    to,
    subject: `You're Invited to Join ${teamName} on PhishNet Exchange`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Team Invitation</h1>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <p style="color: #1a202c; font-size: 16px; line-height: 1.6;">You've been invited to join</p>
          <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <h2 style="color: #667eea; margin: 0; font-size: 20px;">${teamName}</h2>
          </div>
          <p style="color: #1a202c; font-size: 16px; line-height: 1.6;">
            PhishNet Exchange protects your team from phishing, malware, and data leaks in real time.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #718096; font-size: 14px; margin-top: 24px;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Team invitation sent:", info.messageId);

  if (process.env.NODE_ENV !== "production") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}
