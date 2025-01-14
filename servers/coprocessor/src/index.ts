import express, { json, urlencoded } from 'express';
import multer from 'multer';
import { jwtDecode, JwtPayload } from 'jwt-decode';

const app = express();
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ limit: '1mb', extended: true }));
app.use(multer().none());

const requestJwt = async (
  payload: any,
  params: URLSearchParams,
  headers: HeadersInit | undefined,
) => {
  const url = 'https://getpocket.com/v3/jwt';
  const paramString = params.toString();
  const fetchUrl = paramString.length > 0 ? `${url}?${paramString}` : url;
  try {
    const response = await fetch(fetchUrl, {
      headers,
    });
    if (response.ok === false) {
      console.error(response.status);
      console.error(response.statusText);
      const responseText = await response.text();
      console.error(responseText);
      return payload;
    } else {
      const jwtValue = await response.json();
      if (jwtValue.jwt != null) {
        const decoded = jwtDecode<JwtPayload & { roles?: string[] }>(
          jwtValue.jwt,
        );
        payload.context.entries['apollo_authentication::JWT::claims'] = decoded;
        // Extract scopes for AuthZ directives
        payload.context.entries['apollo_authentication::JWT::claims'].scope =
          decoded.roles != null ? decoded.roles.join(' ') : undefined;
      }
      return payload;
    }
  } catch (error) {
    console.error(error);
    return payload;
  }
};

app.get('/health', async (req, res) => {
  res.status(200).send('ok');
});

app.post('/', express.json(), async (req, res) => {
  const payload = req.body;
  // short-circuit if we already have JWT
  if (payload.context.entries['apollo_authentication::JWT::claims'] != null) {
    res.send(payload);
    return;
  }

  const paramString = (req.body.path as string).split('?')[1];

  // TODO: Process form-data and form urlencoded etc.
  // short-circuit if no consumer key
  const givenParams = paramString
    ? new URLSearchParams(paramString)
    : undefined;
  if (givenParams == null || givenParams?.get('consumer_key') == null) {
    res.send(payload);
    return;
  }

  const params = new URLSearchParams();
  params.append('consumer_key', givenParams!.get('consumer_key')!);
  params.append('enable_cors', '1');
  const accessToken = givenParams?.get('access_token');
  if (accessToken != null) {
    params.append('access_token', accessToken);
  }
  const headers =
    payload.headers.cookie != null
      ? { Cookie: payload.headers.cookie }
      : undefined;

  const response = await requestJwt(payload, params, headers);
  res.send(response);
});

app.listen(3007, () => {
  console.log('🚀 Server running at http://localhost:3007');
});
