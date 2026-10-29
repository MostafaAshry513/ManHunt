import type { WebSocket } from 'ws';

export type OutgoingEvent = { type: string; data: unknown };

type Client = { socket: WebSocket; userId: string; roomId: string | null; alive: boolean };

/**
 * Tracks live sockets and fans out events per room, with an optional per-recipient filter.
 * The hub holds no game state: correctness never depends on a socket being connected.
 */
export class Hub {
  private clients = new Set<Client>();

  add(socket: WebSocket, userId: string): Client {
    const client: Client = { socket, userId, roomId: null, alive: true };
    this.clients.add(client);
    return client;
  }

  remove(client: Client): void {
    this.clients.delete(client);
  }

  subscribe(client: Client, roomId: string): void {
    client.roomId = roomId;
  }

  unsubscribe(client: Client): void {
    client.roomId = null;
  }

  /** User ids currently connected to a room. */
  presence(roomId: string): Set<string> {
    const ids = new Set<string>();
    for (const c of this.clients) {
      if (c.roomId === roomId && c.socket.readyState === c.socket.OPEN) ids.add(c.userId);
    }
    return ids;
  }

  send(client: Client, event: OutgoingEvent): void {
    if (client.socket.readyState !== client.socket.OPEN) return;
    try {
      client.socket.send(JSON.stringify(event));
    } catch {
      // A dead socket is cleaned up by the close handler.
    }
  }

  sendToUser(roomId: string, userId: string, event: OutgoingEvent): void {
    for (const c of this.clients) {
      if (c.roomId === roomId && c.userId === userId) this.send(c, event);
    }
  }

  broadcast(roomId: string, event: OutgoingEvent, allow?: (userId: string) => boolean): void {
    for (const c of this.clients) {
      if (c.roomId !== roomId) continue;
      if (allow && !allow(c.userId)) continue;
      this.send(c, event);
    }
  }

  count(): number {
    return this.clients.size;
  }

  all(): Client[] {
    return [...this.clients];
  }
}
