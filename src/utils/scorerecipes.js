import { normalize } from './normalize';

export function scoreRecipe(recipe, userIngredients) {
    const norm_user = userIngredients.map(normalize);

    const matches = norm_user.filter(user_i => 
        recipe.ingredients.some(recipe_i => normalize(recipe_i) === user_i)
    );

    const missing = norm_user.filter(user_i => 
        !recipe.ingredients.some(recipe_i => normalize(recipe_i) === user_i)
    );

    return {
    ...recipe,
    matchCount: matches.length,
    matchedIngredients: matches,
    missingCount: recipe.ingredients.length - matches.length,
    missingIngredients: missing
  };
}