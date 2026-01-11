import {scoreRecipe} from './scorerecipes.js';

// export function matchRecipes(recipes, userIngredients) {
//     return recipes
//     .map(recipe => scoreRecipe(recipe, userIngredients))
//     .filter(recipe => recipe.matchCount > 0) // removes 0 matches
//     .sort((a, b) => {
//       // primary: more matches
//       if (b.matchCount !== a.matchCount) {
//         return b.matchCount - a.matchCount;
//       }
//       // secondary: fewer missing ingredients
//       return a.missingCount - b.missingCount;
//     });
// }

export function matchTopRecipes(recipes, userIngredients, limit = 50) {
  const top = [];

  for (const recipe of recipes) {
    const scored = scoreRecipe(recipe, userIngredients);

    if (scored.matchCount === 0) continue;

    top.push(scored);

    top.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.missingCount - b.missingCount;
    });

    if (top.length > limit) {
      top.pop(); // remove worst match
    }
  }

  return top;
}