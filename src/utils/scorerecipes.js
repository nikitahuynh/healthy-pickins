import { normalize } from './normalize';

export function scoreRecipe(recipe, userIngredients) {
    const norm_user = userIngredients.map(normalize);

    const matches = norm_user 
}