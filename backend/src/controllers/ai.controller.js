import {
	callCohereChat,
	extractCohereText,
	getDefaultCohereModel,
	hasCohereCredentials,
} from "../lib/cohere.js";

const MAX_IDEAS = 4;

const joinWithAnd = (items = []) => {
	const clean = items.filter(Boolean);
	if (clean.length === 0) return "";
	if (clean.length === 1) return clean[0];
	return `${clean.slice(0, -1).join(", ")} and ${clean.at(-1)}`;
};

const toTitle = (value, fallback = "") => {
	const str = (value || fallback || "").toString().trim();
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
};

const seededPick = (list, seed = 0) => {
	if (!Array.isArray(list) || list.length === 0) return "";
	const index = Math.abs(seed) % list.length;
	return list[index];
};

const normalizeArray = (value) => {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === "string") {
		return value
			.split(/[\n,]+/)
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [];
};

const normalizeIngredients = (ingredients, fallbackPrompt = "") => {
	const items = normalizeArray(ingredients).concat(normalizeArray(fallbackPrompt));
	const tokens = items
		.map((item) => item.toLowerCase())
		.map((item) => item.replace(/[^a-z0-9\s-]/gi, ""))
		.map((item) => item.trim())
		.filter(Boolean);

	return Array.from(new Set(tokens));
};

const clampNumber = (value, { min, max, fallback }) => {
	const num = Number.parseFloat(value);
	if (Number.isFinite(num)) {
		return Math.min(Math.max(num, min), max);
	}
	return fallback;
};

const formatCost = (value, fallback = "6.50") => {
	const num = Number.parseFloat(value);
	if (Number.isFinite(num)) {
		return num.toFixed(2);
	}
	return fallback;
};

const buildFallbackSuggestion = (tokens, prompt = "") => {
	const seed = tokens.join("").length || prompt.length || Date.now();
	if (!tokens.length) {
		const pantryCombos = [
			"canned beans, garlic, lemon",
			"frozen berries, yogurt, oats",
			"rice noodles, peanut butter, chili crisp",
			"lentils, coconut milk, curry powder",
			"sweet potatoes, black beans, smoked paprika",
		];

		const ideaSeed = seededPick(pantryCombos, seed).split(",").map((item) => item.trim());
		const [primary, secondary, tertiary] = ideaSeed;

		return {
			title: "Share three ingredients to unlock tailored recipes",
			ideas: [
				`Try a quick ${toTitle(primary, "protein")} sauté with ${secondary || "aromatics"} and finish with ${tertiary || "fresh herbs"}.`,
				`Blend a simple ${toTitle(secondary, "vegetable")} soup and top with toasted nuts or seeds for crunch.`,
				`Build a grain bowl with ${toTitle(primary, "grains")}, roasted veg, and a zesty dressing.`,
			],
			nutrition: null,
			extras: {
				hero: "Add a protein, a vegetable, and one flavor booster. Cora uses those anchors to plan main dishes and sides.",
				tips: [
					"List ingredients separated by commas. Include items from your fridge, pantry, or freezer.",
					"Pick a quick prompt like “sheet-pan dinner” if you want Cora to suggest a full menu.",
				],
				pairings: [
					"Keep citrus or vinegar handy to brighten finished dishes.",
					"Frozen herbs or pesto cubes can instantly lift flavors.",
				],
			},
		};
	}

	const core = tokens.slice(0, 3).join(", ");
	const [primary, secondary, tertiary] = tokens;
	const third = tertiary || secondary || "seasonal veg";

	const ideaTemplates = [
		`${toTitle(primary)} roasted with ${toTitle(secondary || "vegetables")} and finished with a simple ${third} pan sauce.`,
		`One-pan ${toTitle(primary)} ${secondary ? `and ${secondary} ` : ""}pasta with a light ${third} cream built from blended veggies.`,
		`Crispy ${toTitle(primary)} tacos topped with quick-pickled ${secondary || "onions"} and a ${third} yogurt drizzle.`,
		`Slow-baked ${toTitle(primary)} with a ${toTitle(third)} crumb topping and fresh herbs.`,
		`${toTitle(primary)} grain bowl with ${secondary || "greens"}, sliced citrus, and toasted seeds.`,
	];

	const ideas = ideaTemplates
		.slice(0, MAX_IDEAS)
		.map((idea) => idea.replace(/\s+/g, " ").trim());

	const chefTipsPool = [
		`Use the pan fond from ${primary || "your protein"} to make a quick sauce with broth and butter.`,
		`Reserve some pasta water so sauces cling to ${primary || "the noodles"}.`,
		`Briefly char ${secondary || "aromatics"} to add gentle smokiness.`,
		`Finish with lemon juice or vinegar to brighten the final dish.`,
	];

	const pairingPool = [
		`Serve with a crisp side salad dressed in olive oil, citrus, and salt.`,
		`Pair with sparkling water infused with cucumber or fresh mint.`,
		`Add roasted vegetables tossed in miso or soy butter.`,
		`Finish with broiled fruit drizzled with honey for a fast dessert.`,
	];

	return {
		title: prompt ? `Ideas for ${prompt}` : `Ideas using ${joinWithAnd(tokens.slice(0, 3))}`,
		ideas,
		nutrition: {
			estCalories: 320 + tokens.length * 35,
			difficulty: tokens.length < 3 ? "beginner" : "intermediate",
			estCost: formatCost(tokens.length * 2.75, "7.25"),
		},
		extras: {
			hero: `Cora keeps ${joinWithAnd(tokens.map(toTitle))} front and center and balances the dish with texture and brightness.`,
			tips: [seededPick(chefTipsPool, seed), seededPick([...chefTipsPool].reverse(), seed + 5)].filter(Boolean),
			pairings: [seededPick(pairingPool, seed), seededPick([...pairingPool].reverse(), seed + 11)].filter(Boolean),
		},
	};
};

