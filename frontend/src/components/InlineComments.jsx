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
            className="w-6 h-6 rounded-full object-cover"
          />
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user.firstName} {comment.user.lastName}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            
            {editingComment === comment._id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(comment._id)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {comment.text}
              </p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-1 text-xs">
            <button
              onClick={() => handleCommentLike(comment._id)}
              className={`flex items-center gap-1 transition-colors ${
                comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likeCount || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment._id)}
                className="text-gray-500 hover:text-blue-500 transition-colors"
              >
                Reply
              </button>
            )}

            {comment.user._id === authUser?._id && (
              <>
                <button
                  onClick={() => handleEditComment(comment)}
                  className="text-gray-500 hover:text-blue-500 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
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
        <div className="text-center py-4">
          <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
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
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              View all {postComments.length} comments
            </button>
          )}

          {showAllComments && postComments.length > limit && (
            <button
              onClick={() => setShowAllComments(false)}
              className="text-gray-500 hover:text-gray-600 text-sm font-medium"
            >
              Show less
            </button>
          )}
        </>
      )}

      {/* Comment Form */}
      {showAddComment && authUser && (
        <div className="border-t pt-4">
          {replyingTo && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Replying to comment
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                Cancel
              </button>
            </div>
          )}
          
          <form onSubmit={handleAddComment} className="flex gap-3">
            <img
              src={authUser.profilePic || '/default-avatar.png'}
              alt={authUser.username}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || loadingStates.comment}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                >
                  {loadingStates.comment ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {!authUser && showAddComment && (
        <div className="border-t pt-4 text-center">
          <p className="text-gray-500 text-sm">Please login to leave a comment</p>
        </div>
      )}
    </div>
  );
};

export default InlineComments;