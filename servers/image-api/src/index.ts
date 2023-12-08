import config from './config';
import app from './server/main';

app.listen({ port: config.app.serverPort }, () => {
  console.log(
    `🚀 Public server ready at http://localhost:${config.app.serverPort}`,
  );
});
