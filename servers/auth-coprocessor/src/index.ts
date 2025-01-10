import express, { json, urlencoded } from 'express';
import multer from 'multer';

const app = express();
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ limit: '1mb', extended: true }));
app.use(multer().none());

const requestJwt = async (
  payload: any,
  accessToken: string | null | undefined,
  consumerKey: string | null | undefined,
  cookie: string | null | undefined,
) => {
  const params = new URLSearchParams();
  accessToken && params.append('access_token', accessToken);
  consumerKey && params.append('consumer_key', consumerKey);
  const url = 'https://getpocket.com/v3/jwt';
  const paramString = params.toString();
  const fetchUrl = paramString.length > 0 ? `${url}?${paramString}` : url;
  let response: any;
  if (cookie != null) {
    response = await fetch(fetchUrl, {
      headers: { cookie },
    }).then((res) => res.json());
  } else {
    response = await fetch(fetchUrl).then((res) => res.json());
  }

  // // It's common to set scopes for use by the Router to enforce AuthZN directives

  // //payload.context.entries['apollo_authentication::JWT::claims'].scope = response.scopes;

  // // Add to context so it is available at subsequent stages
  // payload.context.entries['authentication::authToken'] = response.jwt;
  payload.headers['Authorization'] = [`Bearer ${response.jwt}`];

  return payload;
};

app.post('/', express.json(), async (req, res) => {
  const payload = req.body;
  const paramString = (req.body.path as string).split('?')[1];
  // TODO: Process form-data and form urlencoded etc.
  const params = paramString ? new URLSearchParams(paramString) : undefined;
  const accessToken = params?.get('access_token');
  const consumerKey = params?.get('consumer_key');
  const cookie = payload.headers.cookie;

  let response = payload;
  switch (payload.stage) {
    case 'RouterRequest':
      response = await requestJwt(payload, accessToken, consumerKey, cookie);
      break;
  }

  res.send(response);
});

app.listen(3007, () => {
  console.log('🚀 Server running at http://localhost:3007');
});
