import React from "react";
import { MousePointer } from "lucide-react";
import type { CursorPosition } from "~backend/design/types";

interface CollaborationCursorsProps {
  cursors: CursorPosition[];
}

export function CollaborationCursors({ cursors }: CollaborationCursorsProps) {
  return (
    <>
      {cursors.map((cursor) => (
        <div
          key={cursor.user_id}
          className="absolute pointer-events-none z-50"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-2px, -2px)",
          }}
        >
          <div className="relative">
            <MousePointer
              className="h-5 w-5"
              style={{ color: cursor.color }}
              fill={cursor.color}
            />
            <div
              className="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.user_name}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
