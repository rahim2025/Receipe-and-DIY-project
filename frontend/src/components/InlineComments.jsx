import React, { useState, useEffect } from 'react';
import { Send, Heart, Reply, Trash2, MessageCircle, Edit3, Check, X } from 'lucide-react';
import useInteractionStore from '../store/useInteractionStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const InlineComments = ({ post, limit = 3, showAddComment = true }) => {
  const { authUser } = useAuthStore();
  const { 
    comments, 
    loadingStates,
    addComment, 
    getComments, 
    toggleCommentLike, 
    editComment,
    deleteComment 
  } = useInteractionStore();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  const postComments = comments[post._id] || [];
  const displayedComments = showAllComments ? postComments : postComments.slice(0, limit);

  useEffect(() => {
    loadComments();
  }, [post._id]);

  const loadComments = async () => {
    try {
      await getComments(post._id, 1);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!authUser) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await addComment(post._id, newComment.trim(), replyingTo);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!authUser) {
      toast.error('Please login to like comments');
      return;
    }
    await toggleCommentLike(commentId);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await editComment(commentId, editText.trim());
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8' : ''} mb-3`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={comment.user.profilePic || '/default-avatar.png'}
            alt={comment.user.username}
            className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="glass-card p-4" style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm text-white readable contrast-on-glass">
                {comment.user.firstName} {comment.user.lastName}
              </span>
              <span className="text-xs text-white/80 readable">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-white/70 readable">(edited)</span>
              )}
            </div>
            
            {editingComment === comment._id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="glass-input w-full p-3 text-sm resize-none"
                  rows={2}
                  maxLength={500}
                  placeholder="Edit your comment..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(comment._id)}
                    className="glass-btn-primary flex items-center gap-1 px-3 py-1.5 text-xs"
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="glass-btn flex items-center gap-1 px-3 py-1.5 text-xs"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/90 whitespace-pre-wrap readable contrast-on-glass">
                {comment.text}
              </p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <button
              onClick={() => handleCommentLike(comment._id)}
              className={`flex items-center gap-1 transition-colors px-2 py-1 rounded-full ${
                comment.isLiked ? 'text-red-400 bg-red-500/10' : 'text-white/70 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
              <span className="readable">{comment.likeCount || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment._id)}
                className="text-white/70 hover:text-teal-400 transition-colors px-2 py-1 rounded-full hover:bg-teal-500/10 readable"
              >
                Reply
              </button>
            )}

            {comment.user._id === authUser?._id && (
              <>
                <button
                  onClick={() => handleEditComment(comment)}
                  className="text-white/70 hover:text-blue-400 transition-colors px-2 py-1 rounded-full hover:bg-blue-500/10 readable"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-white/70 hover:text-red-400 transition-colors px-2 py-1 rounded-full hover:bg-red-500/10 readable"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map(reply => (
                <CommentItem key={reply._id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {postComments.length === 0 ? (
        <div className="text-center py-6">
          <MessageCircle className="h-10 w-10 text-white/40 mx-auto mb-3" />
          <p className="text-white/70 text-sm readable">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedComments.map(comment => (
              <CommentItem key={comment._id} comment={comment} />
            ))}
          </div>
          
          {postComments.length > limit && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="glass-btn text-sm font-medium px-4 py-2 text-teal-300 hover:text-teal-200"
            >
              View all {postComments.length} comments
            </button>
          )}

          {showAllComments && postComments.length > limit && (
            <button
              onClick={() => setShowAllComments(false)}
              className="glass-btn text-sm font-medium px-4 py-2 text-white/70 hover:text-white/90"
            >
              Show less
            </button>
          )}
        </>
      )}

      {/* Comment Form */}
      {showAddComment && authUser && (
        <div className="border-t border-white/20 pt-4">
          {replyingTo && (
            <div className="mb-3 p-3 glass-card flex items-center justify-between" style={{ background: 'rgba(20, 184, 166, 0.15)' }}>
              <span className="text-sm text-teal-300 readable font-medium">
                Replying to comment
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-teal-400 hover:text-teal-200 transition-colors readable"
              >
                Cancel
              </button>
            </div>
          )}
          
          <form onSubmit={handleAddComment} className="flex gap-3">
            <img
              src={authUser.profilePic || '/default-avatar.png'}
              alt={authUser.username}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
            />
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  className="glass-input flex-1 text-sm"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || loadingStates.comment}
                  className="glass-btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {loadingStates.comment ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {!authUser && showAddComment && (
        <div className="border-t border-white/20 pt-4 text-center">
          <p className="text-white/70 text-sm readable">Please login to leave a comment</p>
        </div>
      )}
    </div>
  );
};

export default InlineComments;