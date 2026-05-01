const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function generateGeminiText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL.startsWith("models/") ? GEMINI_MODEL : `models/${GEMINI_MODEL}`}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 180,
        },
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Gemini request failed with ${res.status}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim() || null;
}
