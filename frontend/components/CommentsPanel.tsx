import React, { useState, useEffect } from "react";
import { MessageCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { Comment } from "~backend/design/types";

interface CommentsPanelProps {
  designFileId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsPanel({ designFileId, isOpen, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("Anonymous");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, designFileId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await backend.design.listComments({ design_file_id: designFileId });
      setComments(response.comments);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setAdding(true);
    try {
      await backend.design.addComment({
        design_file_id: designFileId,
        x_position: Math.random() * 400, // Random position for demo
        y_position: Math.random() * 400,
        content: newComment,
        author_name: authorName,
      });
      
      setNewComment("");
      loadComments();
      
      toast({
        title: "Success",
        description: "Comment added",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-40">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center space-x-2">
          <MessageCircle className="h-4 w-4" />
          <span>Comments</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 h-full overflow-y-auto">
        {/* Add new comment */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={adding || !newComment.trim()}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              {adding ? "Adding..." : "Add Comment"}
            </Button>
          </CardContent>
        </Card>

        {/* Comments list */}
        {loading ? (
          <div className="text-center py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No comments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">{comment.author_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    Position: ({Math.round(comment.x_position)}, {Math.round(comment.y_position)})
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
