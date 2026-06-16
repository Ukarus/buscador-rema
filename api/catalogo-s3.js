const UPSTREAM_URL = 'https://lineasdebasepublicas.mma.gob.cl/api/catalogo-s3';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const upstreamResponse = await fetch(UPSTREAM_URL, {
      headers: {
        Accept: req.headers.accept || '*/*',
      },
    });

    if (!upstreamResponse.ok) {
      res.status(upstreamResponse.status).json({
        error: 'Upstream request failed',
        statusText: upstreamResponse.statusText,
      });
      return;
    }

    const contentType =
      upstreamResponse.headers.get('content-type') ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const cacheControl = upstreamResponse.headers.get('cache-control');
    const lastModified = upstreamResponse.headers.get('last-modified');
    const etag = upstreamResponse.headers.get('etag');

    res.setHeader('Content-Type', contentType);
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    }
    if (lastModified) {
      res.setHeader('Last-Modified', lastModified);
    }
    if (etag) {
      res.setHeader('ETag', etag);
    }

    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    res.status(502).json({
      error: 'Proxy request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}