import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit3, Trash2, Send, Clock, ChefHat, Hammer, TrendingUp } from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const DraftsPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { drafts, getUserDrafts, deletePost, publishPost, isLoading, isUpdating } = usePostStore();

  useEffect(() => {
    if (authUser) {
      getUserDrafts();
    }
  }, [authUser, getUserDrafts]);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      try {
        await deletePost(postId);
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handlePublish = async (postId) => {
    if (window.confirm('Are you sure you want to publish this draft?')) {
      try {
        await publishPost(postId);
        toast.success('Draft published successfully!');
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!authUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen pt-40 pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero Section */}
        <div className="mb-10 glass-fade-in">
          <div className="glass-panel p-8 text-center relative overflow-hidden">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-['Poppins']">
              Draft <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">Workspace</span>
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg font-light">
              Continue refining your unpublished recipes & DIY projects. Publish when they're perfect.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
              <Link to="/create" className="btn-smart group">
                <Edit3 className="w-4 h-4 group-hover:rotate-3 transition-transform" />
                New Post
              </Link>
              {drafts.length > 0 && (
                <div className="flex gap-2 text-xs text-white/60">
                  <span className="px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/20 backdrop-blur-sm text-teal-200/80">Recipes: {drafts.filter(d=>d.type==='recipe').length}</span>
                  <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/20 backdrop-blur-sm text-violet-200/80">DIY: {drafts.filter(d=>d.type==='diy').length}</span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 backdrop-blur-sm text-blue-200/80">Total: {drafts.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-panel p-12 text-center">
            <div className="glass-loading mx-auto mb-6"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading drafts...</h3>
            <p className="text-white/70">Retrieving your saved work</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && drafts.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-teal-400 to-violet-400 rounded-3xl flex items-center justify-center">
              <Edit3 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-['Poppins']">No Drafts Yet</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Start crafting your first idea. Save drafts and polish them until they are ready to publish.
            </p>
            <Link to="/create" className="btn-smart btn-smart-lg group">
              <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Create Your First Post
            </Link>
          </div>
        )}

        {/* Drafts Grid */}
        {!isLoading && drafts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {drafts.map((draft, index) => {
              const progress = Math.min(
                ((draft.title ? 25 : 0) +
                  (draft.description ? 25 : 0) +
                  (draft.category ? 25 : 0) +
                  ((draft.type === 'recipe' ? draft.ingredients?.length : draft.materials?.length) > 0 ? 25 : 0)),
                100
              );
              return (
                <div
                  key={draft._id}
                  className="glass-post-card group overflow-hidden flex flex-col glass-fade-in"
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  {/* Image */}
                  <div className="glass-post-image h-48 relative">
                    {draft.images && draft.images.length > 0 ? (
                      <img
                        src={draft.images[0]}
                        alt={draft.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60">
                        {draft.type === 'recipe' ? (
                          <ChefHat className="w-16 h-16" />
                        ) : (
                          <Hammer className="w-16 h-16" />
                        )}
                      </div>
                    )}
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`glass-post-badge ${draft.type === 'recipe' ? 'glass-post-badge-recipe' : 'glass-post-badge-diy'}`}>
                        {draft.type === 'recipe' ? '🍳 Recipe' : '🎨 DIY'}
                      </span>
                    </div>
                    {/* Draft Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="glass-badge glass-badge-blue !text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Draft
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="glass-post-title text-xl mb-3 line-clamp-2 font-['Poppins']">{draft.title || 'Untitled Draft'}</h3>
                    <p className="text-sm text-white/70 mb-4 line-clamp-3 flex-1">{draft.description || 'No description yet...'}</p>
                    <div className="space-y-3 mb-5">
                      {draft.category && (
                        <div className="flex items-center text-xs text-white/60">
                          <span className="uppercase tracking-wide mr-2 text-white/40">Category</span>
                          <span className="glass-badge glass-badge-teal !py-1 !text-[10px]">{draft.category}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-white/60">
                        <Clock className="w-3 h-3 mr-1" />
                        Last edited: {formatDate(draft.updatedAt)}
                      </div>
                      {/* Progress */}
                      <div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-[10px] text-white/50 flex justify-between">
                          <span>{progress}% complete</span>
                          {progress < 100 && <span className="italic">Keep going</span>}
                        </div>
                      </div>
                      {draft.tags && draft.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {draft.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60 backdrop-blur-sm">{tag}</span>
                          ))}
                          {draft.tags.length > 3 && (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/40">+{draft.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/edit/${draft._id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-400/30 hover:border-blue-400/50 text-blue-100 hover:text-white text-sm font-semibold transition-all duration-300 group backdrop-blur-sm shadow-lg hover:shadow-blue-500/20"
                        >
                          <Edit3 className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-transform" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handlePublish(draft._id)}
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 border border-teal-400/30 hover:border-teal-400/50 text-teal-100 hover:text-white text-sm font-semibold transition-all duration-300 group backdrop-blur-sm shadow-lg hover:shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-teal-500/20 disabled:hover:to-emerald-500/20"
                          title="Publish Draft"
                        >
                          <Send className="w-4 h-4 group-hover:-rotate-12 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          <span>Publish</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(draft._id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/15 to-rose-500/15 hover:from-red-500/25 hover:to-rose-500/25 border border-red-400/25 hover:border-red-400/40 text-red-200/90 hover:text-red-100 text-sm font-medium transition-all duration-300 group backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/10"
                        title="Delete Draft"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Delete Draft</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Statistics */}
        {!isLoading && drafts.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp className="w-5 h-5 text-teal-300" />
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Draft Statistics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="text-sm uppercase tracking-wide text-white/50 mb-2">Recipe Drafts</div>
                <div className="text-3xl font-bold text-teal-300">{drafts.filter(d => d.type === 'recipe').length}</div>
              </div>
              <div className="glass-panel p-6 text-center">
                <div className="text-sm uppercase tracking-wide text-white/50 mb-2">DIY Drafts</div>
                <div className="text-3xl font-bold text-violet-300">{drafts.filter(d => d.type === 'diy').length}</div>
              </div>
              <div className="glass-panel p-6 text-center">
                <div className="text-sm uppercase tracking-wide text-white/50 mb-2">Total Drafts</div>
                <div className="text-3xl font-bold text-blue-300">{drafts.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftsPage;