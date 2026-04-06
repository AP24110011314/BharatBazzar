-- ============================================================
--  Seed Data — BharatBazzar Handcraft & Artisan Store
--  Theme: Earthy & Natural
-- ============================================================
USE shopdb;

-- --------------------------------------------------------
-- Users  (passwords are bcrypt hashes of 'password123')
-- --------------------------------------------------------
INSERT INTO Users (name, email, password, phone, role) VALUES
  ('Alice Johnson',   'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy1', '9876543210', 'customer'),
  ('Bob Smith',       'bob@example.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy1', '9123456780', 'customer'),
  ('Admin User',      'admin@shop.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy1', '9000000001', 'admin');

-- --------------------------------------------------------
-- Addresses
-- --------------------------------------------------------
INSERT INTO Addresses (user_id, label, street, city, state, zip, country, is_default) VALUES
  (1, 'Home',   '12 MG Road',          'Bengaluru', 'Karnataka', '560001', 'India', 1),
  (2, 'Home',   '45 Park Street',       'Kolkata',   'West Bengal','700016','India', 1),
  (2, 'Studio', '78 Anna Salai',        'Chennai',   'Tamil Nadu', '600002','India', 0);

-- --------------------------------------------------------
-- Categories  (handcraft-themed)
-- --------------------------------------------------------
INSERT INTO Categories (name, description, parent_id) VALUES
  ('Pottery & Ceramics', 'Handthrown clay pots, mugs, and bowls', NULL),
  ('Handwoven Textiles', 'Block-printed fabrics, rugs, and hand-loomed cloth', NULL),
  ('Natural Skincare',   'Herb-infused oils, soaps, and balms', NULL),
  ('Woodcraft',          'Hand-carved and turned wooden homewares', NULL),
  ('Candles & Wax',      'Soy, beeswax, and botanical candles', 1),
  ('Macramé & Fibre',    'Hand-knotted wall art, plant hangers, and baskets', 2);

-- --------------------------------------------------------
-- Products  (artisan & handcraft)
-- --------------------------------------------------------
INSERT INTO Products (category_id, name, description, price, image_url, brand, is_active) VALUES
  -- Pottery & Ceramics
  (1, 'Terracotta Clay Mug',
   'Handthrown on the wheel from local red clay, food-safe glaze inside. Each piece uniquely shaped by the artisan.',
   849.00,
   'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
   'Mitti Kala', 1),

  (1, 'Stoneware Spice Jar Set',
   'Set of 4 hand-thrown stoneware jars with cork lids. Perfect for storing spices, seeds, or dried herbs.',
   1599.00,
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80',
   'Mitti Kala', 1),

  (1, 'Handmade Ceramic Salad Bowl',
   'Large serving bowl with a natural ash glaze. Oven, microwave, and dishwasher safe.',
   2199.00,
   'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80',
   'Earth & Fire Studio', 1),

  -- Handwoven Textiles
  (2, 'Block-Printed Linen Tablecloth',
   'Hand block-printed in Jaipur using natural indigo dye on 100% linen. Fits a 6-seater table.',
   2499.00,
   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
   'Rangrez House', 1),

  (2, 'Hand-Loomed Jute Rug',
   'Naturally dyed jute rug, hand-loomed by artisans in West Bengal. 120 × 180 cm.',
   3799.00,
   'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
   'Lokal Weaves', 1),

  (6, 'Macramé Wall Hanging',
   'Hand-knotted from unbleached cotton rope. Boho-style statement piece — 40 cm wide, 90 cm drop.',
   1299.00,
   'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&q=80',
   'Knotted Stories', 1),

  -- Natural Skincare
  (3, 'Cold-Pressed Rosehip Face Oil',
   'Pure, unrefined rosehip seed oil cold-pressed in small batches. Brightens skin and fades scars. 30 ml glass dropper bottle.',
   899.00,
   'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80',
   'Vana Herbals', 1),

  (3, 'Artisan Charcoal Soap Bar',
   'Made with activated bamboo charcoal, shea butter, and tea tree oil. Deep-cleansing, zero-waste packaging.',
   349.00,
   'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
   'Vana Herbals', 1),

  -- Woodcraft
  (4, 'Hand-Carved Mango Wood Serving Board',
   'Solid mango wood, hand-carved and finished with food-safe beeswax. Perfect for bread, cheese, or fruit platters.',
   1799.00,
   'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=600&q=80',
   'Kaam Woodcraft', 1),

  (4, 'Turned Neem Wood Salad Servers',
   'Pair of hand-turned neem wood servers. Naturally antibacterial, smooth satin finish.',
   699.00,
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
   'Kaam Woodcraft', 1),

  -- Candles & Wax
  (5, 'Soy & Beeswax Botanical Candle',
   'Poured in small batches with 100% soy & beeswax blend. Infused with dried lavender flowers and essential oils. 200g.',
   699.00,
   'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=600&q=80',
   'Diya Atelier', 1),

  (5, 'Sage & Sandalwood Pillar Candle',
   'Hand-poured unbleached beeswax pillar candle. Scented with pure sage and sandalwood essential oils. Burns 60+ hours.',
   1199.00,
   'https://images.unsplash.com/photo-1603905830550-ae55cfe9c6ee?w=600&q=80',
   'Diya Atelier', 1),

  -- More Pottery & Ceramics
  (1, 'Indigo Blue Ceramic Planter',
   'Hand-thrown ceramic planter with a rich indigo glaze and drainage hole. Ideal for succulents or small ferns. 15 cm diameter.',
   1349.00,
   'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80',
   'Earth & Fire Studio', 1),

  (1, 'Raku-Fired Tea Cup Set',
   'Set of 2 Japanese-inspired raku-fired cups. Each cup is unique with crackle glaze in earthy tones. Perfect for tea ceremonies.',
   1899.00,
   'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80',
   'Mitti Kala', 1),

  -- More Handwoven Textiles
  (2, 'Ajrakh Block-Print Cotton Stole',
   'Hand block-printed stole using traditional Ajrakh motifs on soft handspun cotton. 200 x 70 cm. Natural indigo and madder dyes.',
   1149.00,
   'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=600&q=80',
   'Rangrez House', 1),

  (2, 'Hand-Knitted Wool Throw Blanket',
   'Chunky hand-knitted throw in undyed natural wool. 130 x 180 cm — drapes beautifully over sofas.',
   4599.00,
   'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&q=80',
   'Lokal Weaves', 1),

  -- More Natural Skincare
  (3, 'Turmeric & Neem Face Mask Powder',
   'Blend of wild turmeric, neem leaf, and kaolin clay. Mix with rose water for a brightening mask. 60g resealable pouch.',
   449.00,
   'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=80',
   'Vana Herbals', 1),

  (3, 'Whipped Shea & Kokum Body Butter',
   'Rich body butter whipped with raw shea, kokum, and mango butter. Deeply moisturising, melts on contact. 150g glass jar.',
   699.00,
   'https://images.unsplash.com/photo-1556228452-8c6b5745a7b0?w=600&q=80',
   'Vana Herbals', 1),

  -- More Woodcraft
  (4, 'Hand-Carved Sheesham Wood Incense Holder',
   'Intricately carved sheesham (Indian rosewood) incense stand with ash-catcher tray. Holds standard agarbatti sticks.',
   849.00,
   'https://images.unsplash.com/photo-1608181831718-1d9d3ee1e2c0?w=600&q=80',
   'Kaam Woodcraft', 1),

  -- More Candles & Wax
  (5, 'Rose & Geranium Beeswax Taper Candles',
   'Pair of hand-dipped beeswax taper candles, scented with rose absolute and geranium. Burn time ~8 hours each. 25 cm tall.',
   599.00,
   'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=80',
   'Diya Atelier', 1),

  -- More Macrame & Fibre
  (6, 'Macrame Plant Hanger Set of 2',
   'Pair of hand-knotted cotton macrame plant hangers. Holds up to 20 cm pots. Adjustable loops at top. Natural and ivory finish.',
   799.00,
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
   'Knotted Stories', 1),

  (6, 'Woven Seagrass Storage Basket',
   'Handwoven seagrass basket with braided leather handles. Multi-purpose — great for blankets, toys, or laundry. 35 x 30 cm.',
   1499.00,
   'https://images.unsplash.com/photo-1595418518533-91bcd4c2a0df?w=600&q=80',
   'Knotted Stories', 1);