const buildFallbackAssistance = (recipeTitle, tokens = []) => {
	const formattedTitle = recipeTitle?.trim() || "Your Recipe";

	const suggestions = [
		"List ingredient quantities up front and repeat key amounts in the steps.",
		"Add short sensory cues—describe colour, aroma, or texture when something is ready.",
		"Mention equipment sizes so readers avoid overcrowding pans or dishes.",
	];

	if (tokens.includes("bake") || tokens.includes("oven")) {
		suggestions.push("Include rack position, preheat time, and a quick doneness test like a toothpick or jiggle check.");
	}

	if (tokens.includes("grill") || tokens.includes("barbecue")) {
		suggestions.push("Suggest resting time and a final glaze or brushing after grilling.");
	}

	return {
		suggestions,
		improvements: {
			title: formattedTitle,
			estimatedTime: tokens.includes("slow") ? "90 minutes" : "45 minutes",
			difficulty: tokens.length > 6 ? "advanced" : tokens.length > 3 ? "intermediate" : "beginner",
		},
		extras: {
			shoppingList: [
				"Seasoning basics: kosher salt, pepper, a fresh acid (lemon or vinegar)",
				"Texture boosters: toasted nuts or seeds, crisp vegetables, fresh herbs",
			],
			timeline: [
				"Prep vegetables and aromatics first; keep proteins cold until cooking.",
				"Make sauces or dressings while the main cooks so they’re ready to finish the dish.",
			],
		},
	};
};

