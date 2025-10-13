import nodemailer from "nodemailer";

let transporter;

if (process.env.NODE_ENV === "production") {
  // Use Gmail or another SMTP in production
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  // 🧪 Use Ethereal in dev
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("📧 Ethereal account:", testAccount.user);
}

export async function sendLeakAlertEmail(to, matches) {
  const body = matches
    .map(
      (m) => `<li><strong>${m.field}</strong>: ${m.value} — ${m.source}</li>`
    )
    .join("");

  const mailOptions = {
    from: `"PhishNet Exchange" <no-reply@phishnet.exchange>`,
    to,
    subject: "⚠️ Leak Detected on the Dark Web",
    html: `
      <h3>We found potential data leaks from your recent scan</h3>
      <ul>${body}</ul>
      <p>Please take immediate action to secure your accounts.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("📤 Leak alert sent:", info.messageId);

  if (process.env.NODE_ENV !== "production") {
    console.log("📬 Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}
