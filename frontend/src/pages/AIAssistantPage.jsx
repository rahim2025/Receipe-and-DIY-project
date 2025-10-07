import { useState, useRef } from 'react';
import { Sparkles, Loader2, X, Wand2, ChefHat, Flame, DollarSign, Lightbulb, UtensilsCrossed, ArrowLeft, BookOpen, Clock, Users, Info, ShoppingCart, AlertCircle } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import useNotification from '../hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import { convertUSDtoBDT } from '../lib/currency';

const QUICK_INGREDIENTS = ['tomato', 'chicken', 'cheese', 'basil', 'garlic', 'onion', 'flour', 'eggs', 'pasta', 'rice', 'beans', 'yogurt'];
const QUICK_PROMPTS = [
  'healthy high-protein dinner',
  'quick vegan lunch',
  '30 min dessert',
  'budget-friendly family meal',
  'sheet-pan dinner for 4',
  'meal prep ideas',
];

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [history, setHistory] = useState([]);
  const timeoutRef = useRef();
  const { authUser } = useAuthStore();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const ingredientTokens = input
    .split(/[,\n]/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  const handleAddIngredient = (ing) => {
    if (!input.toLowerCase().includes(ing)) {
      setInput(prev => prev + (prev && !prev.endsWith(',') ? ', ' : '') + ing);
    }
  };

  const handleGenerate = async () => {
    if (loading) return;
    
    if (!authUser) {
      showNotification('Please log in to use AI assistance', 'error');
      navigate('/login');
      return;
    }

    if (!input.trim()) {
      showNotification('Please enter ingredients or a prompt', 'error');
      return;
    }

    setLoading(true);
    setResponse(null);
    timeoutRef.current && clearTimeout(timeoutRef.current);

    try {
      const { data } = await axiosInstance.post('/api/ai/suggestions', {
        ingredients: ingredientTokens.length > 0 ? ingredientTokens : input,
        prompt: input,
        context: 'recipe_suggestions'
      });

      if (data.success) {
        const suggestion = {
          ...data.data,
          provider: data.provider || (data.fallback ? { name: 'offline' } : { name: 'cohere' }),
          fallback: Boolean(data.fallback),
        };
        setResponse(suggestion);
        setHistory(prev => [
          { query: input || '(empty)', ...suggestion, ts: Date.now() }, 
          ...prev.slice(0, 9)
        ]);
        showNotification('Recipe suggestions generated!', 'success');
      } else {
        throw new Error(data.message || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get AI suggestions';
      showNotification(errorMessage, 'error');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = async (recipeIdea) => {
    if (loadingDetail) return;

    setLoadingDetail(true);
    setSelectedRecipe(null);

    try {
      // Use longer timeout for recipe detail (30 seconds)
      const { data } = await axiosInstance.post('/api/ai/recipe-detail', 
        {
          recipeIdea,
          ingredients: ingredientTokens.length > 0 ? ingredientTokens.join(', ') : input,
        },
        {
          timeout: 30000 // 30 second timeout for detailed recipe generation
        }
      );

      if (data.success) {
        setSelectedRecipe(data.data);
        showNotification('Recipe details loaded!', 'success');
      } else {
        throw new Error(data.message || 'Failed to get recipe details');
      }
    } catch (error) {
      console.error('Recipe detail error:', error);
      let errorMessage = 'Failed to get recipe details';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Trying again may help, or check your connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
      
      // Optionally show fallback recipe on timeout
      if (error.code === 'ECONNABORTED') {
        console.log('Timeout occurred - you may want to try again or use a simpler recipe idea');
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  const clearAll = () => {
    setInput('');
    setResponse(null);
    setSelectedRecipe(null);
  };

  const handleHistoryClick = (item) => {
    setInput(item.query);
    setResponse(item);
    setSelectedRecipe(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSuggestions = () => {
    setSelectedRecipe(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pt-40 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Inspiration Hub
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI Ready
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-blue-400/30 blur-lg opacity-30" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-['Poppins'] tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                AI Recipe & DIY Assistant
              </h1>
              <p className="text-sm sm:text-base text-white mt-3 max-w-2xl font-medium" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
                Explore a world of culinary delights and creative DIY projects. Transform your ingredients into delicious meals with Cora's AI-powered assistance.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white font-semibold uppercase tracking-widest" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  Recipes & Crafts
                </span>
                <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/40 text-xs text-white font-semibold uppercase tracking-widest" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  Powered by Cora
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-white">
                <UtensilsCrossed className="w-5 h-5 text-cyan-300" />
                <span className="text-sm font-bold uppercase tracking-widest text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Prompt Builder</span>
              </div>
              {input && (
                <button
                  onClick={clearAll}
                  className="text-xs sm:text-sm text-white hover:text-white transition inline-flex items-center gap-1 font-semibold"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>

            <div>
              <div className="relative">
                <textarea
                  rows={5}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleGenerate();
                    }
                  }}
                  placeholder="List ingredients: chicken, tomato, basil, garlic\nAdd DIY materials: wood, paint, fabric, glue\nOr describe the vibe: cozy rainy-day soup or rustic wall art"
                  className="glass-input !min-h-[140px] text-base leading-relaxed"
                />
                <div className="absolute right-3 bottom-3 text-[10px] uppercase tracking-[0.3em] text-white/25">Ctrl + Enter</div>
              </div>

              {ingredientTokens.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs uppercase tracking-wider text-white font-bold mr-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Detected:</span>
                  {ingredientTokens.map(tok => (
                    <span
                      key={tok}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50 text-xs font-bold text-white shadow-sm"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                    >
                      {tok}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-white font-bold mb-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Quick ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {QUICK_INGREDIENTS.map(ing => (
                    <button
                      key={ing}
                      onClick={() => handleAddIngredient(ing)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-blue-400/60 text-sm text-white hover:text-white transition-all hover:-translate-y-[1px] font-semibold"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                    >
                      {ing}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-white font-bold mb-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Try these prompts</h3>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => handleQuickPrompt(p)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/40 hover:border-cyan-400/60 text-sm text-white hover:text-white transition-all hover:-translate-y-[1px] font-semibold"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-400 hover:via-cyan-400 hover:to-blue-400 text-white text-base sm:text-lg font-bold transition-all duration-300 shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:shadow-[0_0_50px_rgba(20,184,166,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none overflow-hidden"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin relative z-10" />
                    <span className="relative z-10">Cora is thinking...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 group-hover:scale-110 transition-transform relative z-10" />
                    <span className="relative z-10">Generate Ideas with AI</span>
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform relative z-10" />
                  </>
                )}
              </button>
              <p className="text-xs text-white font-semibold text-center mt-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                Cora blends culinary and DIY knowledge to match the rest of the experience.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="glass-panel p-8">
            <div className="space-y-6 animate-pulse">
              <div className="h-6 w-1/2 bg-white/10 rounded" />
              <div className="space-y-3">
                <div className="h-4 w-5/6 bg-white/10 rounded" />
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
              <div className="flex gap-4">
                <div className="h-20 w-1/3 bg-white/10 rounded" />
                <div className="h-20 w-1/3 bg-white/10 rounded" />
                <div className="h-20 w-1/3 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Recipe Detail Loading */}
        {loadingDetail && (
          <div className="glass-panel p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-teal-400 animate-spin"></div>
                <ChefHat className="w-10 h-10 text-teal-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-center text-white/90 mt-6 text-lg font-medium">Generating your recipe...</p>
              <p className="text-center text-white/50 mt-2 text-sm">This may take 10-20 seconds</p>
            </div>
            <div className="space-y-6 animate-pulse mt-8">
              <div className="h-8 w-2/3 bg-white/10 rounded mx-auto" />
              <div className="h-4 w-full bg-white/10 rounded" />
              <div className="h-4 w-5/6 bg-white/10 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-3">
                  <div className="h-4 w-1/4 bg-white/10 rounded" />
                  <div className="h-20 bg-white/10 rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-1/4 bg-white/10 rounded" />
                  <div className="h-40 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Detail View */}
        {selectedRecipe && !loadingDetail && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={handleBackToSuggestions}
              className="flex items-center gap-2 text-white/60 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to suggestions</span>
            </button>

            {/* Recipe Header */}
            <div className="glass-panel p-0 overflow-hidden">
              <div className="relative px-6 py-6 bg-gradient-to-br from-teal-500/20 via-violet-500/15 to-pink-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <ChefHat className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {selectedRecipe.title}
                    </h1>
                    <p className="text-base text-white leading-relaxed font-medium" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
                      {selectedRecipe.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-white/5 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-teal-300" />
                  <div>
                    <div className="text-xs text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Total Time</div>
                    <div className="text-sm font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{selectedRecipe.totalTime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-violet-300" />
                  <div>
                    <div className="text-xs text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Servings</div>
                    <div className="text-sm font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{selectedRecipe.servings}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5 text-blue-300" />
                  <div>
                    <div className="text-xs text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Difficulty</div>
                    <div className="text-sm font-bold text-white capitalize" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{selectedRecipe.difficulty}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <div>
                    <div className="text-xs text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Calories</div>
                    <div className="text-sm font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{selectedRecipe.nutrition.calories}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ingredients Column */}
              <div className="lg:col-span-1">
                <div className="glass-panel p-6 sticky top-24">
                  <div className="flex items-center gap-3 mb-4">
                    <ShoppingCart className="w-6 h-6 text-teal-300" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Ingredients</h2>
                  </div>
                  <ul className="space-y-3">
                    {selectedRecipe.ingredients.map((ing, index) => (
                      <li key={index} className="flex gap-3 items-start text-white">
                        <span className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0"></span>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                            <span className="font-bold text-white">{ing.amount}</span>
                            <span>{ing.item}</span>
                          </div>
                          {ing.notes && (
                            <div className="text-xs text-white font-medium mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{ing.notes}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Nutrition Details */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm uppercase tracking-wider text-white font-bold mb-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Nutrition (per serving)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-sm text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Protein</div>
                        <div className="text-lg font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{selectedRecipe.nutrition.protein}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-sm text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Carbs</div>
                        <div className="text-lg font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{selectedRecipe.nutrition.carbs}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-sm text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Fat</div>
                        <div className="text-lg font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{selectedRecipe.nutrition.fat}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/5">
                        <div className="text-sm text-white font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Calories</div>
                        <div className="text-lg font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{selectedRecipe.nutrition.calories}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step-by-Step Instructions */}
                <div className="glass-panel p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <BookOpen className="w-6 h-6 text-violet-300" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Instructions</h2>
                  </div>
                  <div className="space-y-5">
                    {selectedRecipe.instructions.map((inst, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-lg font-bold text-white shadow-md">
                          {inst.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-base text-white leading-relaxed mb-2 font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                            {inst.instruction}
                          </p>
                          {inst.tips && (
                            <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-violet-500/10 border border-violet-400/20">
                              <Lightbulb className="w-4 h-4 text-violet-300 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-white italic font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{inst.tips}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips Section */}
                {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                  <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-6 h-6 text-yellow-300" />
                      <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Chef Tips</h2>
                    </div>
                    <ul className="space-y-3">
                      {selectedRecipe.tips.map((tip, index) => (
                        <li key={index} className="flex gap-3 items-start text-white">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0"></span>
                          <span className="text-base leading-relaxed font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Variations Section */}
                {selectedRecipe.variations && selectedRecipe.variations.length > 0 && (
                  <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Wand2 className="w-6 h-6 text-pink-300" />
                      <h2 className="text-xl font-bold text-white uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Variations</h2>
                    </div>
                    <ul className="space-y-3">
                      {selectedRecipe.variations.map((variation, index) => (
                        <li key={index} className="flex gap-3 items-start text-white">
                          <span className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0"></span>
                          <span className="text-base leading-relaxed font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{variation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Storage Info */}
                {selectedRecipe.storage && (
                  <div className="glass-panel p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-400/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm uppercase tracking-wider text-blue-200 font-bold mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Storage</h3>
                        <p className="text-base text-white leading-relaxed font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{selectedRecipe.storage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Response Section */}
        {response && !loading && !selectedRecipe && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="glass-panel p-0 overflow-hidden">
              <div className="relative px-6 py-5 bg-gradient-to-br from-teal-500/20 via-violet-500/15 to-pink-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2 leading-tight">
                      {response.title}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-white/70">Recipe plan summary</span>
                      <span className={`px-2.5 py-1 rounded-full border text-xs uppercase tracking-wide ${response.fallback ? 'bg-amber-500/10 border-amber-400/40 text-amber-200' : 'bg-teal-500/10 border-teal-400/40 text-teal-100'}`}>
                        {response.fallback ? 'Offline plan' : (response.provider?.model || 'Cohere')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {response.extras?.hero && (
                <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                  <div className="flex items-start gap-3 text-white/90 text-base leading-relaxed">
                    <UtensilsCrossed className="w-5 h-5 mt-1 flex-shrink-0 text-teal-300" />
                    <p>{response.extras.hero}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recipe Ideas Grid */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-[3px] bg-gradient-to-r from-teal-400 to-transparent rounded" />
                <h3 className="text-lg uppercase tracking-wider text-teal-200 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Ideas</h3>
              </div>
              <p className="text-sm text-white font-semibold mb-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Click any recipe to see full instructions and ingredients</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.ideas.map((idea, index) => (
                  <button 
                    key={index} 
                    onClick={() => handleRecipeClick(idea)}
                    disabled={loadingDetail}
                    className="glass-panel p-5 hover:scale-[1.02] hover:border-teal-400/50 transition-all duration-200 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center flex-shrink-0 text-lg font-bold text-white shadow-md group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-base text-white leading-relaxed font-semibold group-hover:text-white transition-colors" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
                          {idea}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-teal-200 font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                          <BookOpen className="w-3 h-3" />
                          <span>View full recipe</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nutrition Info */}
            {response.nutrition && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-[3px] bg-gradient-to-r from-violet-400 to-transparent rounded" />
                  <h3 className="text-lg uppercase tracking-wider text-violet-200 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Quick Stats</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    

                  <div className="glass-panel p-6 text-center bg-gradient-to-br from-violet-500/10 to-transparent border-violet-400/30">
                    <ChefHat className="w-8 h-8 text-violet-300 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-white capitalize" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {response.nutrition.difficulty}
                    </div>
                    <div className="text-sm text-white font-bold uppercase tracking-wide mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                      Level
                    </div>
                  </div>

                  <div className="glass-panel p-6 text-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-400/30">
                    <DollarSign className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      ৳{convertUSDtoBDT(response.nutrition.estCost)}
                    </div>
                    <div className="text-sm text-white font-bold uppercase tracking-wide mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                      Estimated Cost (BDT)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips and Pairings */}
            {(response.extras?.tips?.length || response.extras?.pairings?.length) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {response.extras?.tips?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-[3px] bg-gradient-to-r from-violet-400 to-transparent rounded" />
                      <h3 className="text-lg uppercase tracking-wider text-violet-200 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Tips</h3>
                    </div>
                    <div className="space-y-3">
                      {response.extras.tips.map((tip, index) => (
                        <div key={index} className="glass-panel p-4 flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-violet-300 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-white font-medium leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.extras?.pairings?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-[3px] bg-gradient-to-r from-teal-400 to-transparent rounded" />
                      <h3 className="text-lg uppercase tracking-wider text-teal-200 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Pairing Ideas</h3>
                    </div>
                    <div className="space-y-3">
                      {response.extras.pairings.map((pairing, index) => (
                        <div key={index} className="glass-panel p-4 flex items-start gap-3">
                          <BookOpen className="w-5 h-5 text-teal-300 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-white font-medium leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{pairing}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="glass-panel p-4 flex items-center justify-between">
              <p className="text-sm text-white font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                {response.fallback ? 'Generated with the offline recipe engine.' : `Powered by ${response.provider?.name === 'cohere' ? 'Cohere' : 'our AI service'}.`}
              </p>
              <button
                onClick={clearAll}
                className="glass-btn text-sm font-semibold"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
              >
                Generate New Ideas
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && !loading && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] bg-gradient-to-r from-pink-400 to-transparent rounded" />
              <h3 className="text-lg uppercase tracking-wider text-pink-200 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Recent Searches</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(item => (
                <button
                  key={item.ts}
                  onClick={() => handleHistoryClick(item)}
                  className="glass-panel p-4 text-left hover:scale-[1.02] transition-transform"
                >
                  <div className="font-bold text-white mb-1 truncate" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{item.query}</div>
                  <div className="text-sm text-white font-semibold truncate" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{item.title}</div>
                  {item.extras?.hero && (
                    <div className="text-xs text-white font-medium mt-2 line-clamp-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{item.extras.hero}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