const buildFallbackRecipeDetail = (recipeIdea, tokens = []) => {
	const dishName = recipeIdea.trim() || "Simple Home-Cooked Meal";
	
	const baseIngredients = tokens.slice(0, 5).map((token, idx) => ({
		item: toTitle(token),
		amount: idx === 0 ? "1 lb" : idx === 1 ? "2 cups" : "1 cup",
		notes: idx === 0 ? "main protein or base" : undefined,
	}));

	const commonIngredients = [
		{ item: "Olive oil", amount: "2 tbsp" },
		{ item: "Salt and pepper", amount: "to taste" },
		{ item: "Garlic", amount: "3 cloves, minced" },
		{ item: "Fresh herbs", amount: "for garnish" },
	];

	const ingredients = baseIngredients.length > 0 ? [...baseIngredients, ...commonIngredients] : commonIngredients;

	const instructions = [
		{
			step: 1,
			instruction: "Prep all ingredients: wash, chop, and measure everything before starting.",
			tips: "This makes cooking smoother and prevents burning while searching for items.",
		},
		{
			step: 2,
			instruction: "Heat olive oil in a large skillet over medium-high heat for 2 minutes.",
			tips: "Oil should shimmer but not smoke.",
		},
		{
			step: 3,
			instruction: `Add ${tokens[0] || "main ingredient"} and cook for 5-7 minutes until golden brown.`,
			tips: "Don't move ingredients too much - let them develop a nice sear.",
		},
		{
			step: 4,
			instruction: "Add garlic and remaining vegetables. Cook for 3-4 minutes, stirring occasionally.",
			tips: "Garlic should be fragrant but not burnt.",
		},
		{
			step: 5,
			instruction: "Season with salt and pepper. Add a splash of liquid (broth, wine, or water) if needed.",
		},
		{
			step: 6,
			instruction: "Reduce heat to medium-low, cover, and simmer for 10-15 minutes until everything is tender.",
		},
		{
			step: 7,
			instruction: "Taste and adjust seasoning. Garnish with fresh herbs and serve immediately.",
			tips: "A squeeze of lemon or vinegar brightens the final dish.",
		},
	];

	return {
		title: dishName,
		description: `A simple, flavorful dish that brings together ${joinWithAnd(tokens.slice(0, 3))} with aromatic seasonings.`,
		servings: 4,
		prepTime: "15 minutes",
		cookTime: "25 minutes",
		totalTime: "40 minutes",
		difficulty: tokens.length < 3 ? "beginner" : tokens.length < 5 ? "intermediate" : "advanced",
		ingredients,
		instructions,
		nutrition: {
			calories: 350 + tokens.length * 25,
			protein: "18g",
			carbs: "32g",
			fat: "14g",
		},
		tips: [
			"Prep all ingredients before you start cooking (mise en place).",
			"Don't overcrowd the pan - cook in batches if needed for better browning.",
			"Taste as you go and adjust seasoning at the end.",
		],
		variations: [
			`Swap ${tokens[0] || "the main ingredient"} for tofu or tempeh for a plant-based version.`,
			"Add a can of coconut milk for a creamy curry-style dish.",
			"Finish with grated cheese or nutritional yeast for extra umami.",
		],
		storage: "Store in an airtight container in the refrigerator for up to 3 days. Reheat gently on the stovetop or microwave.",
	};
};

const extractJsonBlock = (raw) => {
	if (!raw) return null;
	const text = raw.trim();
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) return null;
	try {
		return JSON.parse(jsonMatch[0]);
	} catch (error) {
		return null;
	}
};

const coerceSuggestionShape = (payload, tokens, prompt) => {
	if (!payload || typeof payload !== "object") {
		return buildFallbackSuggestion(tokens, prompt);
	}

	const ideas = Array.isArray(payload.ideas)
		? payload.ideas.map((item) => String(item).trim()).filter(Boolean).slice(0, MAX_IDEAS)
		: [];

	if (!ideas.length) {
		return buildFallbackSuggestion(tokens, prompt);
	}

	const nutrition = payload.nutrition || {};
	const extras = payload.extras && typeof payload.extras === "object" ? payload.extras : null;

	const normalizedExtras = extras
		? {
			hero: extras.hero?.toString().trim() || undefined,
			tips: Array.isArray(extras.tips)
				? extras.tips.map((tip) => tip && tip.toString().trim()).filter(Boolean)
				: undefined,
			pairings: Array.isArray(extras.pairings)
				? extras.pairings.map((pair) => pair && pair.toString().trim()).filter(Boolean)
				: undefined,
		}
		: undefined;

	return {
		title: payload.title?.toString().trim() || (prompt ? `Ideas for: ${prompt}` : `Ideas with ${tokens.slice(0, 3).join(", ")}`),
		ideas,
		nutrition: nutrition
			? {
					estCalories: clampNumber(nutrition.estCalories, { min: 180, max: 1200, fallback: 420 }),
					difficulty: nutrition.difficulty?.toString().toLowerCase() || "intermediate",
					estCost: formatCost(nutrition.estCost, "8.00"),
			}
			: null,
		extras: normalizedExtras,
	};
};

