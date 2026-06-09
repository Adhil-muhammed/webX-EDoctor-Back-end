export function renderOtpEmail(data: Record<string, string>): {
  subject: string;
  html: string;
} {
  const code = data['code'] ?? '';
  return {
    subject: 'Your Ente Doctor login code',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:32px;">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:8px;padding:40px;">
    <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:8px;">Your login code</h1>
    <p style="color:#555;margin-bottom:24px;">
      Use the code below to sign in to Ente Doctor. It expires in 10 minutes.
    </p>
    <div style="letter-spacing:8px;font-size:36px;font-weight:700;color:#2563eb;text-align:center;padding:24px 0;border:2px dashed #dbeafe;border-radius:6px;">
      ${code}
    </div>
    <p style="color:#999;font-size:12px;margin-top:32px;">
      If you did not request this code, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`,
  };
}
