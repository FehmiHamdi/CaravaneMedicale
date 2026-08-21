import { NextResponse } from 'next/server';

// Wraps a route handler so a DB/connection failure always returns a valid JSON
// error response instead of crashing the function with an empty body (which
// makes the client's res.json() throw "Unexpected end of JSON input").
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error('API error:', err);
      return NextResponse.json(
        { error: 'تعذر الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى بعد قليل' },
        { status: 500 }
      );
    }
  };
}