const coerceRecipeDetailShape = (payload, recipeIdea, tokens) => {
	if (!payload || typeof payload !== "object") {
		return buildFallbackRecipeDetail(recipeIdea, tokens);
	}

	const ingredients = Array.isArray(payload.ingredients)
		? payload.ingredients.map((ing) => ({
				item: ing?.item?.toString().trim() || "",
				amount: ing?.amount?.toString().trim() || "",
				notes: ing?.notes?.toString().trim() || undefined,
		  })).filter((ing) => ing.item)
		: [];

	const instructions = Array.isArray(payload.instructions)
		? payload.instructions.map((inst) => ({
				step: Number(inst?.step) || 0,
				instruction: inst?.instruction?.toString().trim() || "",
				tips: inst?.tips?.toString().trim() || undefined,
		  })).filter((inst) => inst.instruction)
		: [];

	if (!ingredients.length || !instructions.length) {
		return buildFallbackRecipeDetail(recipeIdea, tokens);
	}

	const nutrition = payload.nutrition || {};
	const tips = Array.isArray(payload.tips) ? payload.tips.map((t) => String(t).trim()).filter(Boolean) : [];
	const variations = Array.isArray(payload.variations) ? payload.variations.map((v) => String(v).trim()).filter(Boolean) : [];

	return {
		title: payload.title?.toString().trim() || recipeIdea,
		description: payload.description?.toString().trim() || "",
		servings: clampNumber(payload.servings, { min: 1, max: 12, fallback: 4 }),
		prepTime: payload.prepTime?.toString().trim() || "15 minutes",
		cookTime: payload.cookTime?.toString().trim() || "30 minutes",
		totalTime: payload.totalTime?.toString().trim() || "45 minutes",
		difficulty: payload.difficulty?.toString().toLowerCase() || "intermediate",
		ingredients,
		instructions,
		nutrition: {
			calories: clampNumber(nutrition.calories, { min: 100, max: 1500, fallback: 400 }),
			protein: nutrition.protein?.toString().trim() || "20g",
			carbs: nutrition.carbs?.toString().trim() || "35g",
			fat: nutrition.fat?.toString().trim() || "15g",
		},
		tips: tips.length > 0 ? tips : ["Prep ingredients before starting.", "Taste and adjust seasoning."],
		variations: variations.length > 0 ? variations : ["Swap proteins for dietary preferences."],
		storage: payload.storage?.toString().trim() || "Store in refrigerator for up to 3 days.",
	};
};

const coerceAssistanceShape = (payload, recipeTitle, tokens) => {
	if (!payload || typeof payload !== "object") {
		return buildFallbackAssistance(recipeTitle, tokens);
	}

	const suggestions = Array.isArray(payload.suggestions)
		? payload.suggestions.map((item) => String(item).trim()).filter(Boolean)
		: [];

	const improvements = payload.improvements && typeof payload.improvements === "object" ? payload.improvements : {};
	const extras = payload.extras && typeof payload.extras === "object" ? payload.extras : null;

	const normalizedExtras = extras
		? {
			shoppingList: Array.isArray(extras.shoppingList)
				? extras.shoppingList.map((item) => item && item.toString().trim()).filter(Boolean)
				: undefined,
			timeline: Array.isArray(extras.timeline)
				? extras.timeline.map((item) => item && item.toString().trim()).filter(Boolean)
				: undefined,
		}
		: undefined;

	if (!suggestions.length) {
		return buildFallbackAssistance(recipeTitle, tokens);
	}

	return {
		suggestions,
		improvements: {
			title: improvements.title?.toString().trim() || recipeTitle || "Your Recipe",
			estimatedTime: improvements.estimatedTime?.toString().trim() || "40 minutes",
			difficulty: improvements.difficulty?.toString().toLowerCase() || "intermediate",
		},
		extras: normalizedExtras,
	};
};

const shouldRetryWithAlternateModel = (error) => {
	const message = error?.response?.data?.message || error?.message || "";
	if (error?.response?.status === 404) return true;
	if (/was removed/i.test(message)) return true;
	if (/not found/i.test(message)) return true;
	if (/available models/i.test(message)) return true;
	return false;
};

const resolveModelChain = () => {
	const configuredModel = (process.env.COHERE_MODEL || "").trim();
	const defaults = [
		configuredModel,
		getDefaultCohereModel(),
		"command-a-03-2025",
		"command-r7b-12-2024",
		"command-r7b",
		"command-a-reasoning-08-2025",
	];
	return [...new Set(defaults.filter(Boolean))];
};

const callCohereWithFallback = async (options) => {
	const attempts = [];
	const modelsToTry = resolveModelChain();
	let lastError;

	for (const model of modelsToTry) {
		try {
			const response = await callCohereChat({ ...options, model });
			return { response, modelUsed: model };
		} catch (error) {
			const message = error?.response?.data?.message || error?.message || "Unknown error";
			attempts.push({ model, message });
			lastError = error;

			if (!shouldRetryWithAlternateModel(error)) {
				error.attempts = attempts;
				throw error;
			}
		}
	}

	if (lastError) {
		lastError.attempts = attempts;
		throw lastError;
	}

	const finalError = new Error("Cohere request failed for all configured models");
	finalError.attempts = attempts;
	throw finalError;
};

