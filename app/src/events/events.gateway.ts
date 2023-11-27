import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";

interface WsEvent {
  author: string;
  message: string;
}

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3001",
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("events")
  handleEvent(@MessageBody() data: WsEvent) {
    this.server.emit("events", data);
  }
}
