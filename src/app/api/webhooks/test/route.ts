import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url, secret, payload } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, statusCode: 400, message: 'URL webhook wajib diisi' }, { status: 400 });
    }

    // SSR server-side fetch with 6 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-ASAP-Secret': secret } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? 'Webhook berhasil menerima sinyal test' : `Respon status HTTP ${response.status}`,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      return NextResponse.json({
        success: false,
        statusCode: 504,
        message: fetchErr.name === 'AbortError' ? 'Koneksi timeout (6 detik)' : fetchErr.message || 'Gagal menghubungi URL',
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, statusCode: 500, message: err.message || 'Internal error' }, { status: 500 });
  }
}
