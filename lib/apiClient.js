// A DB/connection failure on the server can produce a non-JSON or empty body.
// res.json() throws a cryptic "Unexpected end of JSON input" in that case —
// this gives a friendly Arabic message instead.
export async function safeJson(res) {
  const text = await res.text();
  if (!text) {
    throw new Error('لا توجد استجابة من الخادم، تحقق من الاتصال وحاول مرة أخرى');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('استجابة غير صالحة من الخادم، يرجى المحاولة مرة أخرى');
  }
}
