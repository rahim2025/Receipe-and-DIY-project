import React, { useState, useEffect } from 'react';
import { X, Send, Heart, Reply, Trash2, MoreHorizontal, MessageCircle, Edit3, Check } from 'lucide-react';
import useInteractionStore from '../store/useInteractionStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CommentsModal = ({ post, isOpen, onClose }) => {
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  const postComments = comments[post._id] || [];

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, post._id]);

  const loadComments = async () => {
    try {
      const result = await getComments(post._id, 1);
      setHasMore(result.pagination.hasNextPage);
      setPage(1);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadMoreComments = async () => {
    try {
      const nextPage = page + 1;
      const result = await getComments(post._id, nextPage);
      setHasMore(result.pagination.hasNextPage);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more comments:', error);
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
    <div className={`${isReply ? 'ml-12' : ''} mb-4`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={comment.user.profilePic || '/default-avatar.png'}
            alt={comment.user.username}
            className="w-8 h-8 rounded-full object-cover"
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
                @{comment.user.username}
              </span>
              <span className="text-xs text-gray-500">•</span>
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
                  rows={3}
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(comment._id)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
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
          <div className="flex items-center gap-4 mt-2 text-xs">
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
                <Reply className="h-3 w-3 inline mr-1" />
                Reply
              </button>
            )}

            {comment.user._id === authUser?._id && (
              <>
                <button
                  onClick={() => handleEditComment(comment)}
                  className="text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Edit3 className="h-3 w-3 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3 inline mr-1" />
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => (
                <CommentItem key={reply._id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Comments ({postComments.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6">
          {postComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {postComments.map(comment => (
                <CommentItem key={comment._id} comment={comment} />
              ))}
              
              {hasMore && (
                <button
                  onClick={loadMoreComments}
                  className="w-full py-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Load more comments
                </button>
              )}
            </>
          )}
        </div>

        {/* Comment Form */}
        {authUser && (
          <div className="p-6 border-t">
            {replyingTo && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Replying to comment
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <form onSubmit={handleAddComment} className="flex gap-3">
              <img
                src={authUser.profilePic || '/default-avatar.png'}
                alt={authUser.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {newComment.length}/500
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || loadingStates.comment}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    {loadingStates.comment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {replyingTo ? 'Reply' : 'Comment'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {!authUser && (
          <div className="p-6 border-t text-center">
            <p className="text-gray-500 mb-4">Please login to leave a comment</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsModal;