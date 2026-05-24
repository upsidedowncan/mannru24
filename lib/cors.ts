/**
 * Функция для генерации правильных хакерских CORS-заголовков
 */
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";

  return {
    // Возвращаем прилетевший домен вместо звёздочки, чтобы куки работали!
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Credentials": "true",
  };
}
