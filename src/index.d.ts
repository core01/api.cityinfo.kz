import { Request } from 'express';
import { Server } from 'socket.io';

declare interface expressRequest extends Request {
  io?: Server;
}