-- --------------------------------------------------------
-- Inventory  (quantity in stock)
-- --------------------------------------------------------
INSERT INTO Inventory (product_id, quantity) VALUES
  (1,  45),   -- Terracotta Clay Mug
  (2,  30),   -- Stoneware Spice Jar Set
  (3,  20),   -- Ceramic Salad Bowl
  (4,  35),   -- Block-Printed Tablecloth
  (5,  18),   -- Hand-Loomed Jute Rug
  (6,  50),   -- Macramé Wall Hanging
  (7,  80),   -- Rosehip Face Oil
  (8, 120),   -- Charcoal Soap Bar
  (9,  25),   -- Mango Wood Serving Board
  (10, 40),   -- Neem Wood Salad Servers
  (11, 60),   -- Soy Beeswax Botanical Candle
  (12, 35),   -- Sage & Sandalwood Pillar Candle
  (13, 28),   -- Indigo Blue Ceramic Planter
  (14, 22),   -- Raku-Fired Tea Cup Set
  (15, 55),   -- Ajrakh Block-Print Cotton Stole
  (16, 15),   -- Hand-Knitted Wool Throw Blanket
  (17, 90),   -- Turmeric & Neem Face Mask Powder
  (18, 70),   -- Whipped Shea & Kokum Body Butter
  (19, 32),   -- Sheesham Wood Incense Holder
  (20, 48),   -- Rose & Geranium Beeswax Taper Candles
  (21, 65),   -- Macrame Plant Hanger Set of 2
  (22, 30);   -- Woven Seagrass Storage Basket

-- --------------------------------------------------------
-- Coupons
-- --------------------------------------------------------
INSERT INTO Coupons (code, discount_type, discount_value, min_order_amt, max_uses, is_active) VALUES
  ('EARTHY10',  'percent', 10.00,  500.00,  50, 1),
  ('CRAFT500',  'flat',   500.00, 3000.00,  20, 1),
  ('WELCOME15', 'percent', 15.00, 1000.00, 100, 1);

-- --------------------------------------------------------
-- Sample Reviews
-- --------------------------------------------------------
INSERT INTO Reviews (product_id, user_id, rating, title, body) VALUES
  (1, 1, 5, 'Absolutely love this mug!',       'The weight, the texture — it feels so alive in your hands. My morning chai tastes better in it.'),
  (7, 2, 5, 'Best face oil I have ever used',  'After just two weeks my skin looks visibly brighter. Worth every rupee. Minimal, clean packaging too.'),
  (6, 1, 4, 'Beautiful wall piece',             'Looks stunning above the sofa. Shipped safely and arrived perfectly. Slight knot imperfection but that is the charm.'),
  (9, 2, 5, 'Heirloom quality',                'Heavy, smooth, and beautifully finished. We use it every day. Mango wood grain is stunning.');
