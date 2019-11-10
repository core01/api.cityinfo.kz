import app from './app';
import { server } from './app';
import { HttpError } from 'http-errors';

/**
 * Start Express server.
 */
server.listen(app.get('port'));
server.on('error', onError);
server.on('listening', onListening);
// io.on('connection', (socket) => {
//   socket.on('connect', () => console.log('Client connected'));
//   socket.on('disconnect', () => console.log('Client disconnected'));
// });

function onError(error: HttpError) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = 'Port ' + app.get('port');

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

export default server;
