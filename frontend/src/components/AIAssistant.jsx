import { useState, useRef } from 'react';
import { Sparkles, Loader2, X, ArrowRight, Wand2 } from 'lucide-react';

/*
  AIAssistant Component
  - Local UX-only simulation (no backend request yet)
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

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const timeoutRef = useRef();

  const ingredientTokens = input
    .split(/[,\n]/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  const handleAddIngredient = (ing) => {
    if (!input.toLowerCase().includes(ing)) {
      setInput(prev => prev + (prev && !prev.endsWith(',') ? ', ' : '') + ing);
    }
  };

  const buildMockSuggestion = () => {
    if (ingredientTokens.length === 0) {
      return {
        title: 'Try adding a few ingredients',
        ideas: [
          'Add ingredients like: tomato, chicken, basil',
          'Or pick a quick prompt below',
          'The more specific you are, the better the suggestions'
        ],
        nutrition: null
      };
    }

    const core = ingredientTokens.slice(0, 3).join(', ');
    return {
      title: `Ideas with ${core}`,
      ideas: [
        `${core} fusion bowl with light herb dressing`,
        `${ingredientTokens[0]} & ${ingredientTokens[1] || 'herb'} skillet (under 30 min)`,
        `${ingredientTokens[0]} stuffed ${ingredientTokens[2] || 'veggies'} bake`,
        `Simple rustic ${ingredientTokens[0]} ${ingredientTokens[1] || ''} soup`
      ].filter(Boolean),
      nutrition: {
        estCalories: 350 + ingredientTokens.length * 25,
        difficulty: ingredientTokens.length < 3 ? 'beginner' : 'intermediate',
        estCost: (ingredientTokens.length * 2.5).toFixed(2)
      }
    };
  };

  const handleGenerate = () => {
    if (loading) return;
    setLoading(true);
    setResponse(null);
    timeoutRef.current && clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const suggestion = buildMockSuggestion();
      setResponse(suggestion);
      setHistory(prev => [{ query: input || '(empty)', ...suggestion, ts: Date.now() }, ...prev.slice(0, 4)]);
      setLoading(false);
    }, 900 + Math.random() * 600);
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
          <div className="glass-panel p-4 text-xs text-white/70 leading-relaxed bg-gradient-to-br from-white/5 to-transparent">
            Type ingredients you have (comma separated) or tap quick chips. We generate creative idea starters locally.
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
          <div className="glass-panel p-5 space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 via-violet-500/5 to-transparent pointer-events-none" />
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-300" />
              {response.title}
            </h4>
            <ul className="space-y-2 relative z-10">
              {response.ideas.map(idea => (
                <li key={idea} className="text-xs text-white/80 flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-teal-300" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
            {response.nutrition && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="glass-badge glass-badge-teal text-[10px]">~{response.nutrition.estCalories} cal</span>
                <span className="glass-badge glass-badge-violet text-[10px] capitalize">{response.nutrition.difficulty}</span>
                <span className="glass-badge glass-badge-blue text-[10px]">${response.nutrition.estCost}</span>
              </div>
            )}
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
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
