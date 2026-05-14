// Keywords checked in classification order (specific → general within each section).
// Oils & Condiments comes first so "avocado oil", "coconut oil" etc. don't land in Produce.
// Frozen comes before Canned so "frozen peas" lands in Frozen, not Canned.
const CLASSIFICATION: Array<[section: string, keywords: string[]]> = [
  ['Oils & Condiments', [
    'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil', 'avocado oil',
    'cooking spray', 'balsamic', 'apple cider vinegar', 'rice vinegar', 'white vinegar',
    'vinegar', 'soy sauce', 'tamari', 'fish sauce', 'worcestershire', 'sriracha', 'hot sauce',
    'ketchup', 'mustard', 'dijon', 'mayonnaise', 'mayo', 'ranch', 'salad dressing',
    'honey', 'maple syrup', 'agave', 'molasses', 'jam', 'jelly', 'preserves',
    'peanut butter', 'almond butter', 'nut butter', 'nutella', 'miso paste', 'hoisin',
    'oyster sauce', 'teriyaki', 'bbq sauce', 'tahini', 'oil',
  ]],
  ['Frozen', [
    'frozen', 'ice cream', 'gelato', 'sorbet',
  ]],
  ['Produce', [
    'apple', 'banana', 'lemon', 'lime', 'orange', 'grapefruit', 'grape', 'berr', 'cherry',
    'peach', 'pear', 'plum', 'mango', 'pineapple', 'watermelon', 'cantaloupe', 'honeydew',
    'avocado', 'tomato', 'potato', 'sweet potato', 'yam', 'onion', 'garlic', 'shallot',
    'leek', 'scallion', 'green onion', 'spring onion', 'carrot', 'celery', 'bell pepper',
    'jalapeño', 'serrano', 'poblano', 'zucchini', 'squash', 'eggplant', 'broccoli',
    'cauliflower', 'cabbage', 'kale', 'spinach', 'lettuce', 'arugula', 'chard', 'beet',
    'turnip', 'parsnip', 'radish', 'cucumber', 'corn', 'asparagus', 'artichoke',
    'mushroom', 'fresh ginger', 'ginger root', 'basil', 'cilantro', 'parsley', 'mint',
    'chive', 'dill', 'lemongrass', 'bok choy', 'fennel', 'kohlrabi', 'watercress',
    'endive', 'radicchio', 'rhubarb', 'fig', 'guava', 'papaya', 'passion fruit',
    'pomegranate', 'kiwi', 'starfruit', 'persimmon',
  ]],
  ['Meat & Seafood', [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'bison', 'venison',
    'ground meat', 'ground beef', 'ground turkey', 'ground pork', 'steak', 'tenderloin',
    'ribeye', 'sirloin', 'roast', 'chop', 'breast', 'thigh', 'wing', 'drumstick',
    'rib', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni', 'prosciutto', 'pancetta',
    'chorizo', 'bratwurst', 'hot dog', 'lunch meat', 'deli meat', 'fish', 'salmon',
    'tuna', 'cod', 'tilapia', 'halibut', 'shrimp', 'prawn', 'crab', 'lobster',
    'scallop', 'clam', 'mussel', 'oyster', 'squid', 'anchovy', 'sardine',
    'mahi', 'sea bass', 'trout', 'catfish', 'mackerel', 'herring',
  ]],
  ['Dairy & Eggs', [
    'oat milk', 'almond milk', 'soy milk', 'coconut milk beverage', 'heavy cream',
    'whipping cream', 'half and half', 'buttermilk', 'milk', 'butter', 'ghee',
    'cheddar', 'mozzarella', 'parmesan', 'brie', 'feta', 'gouda', 'ricotta',
    'cottage cheese', 'cream cheese', 'sour cream', 'crème fraîche', 'cheese',
    'greek yogurt', 'yogurt', 'kefir', 'egg',
  ]],
  ['Bakery & Bread', [
    'sourdough', 'baguette', 'english muffin', 'bread', 'roll', 'bun', 'bagel',
    'tortilla', 'pita', 'naan', 'wrap', 'croissant', 'crouton', 'breadcrumb', 'panko',
  ]],
  ['Canned & Dry Goods', [
    'spaghetti', 'fettuccine', 'linguine', 'penne', 'rigatoni', 'lasagna', 'orzo',
    'pasta', 'ramen noodle', 'udon', 'soba', 'rice noodle', 'noodle',
    'jasmine rice', 'basmati rice', 'brown rice', 'white rice', 'rice',
    'quinoa', 'couscous', 'bulgur', 'farro', 'barley', 'millet', 'polenta', 'grits',
    'red lentil', 'green lentil', 'lentil', 'black bean', 'kidney bean', 'navy bean',
    'cannellini', 'pinto bean', 'chickpea', 'garbanzo', 'split pea', 'bean',
    'rolled oat', 'steel cut oat', 'oatmeal', 'oat', 'granola', 'cereal',
    'canned', 'diced tomato', 'crushed tomato', 'tomato sauce', 'tomato paste',
    'chicken broth', 'beef broth', 'vegetable broth', 'broth', 'stock',
    'coconut milk', 'coconut cream', 'tofu', 'tempeh', 'seitan', 'edamame',
    'bread crumb',
  ]],
  ['Baking & Spices', [
    'all-purpose flour', 'bread flour', 'cake flour', 'whole wheat flour', 'flour',
    'granulated sugar', 'brown sugar', 'powdered sugar', 'confectioner', 'sugar',
    'baking powder', 'baking soda', 'active dry yeast', 'instant yeast', 'yeast',
    'cornstarch', 'arrowroot', 'cocoa powder', 'dark chocolate', 'chocolate chip',
    'chocolate', 'vanilla extract', 'vanilla bean', 'vanilla', 'cinnamon', 'cumin',
    'smoked paprika', 'paprika', 'dried thyme', 'dried rosemary', 'dried oregano',
    'dried basil', 'bay leaf', 'nutmeg', 'clove', 'cardamom', 'allspice',
    'ground ginger', 'ginger powder', 'ginger', 'anise', 'fennel seed', 'caraway',
    'mustard seed', 'sesame seed', 'poppy seed', 'red pepper flake',
    'cayenne', 'chili powder', 'curry powder', 'garam masala', 'turmeric',
    'italian seasoning', 'herbs de provence', 'old bay', 'kosher salt', 'sea salt', 'salt',
    'black pepper', 'white pepper', 'pepper', 'spice', 'seasoning', 'extract',
  ]],
  ['Snacks & Beverages', [
    'potato chip', 'tortilla chip', 'chip', 'crisp', 'cracker', 'pretzel', 'popcorn',
    'trail mix', 'dried fruit', 'raisin', 'dried cranberry', 'dried mango',
    'almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'mixed nut', 'peanut',
    'orange juice', 'apple juice', 'juice', 'cold brew', 'coffee', 'tea',
    'sparkling water', 'soda', 'kombucha', 'wine', 'beer', 'spirits', 'energy drink',
  ]],
]

// Store aisle order (what the user walks through)
export const SECTION_ORDER: string[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Frozen',
  'Canned & Dry Goods',
  'Baking & Spices',
  'Oils & Condiments',
  'Snacks & Beverages',
  'Other',
]

export function getStoreSection(ingredientName: string): string {
  const lower = ingredientName.toLowerCase()
  for (const [section, keywords] of CLASSIFICATION) {
    if (keywords.some((kw) => lower.includes(kw))) return section
  }
  return 'Other'
}
