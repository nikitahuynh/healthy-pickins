import fs from 'fs';

const data = JSON.parse(fs.readFileSync('recipes.json', 'utf8'));

const cleaned = data.map(
  ({ continent, region, sub_region, energy, ...rest }) => rest
);

fs.writeFileSync(
  'recipes_cleaned.json',
  JSON.stringify(cleaned, null, 2)
);

console.log('Removed continent, region, sub_region, and energy ✔️');