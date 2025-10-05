import { useState, useRef } from 'react';
import { Sparkles, Loader2, X, ArrowRight, Wand2, ChefHat, Flame, TrendingUp, DollarSign, Lightbulb, UtensilsCrossed } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import useNotification from '../hooks/useNotification';

/*
  AIAssistant Component
  - AI-powered recipe suggestions via backend API
  - Enhances design with: gradient header, quick ingredient chips, prompt suggestions, animated loading, response panel
  - Exposes a clean glass aesthetic consistent with the design system
*/

const QUICK_INGREDIENTS = ['tomato', 'chicken', 'cheese', 'basil', 'garlic', 'onion', 'flour', 'eggs'];
const QUICK_PROMPTS = [
  'healthy high-protein dinner',
  'quick vegan lunch',
  '30 min dessert',
  'budget-friendly family meal'
];
const formatHeroMessage = (tokens) => {
  if (!tokens.length) {
    return 'Add at least three ingredients—or describe the meal you want—and Cora will build a full recipe plan.';
  }

  const primary = tokens[0];
  const secondary = tokens[1];
  const tertiary = tokens[2];

  if (tokens.length === 1) {
    return `Give Cora a vegetable and one flavor boost so she can turn ${primary} into a balanced plate.`;
  }

  const dynamicPair = tertiary ? `${secondary} and ${tertiary}` : secondary;
  return `Cora will combine ${primary} with ${dynamicPair} and suggest sides that keep textures and flavors balanced.`;
};

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const timeoutRef = useRef();
  const { authUser } = useAuthStore();
  const { showNotification } = useNotification();

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
    
    // Check if user is authenticated
    if (!authUser) {
      showNotification('Please log in to use AI assistance', 'error');
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
      // Call the backend API
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
          ...prev.slice(0, 4)
        ]);
        showNotification('AI suggestions generated successfully!', 'success');
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

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    setTimeout(handleGenerate, 50); // auto-generate after brief delay
  };

  const clearAll = () => {
    setInput('');
    setResponse(null);
  };

  return (
    <div className="glass-sidebar p-0 overflow-hidden glass-elev-2 group">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-violet-500/10 to-transparent opacity-60 pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 via-violet-500 to-pink-500 flex items-center justify-center shadow-inner shadow-teal-500/30">
            <Sparkles className="w-5 h-5 text-white drop-shadow" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white font-['Poppins'] tracking-wide flex items-center gap-2">
              AI Assistant
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10">Beta</span>
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Smart ingredient suggestion helper</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-5">
        {/* Intro / Tip */}
        {!response && !loading && (
          <div className="glass-panel p-4 bg-gradient-to-br from-white/5 via-transparent to-white/0 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Cue the inspiration</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  {formatHeroMessage(ingredientTokens)}
                </p>
                <ul className="text-[11px] text-white/60 leading-relaxed list-disc list-inside space-y-0.5">
                  <li>Use the ingredient chips to build a quick grocery list.</li>
                  <li>Prompts like “cozy rainy-day stew” can replace ingredient lists.</li>
                  <li>Cora always returns cooking tips, serving ideas, and suggested sides.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. chicken, tomato, basil, garlic"
              className="glass-input !pr-10 !min-h-[90px] resize-none text-sm"
            />
            {input && (
              <button
                onClick={clearAll}
                className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition"
                aria-label="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Ingredient tokens preview */}
          {ingredientTokens.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ingredientTokens.map(tok => (
                <span key={tok} className="price-chip text-[10px] tracking-wide uppercase bg-white/5 border-white/10 text-white/70">
                  {tok}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick ingredient chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_INGREDIENTS.map(ing => (
            <button
              key={ing}
              onClick={() => handleAddIngredient(ing)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-teal-400 to-violet-400" />
              {ing}
            </button>
          ))}
        </div>

        {/* Quick prompts */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Try prompts</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => handleQuickPrompt(p)}
                className="text-[11px] px-3 py-1 rounded-md bg-gradient-to-br from-teal-500/20 to-violet-500/10 border border-white/10 hover:border-teal-400/40 hover:from-teal-500/30 hover:to-violet-500/20 text-white/70 hover:text-white transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div>
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full glass-btn-primary justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Get Suggestions
              </>
            )}
          </button>
        </div>

        {/* Response */}
        {loading && (
          <div className="glass-panel p-5 space-y-4 animate-pulse">
            <div className="h-4 w-1/2 bg-white/10 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-5/6 bg-white/10 rounded" />
              <div className="h-3 w-2/3 bg-white/10 rounded" />
              <div className="h-3 w-3/4 bg-white/10 rounded" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-6 w-20 bg-white/10 rounded" />
              <div className="h-6 w-16 bg-white/10 rounded" />
              <div className="h-6 w-14 bg-white/10 rounded" />
            </div>
          </div>
        )}

        {response && !loading && (
          <div className="glass-panel p-0 space-y-0 relative overflow-hidden">
            {/* Response Header */}
            <div className="relative px-5 py-4 bg-gradient-to-br from-teal-500/20 via-violet-500/15 to-pink-500/10 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white mb-1 leading-tight">
                    {response.title}
                  </h4>
                  <p className="text-[11px] text-white/60 flex items-center gap-2 flex-wrap">
                    Recipe plan summary
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wide ${response.fallback ? 'bg-amber-500/10 border-amber-400/40 text-amber-200/80' : 'bg-teal-500/10 border-teal-400/40 text-teal-100/80'}`}>
                      {response.fallback ? 'Offline plan' : (response.provider?.model || 'Cohere')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {response.extras?.hero && (
              <div className="px-5 py-4 bg-white/4 border-b border-white/5">
                <div className="flex items-start gap-3 text-white/80 text-sm leading-relaxed">
                  <UtensilsCrossed className="w-4 h-4 mt-1 flex-shrink-0 text-teal-200" />
                  <p>{response.extras.hero}</p>
                </div>
              </div>
            )}

            {/* Recipe Ideas */}
            <div className="px-5 py-4 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold flex items-center gap-2">
                <div className="w-4 h-[2px] bg-gradient-to-r from-teal-400 to-transparent" />
                Recipe Ideas
              </div>
              
              <div className="space-y-2.5">
                {response.ideas.map((idea, index) => (
                  <div 
                    key={idea} 
                    className="group relative pl-7 pr-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-teal-400/30 transition-all duration-200"
                  >
                    {/* Number Badge */}
                    <div className="absolute left-2 top-2.5 w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      {index + 1}
                    </div>
                    
                    {/* Recipe Text */}
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                      {idea}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {(response.extras?.tips?.length || response.extras?.pairings?.length) && (
              <div className="px-5 pb-4 space-y-4">
                {response.extras?.tips?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold flex items-center gap-2">
                      <div className="w-4 h-[2px] bg-gradient-to-r from-violet-400 to-transparent" />
                      Chef Tips
                    </div>
                    <ul className="space-y-1.5">
                      {response.extras.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-white/80 leading-relaxed bg-white/5 border border-white/10 rounded-md px-3 py-2">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {response.extras?.pairings?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold flex items-center gap-2">
                      <div className="w-4 h-[2px] bg-gradient-to-r from-teal-400 to-transparent" />
                      Pairing Ideas
                    </div>
                    <ul className="space-y-1.5">
                      {response.extras.pairings.map((pairing, index) => (
                        <li key={index} className="text-xs text-white/80 leading-relaxed bg-white/5 border border-white/10 rounded-md px-3 py-2">
                          {pairing}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Stats Info - Conditional based on project type */}
            {response.nutrition && (
              <div className="px-5 pb-4">
                <div className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold flex items-center gap-2 mb-3">
                  <div className="w-4 h-[2px] bg-gradient-to-r from-violet-400 to-transparent" />
                  Quick Stats
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* First Stat - Calories for recipes, Time for DIY */}
                  {response.nutrition.estCalories ? (
                    <div className="glass-panel p-3 text-center bg-gradient-to-br from-teal-500/10 to-transparent border-teal-400/20 hover:scale-105 transition-transform">
                      <Flame className="w-4 h-4 text-teal-300 mx-auto mb-1" />
                      <div className="text-base font-bold text-white">
                        {response.nutrition.estCalories}
                      </div>
                      <div className="text-[9px] text-white/60 uppercase tracking-wide mt-0.5">
                        Calories
                      </div>
                    </div>
                  ) : response.nutrition.estTime ? (
                    <div className="glass-panel p-3 text-center bg-gradient-to-br from-teal-500/10 to-transparent border-teal-400/20 hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4 text-teal-300 mx-auto mb-1" />
                      <div className="text-sm font-bold text-white capitalize leading-tight">
                        {response.nutrition.estTime}
                      </div>
                      <div className="text-[9px] text-white/60 uppercase tracking-wide mt-0.5">
                        Time
                      </div>
                    </div>
                  ) : null}

                  {/* Difficulty */}
                  <div className="glass-panel p-3 text-center bg-gradient-to-br from-violet-500/10 to-transparent border-violet-400/20 hover:scale-105 transition-transform">
                    <ChefHat className="w-4 h-4 text-violet-300 mx-auto mb-1" />
                    <div className="text-sm font-bold text-white capitalize leading-tight">
                      {response.nutrition.difficulty}
                    </div>
                    <div className="text-[9px] text-white/60 uppercase tracking-wide mt-0.5">
                      Level
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="glass-panel p-3 text-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-400/20 hover:scale-105 transition-transform">
                    <DollarSign className="w-4 h-4 text-blue-300 mx-auto mb-1" />
                    <div className="text-base font-bold text-white">
                      ${response.nutrition.estCost}
                    </div>
                    <div className="text-[9px] text-white/60 uppercase tracking-wide mt-0.5">
                      Cost
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-white/40">
                {response.fallback ? 'Generated with the offline recipe engine.' : `Powered by ${response.provider?.name === 'cohere' ? 'Cohere' : 'our AI service'}.`}
              </p>
              <button
                onClick={clearAll}
                className="text-[11px] px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition border border-white/10 hover:border-white/20"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Recent</div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar-thin">
              {history.map(item => (
                <button
                  key={item.ts}
                  onClick={() => { setInput(item.query); setResponse(item); }}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition border border-white/5 hover:border-white/15"
                >
                  <div className="truncate font-medium text-white/70 mb-0.5">{item.query}</div>
                  <div className="truncate text-[10px] text-white/40">{item.title}</div>
                  {item.extras?.hero && (
                    <div className="truncate text-[9px] text-white/30 mt-0.5">{item.extras.hero}</div>
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
