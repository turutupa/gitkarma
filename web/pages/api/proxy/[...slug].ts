// pages/api/proxy/[...slug].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const targetPath = Array.isArray(slug) ? slug.join('/') : slug;
  const targetBase = process.env.API_BASE_URL; // e.g. "http://localhost:4000"
  if (!targetBase) {
    return res.status(500).json({ error: 'API_BASE_URL is not defined' });
  }
  const targetUrl = `${targetBase}/api/${targetPath}`;

  try {
    const axiosResponse = await axios.request({
      url: targetUrl,
      method: req.method as any,
      // Forward headers but override host to match the backend's host.
      headers: {
        ...req.headers,
        host: new URL(targetBase).host,
      },
      // Only forward the body if it's not a GET/HEAD.
      data: ['GET', 'HEAD'].includes(req.method || '') ? undefined : req.body,
      responseType: 'stream',
    });

    res.status(axiosResponse.status);
    Object.entries(axiosResponse.headers).forEach(([key, value]) => {
      if (value) {
        res.setHeader(key, value as string);
      }
    });
    axiosResponse.data.pipe(res);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error in proxy:', error);
      res.status(error.response?.status || 500).json({ error: error.message });
    } else {
      console.error('Unexpected error in proxy:', error);
      res.status(500).json({ error: 'Failed to proxy request' });
    }
  }
}