export const getAISuggestions = async (req, res) => {
	const { ingredients, prompt = "", context = "recipe_suggestions" } = req.body || {};

	const tokens = normalizeIngredients(ingredients, prompt);

	if (!tokens.length && !prompt.trim()) {
		return res.status(400).json({
			success: false,
			message: "Please provide ingredients or a prompt.",
		});
	}

	const fallbackResponse = buildFallbackSuggestion(tokens, prompt);

	if (!hasCohereCredentials()) {
		return res.status(200).json({
			success: true,
			data: fallbackResponse,
			fallback: true,
			message: "Cohere API key not configured. Showing smart offline suggestions.",
		});
	}

	try {
		const userName = req.user?.fullName || req.user?.name || req.user?.email || "community member";
		const ingredientList = tokens.length ? tokens.join(", ") : prompt;

		const systemPrompt = `You are "Cora", an upbeat culinary and DIY assistant for the Recipe & DIY Hub community.
	- Craft imaginative yet practical food ideas using the provided ingredients.
	- Return strictly valid JSON without markdown code fences.
	- JSON shape:
		{
			"title": string,
			"ideas": string[${MAX_IDEAS}],
			"nutrition": {
				"estCalories": number,
				"difficulty": "beginner" | "intermediate" | "advanced",
				"estCost": string // numeric with two decimals
			},
			"extras": {
				"hero"?: string,
				"tips"?: string[],
				"pairings"?: string[]
			}
		}
	- Calories must be between 200 and 900.
	- EstCost should be a realistic dollar amount with two decimals.
	- Keep tone friendly and specific. Provide concrete technique tips inside extras.`;

		const userPrompt = `Community member: ${userName}.
Context: ${context}.
Available ingredients: ${ingredientList || "(none specified)"}.
Additional request: ${prompt.trim() || "Focus on balanced recipes"}.

Produce ${MAX_IDEAS} creative recipe starters that are doable at home, include quick descriptors, and vary techniques.`;

		const { response: cohereResponse, modelUsed } = await callCohereWithFallback({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.6,
			maxTokens: 700,
		});

		const rawText = extractCohereText(cohereResponse);
		const parsedJson = extractJsonBlock(rawText);
		const suggestion = coerceSuggestionShape(parsedJson, tokens, prompt);

		const reportedModel =
			cohereResponse?.response?.model ||
			cohereResponse?.model ||
			cohereResponse?.meta?.model ||
			modelUsed ||
			getDefaultCohereModel();

		return res.status(200).json({
			success: true,
			data: suggestion,
			fallback: false,
			provider: {
				name: "cohere",
				model: reportedModel,
			},
		});
	} catch (error) {
		const attempts = error?.attempts || [];
		console.error("Cohere suggestion error:", error?.response?.data || error.message || error, {
			attempts,
		});

		return res.status(200).json({
			success: true,
			data: fallbackResponse,
			fallback: true,
			message:
				attempts.length > 0
					? "Cohere model unavailable. Showing offline suggestions."
					: "Cohere service unavailable. Showing offline suggestions.",
		});
	}
};

