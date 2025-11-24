import type { NextApiRequest, NextApiResponse } from 'next';

const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const cookieName = `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`;
    const token = req.cookies?.[cookieName] as string | undefined;

    if (!token) {
      return res.status(400).json({ error: 'No session token found' });
    }

    const secure = process.env.NODE_ENV === 'production';
    const expires = new Date(Date.now() + MAX_AGE * 1000).toUTCString();

    const cookie = `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}; Expires=${expires}; ${
      secure ? 'Secure; ' : ''
    }`;

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('extend-session error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
