import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const logoutUrl = `https://github.com/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL || '')}`;
  res.redirect(logoutUrl);
}
