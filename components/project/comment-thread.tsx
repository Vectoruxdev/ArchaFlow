"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  mentions?: string[]
}

interface CommentThreadProps {
  comments: Comment[]
  onAddComment?: (content: string) => void
}

export function CommentThread({ comments, onAddComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment)
      setNewComment("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={comment.avatar} alt="" />
              <AvatarFallback className="bg-[--af-bg-surface-alt] dark:bg-warm-800 text-sm">
                {comment.author.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className="text-xs text-[--af-text-muted]">{comment.timestamp}</span>
              </div>
              <div className="text-sm text-[--af-text-secondary] dark:text-[--af-text-muted] whitespace-pre-wrap">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="border-t border-[--af-border-default] pt-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className="bg-warm-900 dark:bg-[--af-bg-surface] text-white dark:text-foreground text-sm">
              ME
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment... Use @ to mention team members"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!newComment.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
