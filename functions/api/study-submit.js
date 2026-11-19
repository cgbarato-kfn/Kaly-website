
const MAX_BODY_BYTES = 40 * 1024;
const SCHEMA_VERSION = "V0.3";

const ALLOWED_PROFILES = new Set(["user", "professional", "pro"]);
const ALLOWED_LANGUAGES = new Set(["fr", "es"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validAnswer(value) {
  if (typeof value === "string") return value.length <= 5000;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;

  if (Array.isArray(value)) {
    return value.length <= 20 &&
      value.every(item =>
        typeof item === "string" && item.length <= 500
      );
  }

  return false;
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return json({ success: false, error: "Invalid origin" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return json({
      success: false,
      error: "Content-Type must be application/json"
    }, 415);
  }

  const declaredLength = Number(
    request.headers.get("Content-Length") || 0
  );

  if (declaredLength > MAX_BODY_BYTES) {
    return json({ success: false, error: "Request too large" }, 413);
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    return json({ success: false, error: "Invalid request body" }, 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ success: false, error: "Request too large" }, 413);
  }

  let data;

  try {
    data = JSON.parse(rawBody);
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  if (
    !isPlainObject(data) ||
    !ALLOWED_PROFILES.has(data.respondent_type) ||
    !ALLOWED_LANGUAGES.has(data.language) ||
    data.schema_version !== SCHEMA_VERSION ||
    !isPlainObject(data.answers)
  ) {
    return json({
      success: false,
      error: "Invalid submission format"
    }, 400);
  }

  // Normalize profile before validation and database insertion.
  const respondentType =
    data.respondent_type === "pro"
      ? "professional"
      : data.respondent_type;

  const maxQuestion = respondentType === "user" ? 28 : 15;

  const answers = {};

  for (const [key, value] of Object.entries(data.answers)) {
    if (
      !/^(?:[1-9]|1\d|2[0-8])$/.test(key) ||
      Number(key) > maxQuestion ||
      !validAnswer(value)
    ) {
      return json({
        success: false,
        error: "Invalid answer data"
      }, 400);
    }

    answers[key] = value;
  }

  const country =
    typeof data.country === "string"
      ? data.country.trim().slice(0, 100)
      : null;

  const responseId = crypto.randomUUID();
  const answersJson = JSON.stringify(answers);

  if (!env.DB) {
    console.error("D1 binding DB is missing");

    return json({
      success: false,
      error: "Storage is not configured"
    }, 500);
  }

  try {
    await env.DB.prepare(`
      INSERT INTO study_responses
        (
          response_id,
          respondent_type,
          language,
          country,
          answers_json,
          schema_version,
          created_at
        )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      responseId,
      respondentType,
      data.language,
      country,
      answersJson,
      SCHEMA_VERSION
    ).run();

  } catch (error) {
    console.error("D1 study response insert failed:", error);

    return json({
      success: false,
      error: "Could not save response"
    }, 500);
  }

  return json({
    success: true,
    response_id: responseId
  }, 201);
}

