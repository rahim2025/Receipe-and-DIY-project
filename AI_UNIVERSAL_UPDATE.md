# AI Assistant Universal Update

## Problem
When using the AI Assistant for DIY projects, it was showing recipe-specific information that confused users:
- Calories (nutrition per serving)
- Chef hat icon emphasis
- Cooking-related terminology

## Solution Implemented

### 1. Backend Changes (`backend/src/controllers/ai.controller.js`)

**Updated `getAISuggestions` function:**
- Now accepts `projectType` parameter (defaults to "recipe")
- Different system prompts for DIY vs Recipe contexts
- DIY responses return `estTime` instead of `estCalories` in the nutrition object

**Key change in response format:**
```javascript
// Recipe response
nutrition: {
  estCalories: 350,  // Number
  difficulty: "intermediate",
  estCost: "8.00"
}

// DIY response  
nutrition: {
  estTime: "1-2 hours",  // String
  difficulty: "beginner",
  estCost: "6.00"
}
```

### 2. Frontend Changes (`frontend/src/components/AIAssistant.jsx`)

**Updated Stats Display:**
- Conditionally renders based on which field exists in `response.nutrition`
- If `estCalories` exists → Shows Calories with Flame icon (Recipe mode)
- If `estTime` exists → Shows Time with TrendingUp icon (DIY mode)
- Difficulty and Cost always shown (universal for both types)

**Code snippet:**
```jsx
{response.nutrition.estCalories ? (
  <div className="glass-panel p-3 text-center">
    <Flame className="w-4 h-4 text-teal-300 mx-auto mb-1" />
    <div className="text-base font-bold text-white">
      {response.nutrition.estCalories}
    </div>
    <div className="text-[9px] text-white/60 uppercase">Calories</div>
  </div>
) : response.nutrition.estTime ? (
  <div className="glass-panel p-3 text-center">
    <TrendingUp className="w-4 h-4 text-teal-300 mx-auto mb-1" />
    <div className="text-sm font-bold text-white">
      {response.nutrition.estTime}
    </div>
    <div className="text-[9px] text-white/60 uppercase">Time</div>
  </div>
) : null}
```

## Usage

### For Recipe Posts
Send API request with:
```javascript
{
  ingredients: ['chicken', 'tomato', 'basil'],
  prompt: 'healthy dinner',
  context: 'recipe_suggestions',
  projectType: 'recipe'  // or omit (defaults to recipe)
}
```

### For DIY Posts  
Send API request with:
```javascript
{
  ingredients: ['wood', 'paint', 'nails'],
  prompt: 'home decoration',
  context: 'diy_suggestions',
  projectType: 'diy'  // Important!
}
```

## Benefits

✅ **No Confusion**: Users won't see calorie information for DIY projects
✅ **Context-Aware**: Shows time estimates for projects, calories for recipes
✅ **Backward Compatible**: Existing recipe functionality unchanged
✅ **Flexible**: Same component works for both use cases
✅ **Clean UI**: Appropriate icons and labels for each mode

## Testing

1. Test Recipe Mode: Use AI with ingredients → Should show Calories
2. Test DIY Mode: Use AI with materials and `projectType: 'diy'` → Should show Time instead
3. Verify both modes show Difficulty and Cost correctly

## Future Enhancements

- Add projectType prop to AIAssistant component for explicit mode control
- Add visual indicators (different colors/icons) to distinguish Recipe vs DIY mode
- Create separate quick-add buttons for materials vs ingredients
- Add DIY-specific prompts ("home decoration", "craft project", etc.)
