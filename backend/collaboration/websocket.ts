import { api, StreamInOut } from "encore.dev/api";
import type { CollaborationEvent, CursorPosition } from "../design/types";

const roomConnections = new Map<string, Set<StreamInOut<CollaborationEvent, CollaborationEvent>>>();
const userCursors = new Map<string, CursorPosition>();

export interface CollaborationHandshake {
  design_file_id: string;
  user_id: string;
  user_name: string;
}

// Real-time collaboration for design files.
export const collaborate = api.streamInOut<CollaborationHandshake, CollaborationEvent, CollaborationEvent>(
  { expose: true, path: "/collaborate" },
  async (handshake, stream) => {
    const roomId = `design_${handshake.design_file_id}`;
    
    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }
    
    const room = roomConnections.get(roomId)!;
    room.add(stream);

    try {
      // Send current cursors to new user
      for (const cursor of userCursors.values()) {
        if (cursor.user_id !== handshake.user_id) {
          await stream.send({
            type: "cursor",
            user_id: cursor.user_id,
            user_name: cursor.user_name,
            data: cursor,
            timestamp: Date.now()
          });
        }
      }

      // Listen for events from this user
      for await (const event of stream) {
        // Update cursor position if it's a cursor event
        if (event.type === "cursor") {
          userCursors.set(handshake.user_id, {
            user_id: handshake.user_id,
            user_name: handshake.user_name,
            x: event.data.x,
            y: event.data.y,
            color: event.data.color || "#007AFF"
          });
        }

        // Broadcast event to all other users in the room
        const eventWithUser = {
          ...event,
          user_id: handshake.user_id,
          user_name: handshake.user_name,
          timestamp: Date.now()
        };

        for (const connection of room) {
          if (connection !== stream) {
            try {
              await connection.send(eventWithUser);
            } catch (err) {
              // Remove disconnected client
              room.delete(connection);
            }
          }
        }
      }
    } finally {
      // Clean up when user disconnects
      room.delete(stream);
      userCursors.delete(handshake.user_id);
      
      if (room.size === 0) {
        roomConnections.delete(roomId);
      }

      // Notify others that user left
      const leaveEvent: CollaborationEvent = {
        type: "cursor",
        user_id: handshake.user_id,
        user_name: handshake.user_name,
        data: { left: true },
        timestamp: Date.now()
      };

      for (const connection of room) {
        try {
          await connection.send(leaveEvent);
        } catch (err) {
          room.delete(connection);
        }
      }
    }
  }
);
