const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DESTINATION = "contact@kalyfn.com";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return json({ success: false, error: "Invalid origin" }, 403);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  // Honeypot: silently accept automated submissions without sending an email.
  if (clean(data.website, 200)) {
    return json({ success: true });
  }

  const name = clean(data.name, 100);
  const email = clean(data.email, 254);
  const subject = clean(data.subject, 160).replace(/[\r\n]+/g, " ");
  const message = clean(data.message, 5000);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !emailPattern.test(email) || !subject || !message) {
    return json({ success: false, error: "Missing or invalid fields" }, 400);
  }

  if (!env.RESEND_API_KEY) {
    return json({ success: false, error: "Email service is not configured" }, 500);
  }

  const from = env.RESEND_FROM || "KALY <contact@kalyfn.com>";
  const text = [
    "Nouveau message depuis le site KALY",
    "",
    `Nom : ${name}`,
    `E-mail : ${email}`,
    `Objet : ${subject}`,
    "",
    "Message :",
    message
  ].join("\n");

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [DESTINATION],
        reply_to: email,
        subject: `[KALY contact] ${subject}`,
        text
      })
    });
  } catch {
    return json({ success: false, error: "Email provider unavailable" }, 502);
  }

  if (!resendResponse.ok) {
    const providerError = await resendResponse.text();
    console.error("Resend API error:", resendResponse.status, providerError);
    return json({ success: false, error: "Email delivery failed" }, 502);
  }

  return json({ success: true });
}
