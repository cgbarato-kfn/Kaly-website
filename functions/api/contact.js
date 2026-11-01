
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  const json = (status, body) =>
    new Response(JSON.stringify(body), { status, headers });

  if (request.method !== "POST") {
    return json(405, {
      success: false,
      error: "Method not allowed"
    });
  }

  const origin = request.headers.get("Origin");
  const requestUrl = new URL(request.url);

  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host) {
        return json(403, {
          success: false,
          error: "Invalid origin"
        });
      }
    } catch {
      return json(403, {
        success: false,
        error: "Invalid origin"
      });
    }
  }

  let data;

  try {
    data = await request.json();
  } catch {
    return json(400, {
      success: false,
      error: "Invalid JSON"
    });
  }

  // Champ anti-spam invisible (honeypot)
  if (typeof data.website === "string" && data.website.trim()) {
    return json(200, { success: true });
  }

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const subject = String(data.subject || "").trim();
  const message = String(data.message || "").trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !name ||
    name.length > 120 ||
    !emailPattern.test(email) ||
    email.length > 254 ||
    !subject ||
    subject.length > 180 ||
    !message ||
    message.length > 5000
  ) {
    return json(400, {
      success: false,
      error: "Invalid form fields"
    });
  }

  if (!env.RESEND_API_KEY) {
    return json(500, {
      success: false,
      error: "Email service is not configured"
    });
  }

  const emailText = [
    "Nouveau message depuis le formulaire KALY",
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
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || "KALY <contact@kalyfn.com>",
        to: ["contact@kalyfn.com"],
        reply_to: email,
        subject: `[KALY contact] ${subject}`,
        text: emailText
      })
    });
  } catch {
    return json(502, {
      success: false,
      error: "Email provider unavailable"
    });
  }

  if (!resendResponse.ok) {
    return json(502, {
      success: false,
      error: "Email provider rejected the message"
    });
  }

  return json(200, { success: true });
}

