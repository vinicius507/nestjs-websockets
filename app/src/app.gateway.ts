import { Server, Socket } from "socket.io";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3001",
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  logger: Logger = new Logger("AppGateway");
  connectedUsers: Record<string, Socket> = {};

  @WebSocketServer()
  server: Server;

  afterInit(_: Server) {
    this.logger.log("Initialized gateway");
  }

  handleConnection(client: Socket) {
    const { username } = client.handshake.auth;

    if (!username || this.connectedUsers.hasOwnProperty(username)) {
      this.logger.log(`Client rejected: ${username}(${client.id})`);
      client.emit("unauthorized", "Invalid username");
      client.disconnect(true);
      return;
    }

    this.connectedUsers[username] = client;
    this.logger.log(`Client connected: ${username}(${client.id})`);

    client.emit("authorized");
    this.server.emit("userList", Object.keys(this.connectedUsers));
  }

  handleDisconnect(client: Socket) {
    const { username } = client.handshake.auth;

    delete this.connectedUsers[username];
    this.server.emit("userList", Object.keys(this.connectedUsers));
    this.logger.log(`Client disconnected: ${username || "unnamed"}(${client.id})`);
  }

  @SubscribeMessage("message")
  handleMessage(client: Socket, payload: { to: string, message: string }) {
    const { username } = client.handshake.auth;
    const { to, message } = payload;

    if (!this.connectedUsers.hasOwnProperty(to)) {
      client.emit("messageError", "User not found");
      return;
    }

    const target = this.connectedUsers[to];
    this.server.to(target.id).emit("message", { from: username, message });
  }
}
