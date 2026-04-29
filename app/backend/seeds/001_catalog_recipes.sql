-- Seed data for catalog_recipes
-- Run in Supabase SQL Editor after migration 011

INSERT INTO catalog_recipes (title, description, cuisines, dietary_tags, recipe_json) VALUES
(
  'Spaghetti Carbonara',
  'A classic Roman pasta dish with eggs, cheese, pancetta, and pepper.',
  ARRAY['italian'],
  ARRAY[]::TEXT[],
  $${
    "title": "Spaghetti Carbonara",
    "servings": 2,
    "cookTimeMinutes": 30,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "spaghetti", "quantity": 200, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "pancetta", "quantity": 100, "unit": "g", "preparation": "diced", "isOptional": false},
      {"name": "eggs", "quantity": 2, "unit": null, "preparation": null, "isOptional": false},
      {"name": "parmesan cheese", "quantity": 50, "unit": "g", "preparation": "grated", "isOptional": false},
      {"name": "black pepper", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "salt", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Cook spaghetti in salted boiling water until al dente. Reserve 1 cup pasta water."},
      {"stepNumber": 2, "instruction": "Fry pancetta in a large pan over medium heat until crispy."},
      {"stepNumber": 3, "instruction": "Whisk eggs with grated parmesan and plenty of black pepper in a bowl."},
      {"stepNumber": 4, "instruction": "Remove pan from heat, add drained pasta, then pour in egg mixture. Toss quickly, adding pasta water as needed to create a creamy sauce."},
      {"stepNumber": 5, "instruction": "Serve immediately with extra parmesan and black pepper."}
    ],
    "tags": ["classic", "pasta", "quick"]
  }$$
),
(
  'Chicken Stir Fry',
  'Quick and healthy stir fry with chicken and fresh vegetables in a savory sauce.',
  ARRAY['asian'],
  ARRAY['gluten_free'],
  $${
    "title": "Chicken Stir Fry",
    "servings": 2,
    "cookTimeMinutes": 25,
    "prepTimeMinutes": 15,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "chicken breast", "quantity": 300, "unit": "g", "preparation": "sliced", "isOptional": false},
      {"name": "broccoli", "quantity": 200, "unit": "g", "preparation": "florets", "isOptional": false},
      {"name": "bell pepper", "quantity": 1, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "soy sauce", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "garlic", "quantity": 2, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "ginger", "quantity": 1, "unit": "tsp", "preparation": "grated", "isOptional": false},
      {"name": "sesame oil", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Heat sesame oil in a wok or large frying pan over high heat."},
      {"stepNumber": 2, "instruction": "Add chicken and stir fry for 5-6 minutes until cooked through. Remove and set aside."},
      {"stepNumber": 3, "instruction": "Add garlic and ginger, stir fry 30 seconds, then add vegetables."},
      {"stepNumber": 4, "instruction": "Stir fry vegetables for 3-4 minutes, then return chicken to pan."},
      {"stepNumber": 5, "instruction": "Add soy sauce and toss everything together. Serve over rice."}
    ],
    "tags": ["quick", "healthy", "gluten_free"]
  }$$
),
(
  'Beef Tacos',
  'Seasoned ground beef tacos with fresh toppings in crispy shells.',
  ARRAY['mexican'],
  ARRAY[]::TEXT[],
  $${
    "title": "Beef Tacos",
    "servings": 2,
    "cookTimeMinutes": 30,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "ground beef", "quantity": 300, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "taco shells", "quantity": 6, "unit": null, "preparation": null, "isOptional": false},
      {"name": "taco seasoning", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "cheddar cheese", "quantity": 100, "unit": "g", "preparation": "shredded", "isOptional": false},
      {"name": "lettuce", "quantity": 2, "unit": "cups", "preparation": "shredded", "isOptional": false},
      {"name": "tomato", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "sour cream", "quantity": 4, "unit": "tbsp", "preparation": null, "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Brown ground beef in a skillet over medium-high heat, breaking it up as it cooks."},
      {"stepNumber": 2, "instruction": "Drain excess fat, then add taco seasoning and 1/4 cup water. Simmer for 5 minutes."},
      {"stepNumber": 3, "instruction": "Warm taco shells in the oven for 5 minutes."},
      {"stepNumber": 4, "instruction": "Fill shells with beef, cheese, lettuce, and tomato. Top with sour cream if desired."}
    ],
    "tags": ["easy", "family"]
  }$$
),
(
  'Greek Salad',
  'Crisp Mediterranean salad with olives, feta, and fresh vegetables.',
  ARRAY['mediterranean'],
  ARRAY['vegetarian', 'gluten_free'],
  $${
    "title": "Greek Salad",
    "servings": 2,
    "cookTimeMinutes": 15,
    "prepTimeMinutes": 15,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "cucumber", "quantity": 1, "unit": null, "preparation": "chopped", "isOptional": false},
      {"name": "cherry tomatoes", "quantity": 1, "unit": "cup", "preparation": "halved", "isOptional": false},
      {"name": "red onion", "quantity": 0.5, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "kalamata olives", "quantity": 0.5, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "feta cheese", "quantity": 100, "unit": "g", "preparation": "crumbled", "isOptional": false},
      {"name": "olive oil", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "dried oregano", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Combine cucumber, cherry tomatoes, and red onion in a large bowl."},
      {"stepNumber": 2, "instruction": "Add olives and feta cheese."},
      {"stepNumber": 3, "instruction": "Drizzle with olive oil, sprinkle oregano, and season with salt and pepper. Toss gently and serve."}
    ],
    "tags": ["salad", "no_cook", "vegetarian", "gluten_free"]
  }$$
),
(
  'Classic Grilled Cheese',
  'Golden, crispy grilled cheese sandwich with melted cheddar.',
  ARRAY['american'],
  ARRAY['vegetarian'],
  $${
    "title": "Classic Grilled Cheese",
    "servings": 2,
    "cookTimeMinutes": 15,
    "prepTimeMinutes": 5,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "bread", "quantity": 4, "unit": "slices", "preparation": null, "isOptional": false},
      {"name": "cheddar cheese", "quantity": 100, "unit": "g", "preparation": "sliced", "isOptional": false},
      {"name": "butter", "quantity": 2, "unit": "tbsp", "preparation": "softened", "isOptional": false},
      {"name": "garlic powder", "quantity": 0.25, "unit": "tsp", "preparation": null, "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Spread butter on one side of each bread slice."},
      {"stepNumber": 2, "instruction": "Place cheese between two slices, butter-side out."},
      {"stepNumber": 3, "instruction": "Cook in a skillet over medium heat for 3-4 minutes per side until golden and cheese is melted."}
    ],
    "tags": ["quick", "comfort", "vegetarian"]
  }$$
),
(
  'Pad Thai',
  'Classic Thai stir-fried noodles with shrimp, eggs, and peanuts.',
  ARRAY['asian'],
  ARRAY[]::TEXT[],
  $${
    "title": "Pad Thai",
    "servings": 2,
    "cookTimeMinutes": 30,
    "prepTimeMinutes": 20,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "rice noodles", "quantity": 200, "unit": "g", "preparation": "soaked", "isOptional": false},
      {"name": "shrimp", "quantity": 200, "unit": "g", "preparation": "peeled", "isOptional": false},
      {"name": "eggs", "quantity": 2, "unit": null, "preparation": null, "isOptional": false},
      {"name": "fish sauce", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "tamarind paste", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "bean sprouts", "quantity": 1, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "peanuts", "quantity": 3, "unit": "tbsp", "preparation": "crushed", "isOptional": false},
      {"name": "lime", "quantity": 1, "unit": null, "preparation": "wedged", "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Soak rice noodles in warm water for 20 minutes, then drain."},
      {"stepNumber": 2, "instruction": "Heat oil in a wok, cook shrimp until pink, push to side. Scramble eggs in the wok."},
      {"stepNumber": 3, "instruction": "Add noodles, fish sauce, and tamarind paste. Toss everything together over high heat."},
      {"stepNumber": 4, "instruction": "Add bean sprouts and toss for 1 minute. Serve topped with peanuts and lime wedges."}
    ],
    "tags": ["noodles", "takeout_style"]
  }$$
),
(
  'Margherita Pizza',
  'Classic Neapolitan pizza with tomato sauce, fresh mozzarella, and basil.',
  ARRAY['italian'],
  ARRAY['vegetarian'],
  $${
    "title": "Margherita Pizza",
    "servings": 2,
    "cookTimeMinutes": 45,
    "prepTimeMinutes": 30,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "pizza dough", "quantity": 300, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "tomato sauce", "quantity": 0.5, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "fresh mozzarella", "quantity": 150, "unit": "g", "preparation": "sliced", "isOptional": false},
      {"name": "fresh basil", "quantity": 10, "unit": "leaves", "preparation": null, "isOptional": false},
      {"name": "olive oil", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "salt", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Preheat oven to 250°C (480°F). Stretch dough on a floured surface into a round."},
      {"stepNumber": 2, "instruction": "Spread tomato sauce over the dough, leaving a border for the crust."},
      {"stepNumber": 3, "instruction": "Top with mozzarella slices and drizzle with olive oil."},
      {"stepNumber": 4, "instruction": "Bake for 10-12 minutes until crust is golden and cheese is bubbling."},
      {"stepNumber": 5, "instruction": "Top with fresh basil leaves and serve immediately."}
    ],
    "tags": ["pizza", "vegetarian", "baked"]
  }$$
),
(
  'Shakshuka',
  'Eggs poached in a spiced tomato and pepper sauce.',
  ARRAY['mediterranean'],
  ARRAY['vegetarian'],
  $${
    "title": "Shakshuka",
    "servings": 2,
    "cookTimeMinutes": 25,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "eggs", "quantity": 4, "unit": null, "preparation": null, "isOptional": false},
      {"name": "canned tomatoes", "quantity": 400, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "red bell pepper", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "onion", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "garlic", "quantity": 3, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "cumin", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "paprika", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Sauté onion and pepper in olive oil over medium heat for 5 minutes."},
      {"stepNumber": 2, "instruction": "Add garlic, cumin, and paprika. Cook 1 minute until fragrant."},
      {"stepNumber": 3, "instruction": "Add canned tomatoes, break them up, and simmer for 10 minutes."},
      {"stepNumber": 4, "instruction": "Make wells in the sauce and crack eggs into them. Cover and cook 5-7 minutes until whites are set."},
      {"stepNumber": 5, "instruction": "Serve with crusty bread for dipping."}
    ],
    "tags": ["eggs", "vegetarian", "one_pan"]
  }$$
),
(
  'Chicken Fried Rice',
  'Savory fried rice with chicken, vegetables, and soy sauce.',
  ARRAY['asian'],
  ARRAY[]::TEXT[],
  $${
    "title": "Chicken Fried Rice",
    "servings": 2,
    "cookTimeMinutes": 25,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "cooked rice", "quantity": 2, "unit": "cups", "preparation": "cold", "isOptional": false},
      {"name": "chicken breast", "quantity": 200, "unit": "g", "preparation": "diced", "isOptional": false},
      {"name": "eggs", "quantity": 2, "unit": null, "preparation": "beaten", "isOptional": false},
      {"name": "soy sauce", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "frozen peas and carrots", "quantity": 1, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "garlic", "quantity": 2, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "sesame oil", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Heat oil in a wok over high heat. Cook chicken until golden, then set aside."},
      {"stepNumber": 2, "instruction": "Add garlic and peas/carrots, stir fry 2 minutes."},
      {"stepNumber": 3, "instruction": "Push vegetables to side, scramble eggs in the wok."},
      {"stepNumber": 4, "instruction": "Add cold rice and stir fry, breaking up clumps, for 3-4 minutes."},
      {"stepNumber": 5, "instruction": "Return chicken, add soy sauce and sesame oil. Toss to combine and serve."}
    ],
    "tags": ["rice", "leftover_friendly", "quick"]
  }$$
),
(
  'Veggie Burrito Bowl',
  'Colorful Mexican-inspired bowl with rice, beans, and fresh toppings.',
  ARRAY['mexican'],
  ARRAY['vegetarian', 'gluten_free'],
  $${
    "title": "Veggie Burrito Bowl",
    "servings": 2,
    "cookTimeMinutes": 25,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "cooked rice", "quantity": 2, "unit": "cups", "preparation": null, "isOptional": false},
      {"name": "black beans", "quantity": 400, "unit": "g", "preparation": "rinsed", "isOptional": false},
      {"name": "corn", "quantity": 1, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "avocado", "quantity": 1, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "salsa", "quantity": 0.5, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "lime juice", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "cilantro", "quantity": 2, "unit": "tbsp", "preparation": "chopped", "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Warm black beans in a saucepan with a pinch of cumin and salt."},
      {"stepNumber": 2, "instruction": "Char corn in a dry pan over high heat for 3-4 minutes."},
      {"stepNumber": 3, "instruction": "Assemble bowls: start with rice, then beans, corn, and avocado."},
      {"stepNumber": 4, "instruction": "Top with salsa, squeeze lime over everything, and garnish with cilantro."}
    ],
    "tags": ["bowl", "vegetarian", "gluten_free", "meal_prep"]
  }$$
),
(
  'Mac and Cheese',
  'Creamy homemade macaroni and cheese with a golden breadcrumb topping.',
  ARRAY['american'],
  ARRAY['vegetarian'],
  $${
    "title": "Mac and Cheese",
    "servings": 2,
    "cookTimeMinutes": 20,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "macaroni pasta", "quantity": 200, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "butter", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "flour", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "milk", "quantity": 1.5, "unit": "cups", "preparation": null, "isOptional": false},
      {"name": "cheddar cheese", "quantity": 150, "unit": "g", "preparation": "grated", "isOptional": false},
      {"name": "mustard powder", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Cook macaroni in salted water until al dente. Drain and set aside."},
      {"stepNumber": 2, "instruction": "Melt butter in a saucepan, add flour, and stir for 1 minute to form a roux."},
      {"stepNumber": 3, "instruction": "Gradually whisk in milk. Cook over medium heat, stirring constantly, until thickened."},
      {"stepNumber": 4, "instruction": "Remove from heat, stir in cheese and mustard powder until melted."},
      {"stepNumber": 5, "instruction": "Toss pasta with cheese sauce and serve immediately."}
    ],
    "tags": ["comfort", "vegetarian", "pasta"]
  }$$
),
(
  'Caprese Salad',
  'Simple Italian salad with fresh tomatoes, mozzarella, and basil.',
  ARRAY['italian'],
  ARRAY['vegetarian', 'gluten_free'],
  $${
    "title": "Caprese Salad",
    "servings": 2,
    "cookTimeMinutes": 10,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "ripe tomatoes", "quantity": 3, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "fresh mozzarella", "quantity": 150, "unit": "g", "preparation": "sliced", "isOptional": false},
      {"name": "fresh basil", "quantity": 15, "unit": "leaves", "preparation": null, "isOptional": false},
      {"name": "olive oil", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "balsamic glaze", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": true},
      {"name": "salt", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Alternate slices of tomato and mozzarella on a plate."},
      {"stepNumber": 2, "instruction": "Tuck basil leaves between the slices."},
      {"stepNumber": 3, "instruction": "Drizzle with olive oil, season with salt, and drizzle balsamic glaze if using."}
    ],
    "tags": ["salad", "no_cook", "vegetarian", "gluten_free", "quick"]
  }$$
),
(
  'Avocado Toast',
  'Creamy avocado on toasted sourdough with toppings.',
  ARRAY['american'],
  ARRAY['vegan'],
  $${
    "title": "Avocado Toast",
    "servings": 2,
    "cookTimeMinutes": 10,
    "prepTimeMinutes": 5,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "sourdough bread", "quantity": 2, "unit": "slices", "preparation": null, "isOptional": false},
      {"name": "avocado", "quantity": 1, "unit": null, "preparation": null, "isOptional": false},
      {"name": "lemon juice", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "red pepper flakes", "quantity": 0.25, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "salt", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "everything bagel seasoning", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Toast bread until golden and crispy."},
      {"stepNumber": 2, "instruction": "Mash avocado with lemon juice and salt."},
      {"stepNumber": 3, "instruction": "Spread avocado on toast and top with red pepper flakes and bagel seasoning if using."}
    ],
    "tags": ["breakfast", "vegan", "quick"]
  }$$
),
(
  'Lemon Garlic Chicken',
  'Juicy baked chicken thighs with bright lemon and garlic.',
  ARRAY['mediterranean'],
  ARRAY['gluten_free'],
  $${
    "title": "Lemon Garlic Chicken",
    "servings": 2,
    "cookTimeMinutes": 40,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "chicken thighs", "quantity": 4, "unit": null, "preparation": "bone-in", "isOptional": false},
      {"name": "lemon", "quantity": 1, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "garlic", "quantity": 4, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "olive oil", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "dried oregano", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "salt", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "black pepper", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Preheat oven to 200°C (400°F). Mix olive oil, garlic, oregano, salt, and pepper."},
      {"stepNumber": 2, "instruction": "Coat chicken thighs in the herb mixture."},
      {"stepNumber": 3, "instruction": "Arrange chicken in a baking dish with lemon slices."},
      {"stepNumber": 4, "instruction": "Roast for 35-40 minutes until skin is golden and internal temperature reaches 74°C."}
    ],
    "tags": ["baked", "gluten_free", "meal_prep"]
  }$$
),
(
  'Black Bean Soup',
  'Hearty and spiced black bean soup with a smoky depth of flavor.',
  ARRAY['mexican'],
  ARRAY['vegan', 'gluten_free'],
  $${
    "title": "Black Bean Soup",
    "servings": 2,
    "cookTimeMinutes": 35,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "black beans", "quantity": 800, "unit": "g", "preparation": "canned, drained", "isOptional": false},
      {"name": "onion", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "garlic", "quantity": 3, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "vegetable broth", "quantity": 2, "unit": "cups", "preparation": null, "isOptional": false},
      {"name": "cumin", "quantity": 1.5, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "smoked paprika", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "lime juice", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Sauté onion in oil over medium heat for 5 minutes, then add garlic and spices for 1 minute."},
      {"stepNumber": 2, "instruction": "Add black beans and vegetable broth. Bring to a boil."},
      {"stepNumber": 3, "instruction": "Reduce heat and simmer for 20 minutes."},
      {"stepNumber": 4, "instruction": "Blend about half the soup for a creamy texture, leaving some beans whole."},
      {"stepNumber": 5, "instruction": "Stir in lime juice, adjust seasoning, and serve with toppings of choice."}
    ],
    "tags": ["soup", "vegan", "gluten_free", "meal_prep"]
  }$$
),
(
  'Pancakes',
  'Fluffy buttermilk pancakes perfect for a weekend breakfast.',
  ARRAY['breakfast'],
  ARRAY['vegetarian'],
  $${
    "title": "Pancakes",
    "servings": 2,
    "cookTimeMinutes": 20,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "flour", "quantity": 1.5, "unit": "cups", "preparation": null, "isOptional": false},
      {"name": "buttermilk", "quantity": 1.5, "unit": "cups", "preparation": null, "isOptional": false},
      {"name": "eggs", "quantity": 2, "unit": null, "preparation": null, "isOptional": false},
      {"name": "butter", "quantity": 2, "unit": "tbsp", "preparation": "melted", "isOptional": false},
      {"name": "sugar", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "baking powder", "quantity": 2, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "salt", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Mix flour, sugar, baking powder, and salt in a bowl."},
      {"stepNumber": 2, "instruction": "In another bowl, whisk buttermilk, eggs, and melted butter."},
      {"stepNumber": 3, "instruction": "Combine wet and dry ingredients until just mixed (lumps are fine)."},
      {"stepNumber": 4, "instruction": "Cook 1/4 cup portions on a greased griddle over medium heat until bubbles form, then flip and cook 2 more minutes."}
    ],
    "tags": ["breakfast", "vegetarian", "weekend"]
  }$$
),
(
  'Scrambled Eggs',
  'Perfectly creamy scrambled eggs, the classic breakfast staple.',
  ARRAY['breakfast'],
  ARRAY['vegetarian', 'gluten_free'],
  $${
    "title": "Scrambled Eggs",
    "servings": 2,
    "cookTimeMinutes": 10,
    "prepTimeMinutes": 2,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "eggs", "quantity": 4, "unit": null, "preparation": null, "isOptional": false},
      {"name": "butter", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "heavy cream", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": true},
      {"name": "salt", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "black pepper", "quantity": 0.25, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "chives", "quantity": 1, "unit": "tbsp", "preparation": "chopped", "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Whisk eggs with cream, salt, and pepper."},
      {"stepNumber": 2, "instruction": "Melt butter in a nonstick pan over low heat."},
      {"stepNumber": 3, "instruction": "Add eggs and stir gently and continuously with a spatula, removing from heat occasionally to prevent overcooking."},
      {"stepNumber": 4, "instruction": "Remove from heat while still slightly wet — carry-over heat will finish cooking. Top with chives."}
    ],
    "tags": ["breakfast", "quick", "vegetarian", "gluten_free"]
  }$$
),
(
  'Tomato Basil Soup',
  'Velvety roasted tomato soup with fresh basil.',
  ARRAY['italian'],
  ARRAY['vegan'],
  $${
    "title": "Tomato Basil Soup",
    "servings": 2,
    "cookTimeMinutes": 30,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "canned crushed tomatoes", "quantity": 800, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "onion", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "garlic", "quantity": 3, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "vegetable broth", "quantity": 1, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "fresh basil", "quantity": 0.5, "unit": "cup", "preparation": "packed", "isOptional": false},
      {"name": "olive oil", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "sugar", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Sauté onion and garlic in olive oil until soft, about 5 minutes."},
      {"stepNumber": 2, "instruction": "Add tomatoes, broth, and sugar. Simmer for 20 minutes."},
      {"stepNumber": 3, "instruction": "Add fresh basil and blend with an immersion blender until smooth."},
      {"stepNumber": 4, "instruction": "Adjust seasoning and serve with crusty bread."}
    ],
    "tags": ["soup", "vegan", "comfort"]
  }$$
),
(
  'Veggie Fried Rice',
  'Quick and flavorful vegetable fried rice with soy sauce and sesame.',
  ARRAY['asian'],
  ARRAY['vegetarian'],
  $${
    "title": "Veggie Fried Rice",
    "servings": 2,
    "cookTimeMinutes": 20,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "cooked rice", "quantity": 2, "unit": "cups", "preparation": "cold", "isOptional": false},
      {"name": "eggs", "quantity": 2, "unit": null, "preparation": "beaten", "isOptional": false},
      {"name": "soy sauce", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "frozen mixed vegetables", "quantity": 1.5, "unit": "cups", "preparation": null, "isOptional": false},
      {"name": "garlic", "quantity": 2, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "sesame oil", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "green onions", "quantity": 3, "unit": null, "preparation": "sliced", "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Heat oil in a wok over high heat. Add garlic and stir fry 30 seconds."},
      {"stepNumber": 2, "instruction": "Add frozen vegetables and stir fry until heated through, about 3 minutes."},
      {"stepNumber": 3, "instruction": "Push vegetables to side, scramble eggs in the wok."},
      {"stepNumber": 4, "instruction": "Add cold rice and soy sauce. Stir fry 3-4 minutes, breaking up rice."},
      {"stepNumber": 5, "instruction": "Drizzle sesame oil, toss in green onions, and serve."}
    ],
    "tags": ["rice", "vegetarian", "quick", "leftover_friendly"]
  }$$
),
(
  'Salmon with Roasted Veg',
  'Oven-baked salmon fillet with colorful roasted Mediterranean vegetables.',
  ARRAY['mediterranean'],
  ARRAY['gluten_free'],
  $${
    "title": "Salmon with Roasted Veg",
    "servings": 2,
    "cookTimeMinutes": 30,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "salmon fillets", "quantity": 2, "unit": null, "preparation": null, "isOptional": false},
      {"name": "zucchini", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "cherry tomatoes", "quantity": 1, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "red onion", "quantity": 1, "unit": null, "preparation": "wedged", "isOptional": false},
      {"name": "olive oil", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "lemon", "quantity": 1, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "dried thyme", "quantity": 1, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Preheat oven to 200°C (400°F). Toss vegetables with olive oil, thyme, salt, and pepper."},
      {"stepNumber": 2, "instruction": "Spread vegetables on a baking sheet. Roast for 15 minutes."},
      {"stepNumber": 3, "instruction": "Nestle salmon fillets among vegetables, top with lemon slices."},
      {"stepNumber": 4, "instruction": "Roast another 12-15 minutes until salmon is cooked through."}
    ],
    "tags": ["seafood", "gluten_free", "baked", "healthy"]
  }$$
),
(
  'Caesar Salad',
  'Classic Caesar salad with creamy dressing, croutons, and parmesan.',
  ARRAY['american'],
  ARRAY[]::TEXT[],
  $${
    "title": "Caesar Salad",
    "servings": 2,
    "cookTimeMinutes": 15,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "romaine lettuce", "quantity": 1, "unit": "head", "preparation": "chopped", "isOptional": false},
      {"name": "parmesan cheese", "quantity": 50, "unit": "g", "preparation": "shaved", "isOptional": false},
      {"name": "croutons", "quantity": 1, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "caesar dressing", "quantity": 4, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "lemon juice", "quantity": 1, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "black pepper", "quantity": 0.25, "unit": "tsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Wash and dry romaine lettuce. Tear into bite-size pieces."},
      {"stepNumber": 2, "instruction": "Toss lettuce with Caesar dressing and lemon juice."},
      {"stepNumber": 3, "instruction": "Add croutons and parmesan. Season with black pepper and serve immediately."}
    ],
    "tags": ["salad", "quick", "classic"]
  }$$
),
(
  'French Omelette',
  'Classic French-style folded omelette with herbs and butter.',
  ARRAY['breakfast'],
  ARRAY['vegetarian', 'gluten_free'],
  $${
    "title": "French Omelette",
    "servings": 2,
    "cookTimeMinutes": 10,
    "prepTimeMinutes": 5,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "eggs", "quantity": 6, "unit": null, "preparation": null, "isOptional": false},
      {"name": "butter", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "fresh herbs", "quantity": 2, "unit": "tbsp", "preparation": "chopped (chives, parsley)", "isOptional": false},
      {"name": "salt", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "gruyere cheese", "quantity": 40, "unit": "g", "preparation": "grated", "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Beat eggs vigorously with a fork until completely combined. Season with salt."},
      {"stepNumber": 2, "instruction": "Melt butter in a nonstick pan over medium-high heat until foamy."},
      {"stepNumber": 3, "instruction": "Add eggs and stir quickly with a fork while shaking the pan."},
      {"stepNumber": 4, "instruction": "When eggs are just barely set, add cheese if using, then fold the omelette in thirds and slide onto plate."}
    ],
    "tags": ["breakfast", "quick", "vegetarian", "gluten_free"]
  }$$
),
(
  'Chicken Tikka Masala',
  'Tender chicken in a rich, spiced tomato cream sauce.',
  ARRAY['asian'],
  ARRAY['gluten_free'],
  $${
    "title": "Chicken Tikka Masala",
    "servings": 2,
    "cookTimeMinutes": 45,
    "prepTimeMinutes": 20,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "chicken breast", "quantity": 400, "unit": "g", "preparation": "cubed", "isOptional": false},
      {"name": "canned tomatoes", "quantity": 400, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "heavy cream", "quantity": 0.5, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "onion", "quantity": 1, "unit": null, "preparation": "diced", "isOptional": false},
      {"name": "garlic", "quantity": 3, "unit": "cloves", "preparation": "minced", "isOptional": false},
      {"name": "garam masala", "quantity": 2, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "yogurt", "quantity": 0.5, "unit": "cup", "preparation": null, "isOptional": false},
      {"name": "ginger", "quantity": 1, "unit": "tbsp", "preparation": "grated", "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Marinate chicken in yogurt, half the garam masala, and ginger for at least 15 minutes."},
      {"stepNumber": 2, "instruction": "Cook chicken in a hot pan with oil until charred on outside. Remove and set aside."},
      {"stepNumber": 3, "instruction": "In the same pan, sauté onion and garlic. Add remaining garam masala and cook 2 minutes."},
      {"stepNumber": 4, "instruction": "Add canned tomatoes and simmer 15 minutes. Blend sauce until smooth."},
      {"stepNumber": 5, "instruction": "Return chicken to sauce, add cream, and simmer 10 more minutes. Serve with rice or naan."}
    ],
    "tags": ["curry", "gluten_free", "indian"]
  }$$
),
(
  'Pasta Puttanesca',
  'Bold and briny pasta with olives, capers, anchovies, and tomatoes.',
  ARRAY['italian'],
  ARRAY['vegan'],
  $${
    "title": "Pasta Puttanesca",
    "servings": 2,
    "cookTimeMinutes": 25,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "spaghetti", "quantity": 200, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "canned tomatoes", "quantity": 400, "unit": "g", "preparation": null, "isOptional": false},
      {"name": "kalamata olives", "quantity": 0.5, "unit": "cup", "preparation": "pitted", "isOptional": false},
      {"name": "capers", "quantity": 2, "unit": "tbsp", "preparation": null, "isOptional": false},
      {"name": "garlic", "quantity": 3, "unit": "cloves", "preparation": "sliced", "isOptional": false},
      {"name": "red pepper flakes", "quantity": 0.5, "unit": "tsp", "preparation": null, "isOptional": false},
      {"name": "olive oil", "quantity": 3, "unit": "tbsp", "preparation": null, "isOptional": false}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Cook spaghetti in salted boiling water until al dente. Reserve pasta water."},
      {"stepNumber": 2, "instruction": "Heat olive oil in a pan, sauté garlic and red pepper flakes for 1 minute."},
      {"stepNumber": 3, "instruction": "Add tomatoes, olives, and capers. Simmer for 15 minutes."},
      {"stepNumber": 4, "instruction": "Toss cooked pasta with the sauce, adding pasta water to loosen if needed."}
    ],
    "tags": ["pasta", "vegan", "pantry_meal"]
  }$$
),
(
  'Quesadillas',
  'Crispy flour tortillas filled with melted cheese and vegetables.',
  ARRAY['mexican'],
  ARRAY['vegetarian'],
  $${
    "title": "Quesadillas",
    "servings": 2,
    "cookTimeMinutes": 20,
    "prepTimeMinutes": 10,
    "sourceText": "Four Fs Catalog",
    "ingredients": [
      {"name": "flour tortillas", "quantity": 4, "unit": "large", "preparation": null, "isOptional": false},
      {"name": "cheddar cheese", "quantity": 150, "unit": "g", "preparation": "grated", "isOptional": false},
      {"name": "bell pepper", "quantity": 1, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "onion", "quantity": 0.5, "unit": null, "preparation": "sliced", "isOptional": false},
      {"name": "black beans", "quantity": 0.5, "unit": "cup", "preparation": "drained", "isOptional": false},
      {"name": "sour cream", "quantity": 4, "unit": "tbsp", "preparation": null, "isOptional": true},
      {"name": "salsa", "quantity": 4, "unit": "tbsp", "preparation": null, "isOptional": true}
    ],
    "steps": [
      {"stepNumber": 1, "instruction": "Sauté bell pepper and onion in a pan until soft, about 5 minutes."},
      {"stepNumber": 2, "instruction": "Place a tortilla in a clean pan over medium heat. Top half with cheese, vegetables, and beans."},
      {"stepNumber": 3, "instruction": "Fold tortilla in half and cook 2-3 minutes per side until golden and cheese is melted."},
      {"stepNumber": 4, "instruction": "Slice into wedges and serve with sour cream and salsa."}
    ],
    "tags": ["quick", "vegetarian", "mexican"]
  }$$
);