export const getRecipeDetail = async (req, res) => {
	const { recipeIdea = "", ingredients = "" } = req.body || {};

	if (!recipeIdea) {
		return res.status(400).json({
			success: false,
			message: "Please provide a recipe idea to get full details.",
		});
	}

	const tokens = normalizeIngredients(ingredients);
	const fallbackResponse = buildFallbackRecipeDetail(recipeIdea, tokens);

	if (!hasCohereCredentials()) {
		return res.status(200).json({
			success: true,
			data: fallbackResponse,
			fallback: true,
			message: "Cohere API key not configured. Showing smart offline recipe.",
		});
	}

	try {
		const systemPrompt = `You are "Cora", a culinary expert. Create recipes as JSON (no markdown):
{
  "title": string,
  "description": string,
  "servings": number,
  "prepTime": string,
  "cookTime": string,
  "totalTime": string,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "ingredients": [{"item": string, "amount": string, "notes"?: string}],
  "instructions": [{"step": number, "instruction": string, "tips"?: string}],
  "nutrition": {"calories": number, "protein": string, "carbs": string, "fat": string},
  "tips": string[],
  "variations": string[],
  "storage": string
}
Be concise. Include 5-8 ingredients, 5-7 steps, 2-3 tips, 2 variations.`;

		const userPrompt = `Recipe: "${recipeIdea}".${tokens.length > 0 ? ` Use: ${tokens.slice(0, 5).join(", ")}.` : ""} Provide ingredients with amounts, numbered steps with times/temps, nutrition, tips, variations, and storage.`;

		const { response: cohereResponse, modelUsed } = await callCohereWithFallback({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.5,
			maxTokens: 900,
		});

		const rawText = extractCohereText(cohereResponse);
		const parsedJson = extractJsonBlock(rawText);
		const recipeDetail = coerceRecipeDetailShape(parsedJson, recipeIdea, tokens);

		const reportedModel =
			cohereResponse?.response?.model ||
			cohereResponse?.model ||
			cohereResponse?.meta?.model ||
			modelUsed ||
			getDefaultCohereModel();

		return res.status(200).json({
			success: true,
			data: recipeDetail,
			fallback: false,
			provider: {
				name: "cohere",
				model: reportedModel,
			},
		});
	} catch (error) {
		const attempts = error?.attempts || [];
		console.error("Cohere recipe detail error:", error?.response?.data || error.message || error, {
			attempts,
		});

		return res.status(200).json({
			success: true,
			data: fallbackResponse,
			fallback: true,
			message:
				attempts.length > 0
					? "Cohere model unavailable. Showing offline recipe."
					: "Cohere service unavailable. Showing offline recipe.",
		});
	}
};

export const getRecipeAssistance = async (req, res) => {
	const { recipeTitle = "", ingredients = "", instructions = "" } = req.body || {};

	if (!ingredients && !instructions) {
		return res.status(400).json({
			success: false,
			message: "Please provide ingredients or instructions for assistance.",
		});
	}

	const tokens = normalizeIngredients(ingredients, instructions);
	const fallbackResponse = buildFallbackAssistance(recipeTitle, tokens);

	if (!hasCohereCredentials()) {
		return res.status(200).json({
			success: true,
			data: fallbackResponse,
			fallback: true,
			message: "Cohere API key not configured. Showing smart offline tips.",
		});
	}

	try {
		const systemPrompt = `You are "Cora", a culinary coach for home cooks.
	- Review recipes for clarity, safety, and flavor impact.
	- Respond with JSON only (no markdown) shaped as:
		{
			"suggestions": string[],
			"improvements": {
				"title": string,
				"estimatedTime": string,
				"difficulty": "beginner" | "intermediate" | "advanced"
			},
			"extras"?: {
				"shoppingList"?: string[],
				"timeline"?: string[]
			}
		}
	- Suggestions should be actionable bullet points.
	- Keep feedback encouraging and practical. Extras should summarise mise en place or shopping notes when helpful.`;

		const userPrompt = `Recipe title: ${recipeTitle || "(untitled)"}.
Ingredients: ${typeof ingredients === "string" ? ingredients : JSON.stringify(ingredients)}.
Instructions: ${instructions || "(not provided)"}.

Identify the top improvements, clarify missing details, and suggest a polished title if needed.`;

		const { response: cohereResponse, modelUsed } = await callCohereWithFallback({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.5,
			maxTokens: 600,
		});

		const rawText = extractCohereText(cohereResponse);
		const parsedJson = extractJsonBlock(rawText);
		const assistance = coerceAssistanceShape(parsedJson, recipeTitle, tokens);

		const reportedModel =
			cohereResponse?.response?.model ||
			cohereResponse?.model ||
			cohereResponse?.meta?.model ||
			modelUsed ||
			getDefaultCohereModel();

		return res.status(200).json({
			success: true,
			data: assistance,
			fallback: false,
			provider: {
				name: "cohere",
				model: reportedModel,
			},
		});
	} catch (error) {
		const attempts = error?.attempts || [];
		console.error("Cohere recipe assistance error:", error?.response?.data || error.message || error, {
			attempts,
		});

		return res.status(200).json({
			success: true,
			data: fallbackResponse,
			fallback: true,
			message:
				attempts.length > 0
					? "Cohere model unavailable. Showing offline guidance."
					: "Cohere service unavailable. Showing offline guidance.",
		});
	}
};

