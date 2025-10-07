import { useState, useRef } from 'react';
import { Sparkles, Loader2, X, Wand2, ChefHat, Flame, TrendingUp, DollarSign, Lightbulb, UtensilsCrossed } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import useNotification from '../hooks/useNotification';
import { convertUSDtoBDT } from '../lib/currency';



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
    <div className="glass-sidebar relative p-0 overflow-hidden glass-elev-2 group bg-gradient-to-br from-[#1d1038]/95 via-[#27134d]/92 to-[#120926]/95 border border-white/10 text-violet-50">
      {/* Header */}
      <div className="relative px-5 pt-6 pb-5 bg-gradient-to-br from-[#31145c]/95 via-[#43207a]/85 to-[#1e0d3a]/90">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/40 via-purple-500/25 to-transparent opacity-90 pointer-events-none mix-blend-screen" />
        <div className="flex items-center gap-3 relative">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-500 flex items-center justify-center shadow-[0_16px_36px_rgba(192,38,211,0.35)] ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white drop-shadow-[0_6px_14px_rgba(192,38,211,0.55)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white font-['Poppins'] tracking-wide flex items-center gap-2 drop-shadow-lg">
              AI Assistant
              <span className="text-[11px] uppercase tracking-[0.28em] px-2 py-0.5 rounded-full bg-white text-slate-900 font-bold shadow-sm">
                Beta
              </span>
            </h3>
            <p className="text-sm text-violet-50/90 mt-1 drop-shadow">Smart ingredient suggestion helper</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-5 bg-gradient-to-b from-[#1f0f40]/92 via-[#2d1458]/90 to-[#120825]/94">
        {/* Intro / Tip */}
        {!response && !loading && (
          <div className="glass-panel p-4 bg-[#231146]/85 border border-purple-400/25 shadow-[inset_0_2px_18px_rgba(51,17,97,0.65)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-[0_10px_24px_rgba(192,38,211,0.35)]">
                <Lightbulb className="w-4 h-4 text-white drop-shadow" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white drop-shadow">Cue the inspiration</h4>
                <p className="text-sm text-violet-50/90 leading-relaxed">
                  {formatHeroMessage(ingredientTokens)}
                </p>
                <ul className="text-[12px] text-violet-100/80 leading-relaxed list-disc list-inside space-y-0.5">
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
              className="glass-input !pr-10 !min-h-[90px] resize-none text-sm !bg-[#1b0f3a]/85 !border-fuchsia-400/35 !text-violet-50 placeholder:text-violet-200 placeholder:opacity-90 focus:!outline-none focus:!ring-2 focus:!ring-fuchsia-400/70 focus:!border-fuchsia-400/60"
            />
            {input && (
              <button
                onClick={clearAll}
                className="absolute top-2 right-2 text-violet-200/70 hover:text-white transition"
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
                <span key={tok} className="price-chip text-[10px] tracking-wide uppercase bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-100 shadow-sm">
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
              className="text-[11px] px-3 py-1.5 rounded-full bg-[#24104a]/75 border border-purple-400/40 text-purple-100 hover:bg-fuchsia-500/30 hover:border-fuchsia-400/60 hover:text-white transition flex items-center gap-1 shadow-sm shadow-fuchsia-500/25 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50 focus:ring-offset-1 focus:ring-offset-[#13092a]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-indigo-400" />
              {ing}
            </button>
          ))}
        </div>

        {/* Quick prompts */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-fuchsia-100/80 font-medium">Try prompts</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => handleQuickPrompt(p)}
                className="text-[11px] px-3.5 py-1.5 rounded-md bg-[#2a1253]/80 border border-fuchsia-400/45 text-fuchsia-100 hover:bg-fuchsia-500/30 hover:border-fuchsia-300/70 hover:text-white transition shadow-sm shadow-fuchsia-500/25 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50 focus:ring-offset-1 focus:ring-offset-[#13092a]"
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
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(168,85,247,0.45)] transition focus:outline-none focus:ring-2 focus:ring-fuchsia-300/80 focus:ring-offset-2 focus:ring-offset-[#120825] disabled:cursor-not-allowed disabled:opacity-60 group"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-40" />
            <span className="relative flex w-full items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 drop-shadow" />
                  Get Suggestions
                </>
              )}
            </span>
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
            <div className="relative px-5 py-4 bg-gradient-to-br from-fuchsia-500/28 via-purple-500/20 to-[#271355]/85 border-b border-white/10 shadow-[inset_0_2px_18px_rgba(168,85,247,0.28)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-[0_12px_26px_rgba(192,38,211,0.42)] ring-1 ring-white/20">
                  <Sparkles className="w-4 h-4 text-white drop-shadow" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-white mb-1 leading-tight drop-shadow">
                    {response.title}
                  </h4>
                  <p className="text-[11px] text-violet-100/85 flex items-center gap-2 flex-wrap">
                    Recipe plan summary
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wide shadow-sm ${response.fallback ? 'bg-amber-400/18 border-amber-300/55 text-amber-100' : 'bg-fuchsia-400/25 border-fuchsia-300/60 text-fuchsia-50'}`}>
                      {response.fallback ? 'Offline plan' : (response.provider?.model || 'Cohere')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {response.extras?.hero && (
              <div className="px-5 py-4 bg-[#221245]/82 border-b border-purple-400/25">
                <div className="flex items-start gap-3 text-violet-100/90 text-sm leading-relaxed">
                  <UtensilsCrossed className="w-4 h-4 mt-1 flex-shrink-0 text-fuchsia-200 drop-shadow" />
                  <p>{response.extras.hero}</p>
                </div>
              </div>
            )}

            {/* Recipe Ideas */}
            <div className="px-5 py-4 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-fuchsia-200 font-semibold flex items-center gap-2">
                <div className="w-4 h-[2px] bg-gradient-to-r from-fuchsia-400 to-transparent" />
                Recipe Ideas
              </div>
              
              <div className="space-y-2.5">
                {response.ideas.map((idea, index) => (
                  <div 
                    key={idea} 
                    className="group relative pl-7 pr-3 py-2.5 rounded-lg bg-[#221044]/82 hover:bg-[#2a1253]/85 border border-fuchsia-400/30 hover:border-fuchsia-300/55 transition-all duration-200 shadow-[0_10px_24px_rgba(192,38,211,0.24)]"
                  >
                    {/* Number Badge */}
                    <div className="absolute left-2 top-2.5 w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      {index + 1}
                    </div>
                    
                    {/* Recipe Text */}
                    <p className="text-sm text-violet-50 leading-relaxed font-medium">
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
                    <div className="text-[10px] uppercase tracking-wider text-fuchsia-200 font-semibold flex items-center gap-2">
                      <div className="w-4 h-[2px] bg-gradient-to-r from-fuchsia-400 to-transparent" />
                      Chef Tips
                    </div>
                    <ul className="space-y-1.5">
                      {response.extras.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-violet-50 leading-relaxed bg-[#221044]/82 border border-purple-400/45 rounded-md px-3 py-2 shadow-[0_8px_20px_rgba(167,139,250,0.28)]">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {response.extras?.pairings?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-fuchsia-200 font-semibold flex items-center gap-2">
                      <div className="w-4 h-[2px] bg-gradient-to-r from-fuchsia-400 to-transparent" />
                      Pairing Ideas
                    </div>
                    <ul className="space-y-1.5">
                      {response.extras.pairings.map((pairing, index) => (
                        <li key={index} className="text-xs text-violet-50 leading-relaxed bg-[#221044]/82 border border-fuchsia-400/40 rounded-md px-3 py-2 shadow-[0_8px_20px_rgba(236,72,153,0.25)]">
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
                <div className="text-[10px] uppercase tracking-wider text-fuchsia-200 font-semibold flex items-center gap-2 mb-3">
                  <div className="w-4 h-[2px] bg-gradient-to-r from-fuchsia-400 to-transparent" />
                  Quick Stats
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* First Stat - Calories for recipes, Time for DIY */}
                  {response.nutrition.estCalories ? (
                    <div className="glass-panel p-3 text-center bg-gradient-to-br from-fuchsia-500/25 via-[#291257]/85 to-transparent border-fuchsia-400/50 hover:scale-105 transition-transform">
                      <Flame className="w-4 h-4 text-fuchsia-200 mx-auto mb-1" />
                      <div className="text-base font-bold text-white">
                        {response.nutrition.estCalories}
                      </div>
                      <div className="text-[9px] text-violet-100/80 uppercase tracking-wide mt-0.5">
                        Calories
                      </div>
                    </div>
                  ) : response.nutrition.estTime ? (
                    <div className="glass-panel p-3 text-center bg-gradient-to-br from-fuchsia-500/25 via-[#291257]/85 to-transparent border-fuchsia-400/50 hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4 text-fuchsia-200 mx-auto mb-1" />
                      <div className="text-sm font-bold text-white capitalize leading-tight">
                        {response.nutrition.estTime}
                      </div>
                      <div className="text-[9px] text-violet-100/80 uppercase tracking-wide mt-0.5">
                        Time
                      </div>
                    </div>
                  ) : null}

                  {/* Difficulty */}
                  <div className="glass-panel p-3 text-center bg-gradient-to-br from-purple-500/25 via-[#291257]/85 to-transparent border-purple-400/50 hover:scale-105 transition-transform">
                    <ChefHat className="w-4 h-4 text-purple-200 mx-auto mb-1" />
                    <div className="text-sm font-bold text-white capitalize leading-tight">
                      {response.nutrition.difficulty}
                    </div>
                    <div className="text-[9px] text-violet-100/80 uppercase tracking-wide mt-0.5">
                      Level
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="glass-panel p-3 text-center bg-gradient-to-br from-indigo-500/25 via-[#291257]/85 to-transparent border-indigo-400/50 hover:scale-105 transition-transform">
                    <DollarSign className="w-4 h-4 text-indigo-200 mx-auto mb-1" />
                    <div className="text-base font-bold text-white">
                      ৳{convertUSDtoBDT(response.nutrition.estCost)}
                    </div>
                    <div className="text-[9px] text-violet-100/80 uppercase tracking-wide mt-0.5">
                      Cost (BDT)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="px-5 py-3 bg-[#1c0e3a]/85 border-t border-purple-400/25 flex items-center justify-between">
              <p className="text-[10px] text-violet-100/80">
                {response.fallback ? 'Generated with the offline recipe engine.' : `Powered by ${response.provider?.name === 'cohere' ? 'Cohere' : 'our AI service'}.`}
              </p>
              <button
                onClick={clearAll}
                className="text-[11px] px-3 py-1.5 rounded-md bg-[#28114e]/85 hover:bg-[#31145c]/90 text-violet-100 hover:text-white transition border border-purple-400/30 hover:border-fuchsia-400/40 shadow-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-purple-400/25 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-fuchsia-100/80 font-medium">Recent</div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar-thin">
              {history.map(item => (
                <button
                  key={item.ts}
                  onClick={() => { setInput(item.query); setResponse(item); }}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-md bg-[#221044]/82 hover:bg-[#2d1558]/85 text-violet-100/85 hover:text-white transition border border-purple-400/30 hover:border-fuchsia-400/45 shadow-sm"
                >
                  <div className="truncate font-medium text-violet-50 mb-0.5">{item.query}</div>
                  <div className="truncate text-[10px] text-violet-100/75">{item.title}</div>
                  {item.extras?.hero && (
                    <div className="truncate text-[9px] text-violet-100/65 mt-0.5">{item.extras.hero}</div>
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
