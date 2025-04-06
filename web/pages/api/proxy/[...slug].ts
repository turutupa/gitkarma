import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Retrieve token instead of session.
  const tokenData = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!tokenData) {
    res.status(401).json({ error: 'Unauthorized: No token found' });
    return;
  }
  const jwtData = {
    id: tokenData.sub,
    name: tokenData.name,
    picture: tokenData.picture,
  };
  // Generate JWT using the tokenData.
  const jwtSecret = process.env.NEXTAUTH_SECRET || 'defaultSecret';
  const jwtToken = jwt.sign(jwtData, jwtSecret, { algorithm: 'HS256' });

  const { slug } = req.query;
  const targetPath = Array.isArray(slug) ? slug.join('/') : slug;
  const targetBase = process.env.API_BASE_URL; // e.g. "http://localhost:4000"
  if (!targetBase) {
    res.status(500).json({ error: 'API_BASE_URL is not defined' });
    return;
  }
  const targetUrl = `${targetBase}/api/${targetPath}`;

  try {
    const axiosResponse = await axios.request({
      url: targetUrl,
      method: req.method as any,
      // Forward headers but override host to match the backend's host.
      headers: {
        'Content-Type': 'application/json',
        host: new URL(targetBase).host,
        ...req.headers,
        Authorization: `Bearer ${jwtToken}`,
      },
      // Only forward the body if it's not a GET/HEAD.
      data: ['GET', 'HEAD'].includes(req.method || '') ? undefined : req.body,
      responseType: 'stream',
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    });

    res.status(axiosResponse.status);
    Object.entries(axiosResponse.headers).forEach(([key, value]) => {
      if (value) {
        res.setHeader(key, value as string);
      }
    });

    // If status code indicates no content, don't send a body.
    if ([204, 304].includes(axiosResponse.status)) {
      res.end();
      return;
    }

    axiosResponse.data.pipe(res);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      // Avoid sending a body for 204 or 304 responses.
      if ([204, 304].includes(status)) {
        res.status(status).end();
        return;
      }
      res.status(status).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to proxy request' });
  }
}
