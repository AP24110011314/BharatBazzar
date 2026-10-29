-- ============================================================
--  Seed Data — BharatBazzar Handcraft & Artisan Store
--  Theme: Earthy & Natural
-- ============================================================
USE shopdb;

-- --------------------------------------------------------
-- Users  (passwords are bcrypt hashes of 'password123')
-- --------------------------------------------------------
INSERT INTO Users (name, email, password, phone, role) VALUES
  ('Alice Johnson',   'alice@example.com', '$2a$10$qyVJornbqFIiUQ68ekg6LeWMc7ntmjZ4dW/KYQc12qIfCx4erXT6a', '9876543210', 'customer'),
  ('Bob Smith',       'bob@example.com',   '$2a$10$qyVJornbqFIiUQ68ekg6LeWMc7ntmjZ4dW/KYQc12qIfCx4erXT6a', '9123456780', 'customer'),
  ('Admin User',      'admin@shop.com',    '$2a$10$qyVJornbqFIiUQ68ekg6LeWMc7ntmjZ4dW/KYQc12qIfCx4erXT6a', '9000000001', 'admin');

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
   'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=600&q=80',
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
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
   'Vana Herbals', 1),

  -- More Woodcraft
  (4, 'Hand-Carved Sheesham Wood Incense Holder',
   'Intricately carved sheesham (Indian rosewood) incense stand with ash-catcher tray. Holds standard agarbatti sticks.',
   849.00,
   'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600&q=80',
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
   'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80',
   'Knotted Stories', 1),

  (1, 'Hand-Painted Blue Pottery Vase',
   'Handmade in Jaipur using traditional quartz powder, fullers earth, and natural mineral dyes. Delicate Persian floral patterns with a lustrous glaze.',
   2299.00,
   'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80',
   'Jaipur Craft Guild', 1),

  (1, 'Ceramic Pour-Over Coffee Dripper',
   'Wheel-thrown ceramic cone with spiral interior extraction ribs. Retains heat perfectly for a clean, rich artisanal pour-over brew.',
   1199.00,
   'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=80',
   'Mitti Kala', 1),

  (1, 'Terracotta Water Carafe with Tumbler',
   'Unadulterated local red clay carafe with nesting drinking cup. Naturally chills water through micro-porous evaporative cooling, infusing an earthy scent.',
   999.00,
   'https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=600&q=80',
   'Mitti Kala', 1),

  (1, 'Speckled Ceramic Ramen Bowl Set',
   'Deep stoneware soup bowl with carved chopstick notch and matching handmade wooden spoons. Matte speckled iron finish.',
   1449.00,
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
   'Earth & Fire Studio', 1),

  (2, 'Kashmiri Cashmere Weave Shawl',
   'Spun from ultra-fine Himalayan mountain wool on traditional wooden looms. Featherlight, incredibly insulating, edged with subtle needlework.',
   6499.00,
   'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&q=80',
   'Rangrez House', 1),

  (2, 'Kalamkari Hand-Painted Cushion Covers (Set of 2)',
   'Drawn freehand using bamboo reed pens and organic vegetable dyes on heavy organic cotton. Intricate heritage mythological flora and fauna motifs.',
   1399.00,
   'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
   'Rangrez House', 1),

  (2, 'Handspun Khadi Cotton Lounge Robe',
   '100% handspun and hand-loomed khadi cotton kimono robe with belt tie. Gets softer with every wash, naturally breathable in all seasons.',
   2199.00,
   'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80',
   'Lokal Weaves', 1),

  (2, 'Indigo Dabu Mud-Resist Throw Pillow',
   'Traditional mud-resist block printing from Akola, dipped multiple times in deep natural fermented indigo vats. 45 x 45 cm.',
   899.00,
   'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
   'Lokal Weaves', 1),

  (3, 'Saffron & Kumkumadi Glow Elixir',
   'Classical Ayurvedic formulation with Grade A Kashmiri saffron stamen, sandalwood, and goat milk extract. Restores radiant skin luminosity.',
   1499.00,
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
   'Vana Herbals', 1),

  (3, 'Ayurvedic Bronze Kansa Facial Wand',
   'Hand-cast bell metal bronze dome with carved teak handle. Balances skin pH, detoxifies tissues, and relieves facial muscle tension.',
   1299.00,
   'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
   'Vana Herbals', 1),

  (3, 'Wild Forest Honey & Walnut Exfoliator',
   'Raw unprocessed honey harvested by indigenous forest gatherers blended with crushed walnut shells and cold-pressed sweet almond oil.',
   549.00,
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
   'Vana Herbals', 1),

  (3, 'Vetiver Root Steam-Distilled Mist',
   'Pure hydrosol steam-distilled from freshly harvested South Indian khus vetiver roots. Calms redness, tightens pores, and grounds the senses.',
   499.00,
   'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&q=80',
   'Vana Herbals', 1),

  (4, 'Walnut Wood Sculpted Desk Organizer',
   'Carved from a single piece of seasoned walnut wood. Features dedicated angled smartphone slot, pen grooves, and brass-lined paperclip catch.',
   1699.00,
   'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80',
   'Kaam Woodcraft', 1),

  (4, 'Channapatna Lacquer Wood Coaster Set',
   'Set of 6 turned wood coasters crafted by GI-tagged Channapatna artisans using non-toxic tree resin lacquers and turmeric dyes.',
   849.00,
   'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&q=80',
   'Kaam Woodcraft', 1),

  (4, 'Solid Teak Wood Mortar and Pestle',
   'Dense, high-oil reclaim teak wood hand-hollowed for pounding peppercorns, garlic, ginger, and coarse spices without absorbing odors.',
   1349.00,
   'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&q=80',
   'Kaam Woodcraft', 1),

  (4, 'Carved Sheesham Wood Book Stand',
   'Foldable rehal-style book holder carved with traditional jali lattice patterns. Ideal for holding cookbooks, tablets, or novels.',
   1099.00,
   'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
   'Kaam Woodcraft', 1),

  (5, 'Brass Urli Jasmine & Marigold Candle',
   'Poured into an authentic hammered brass urli bowl with three cotton wicks. Floated with real dried marigold petals and mogra essential oils.',
   1799.00,
   'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80',
   'Diya Atelier', 1),

  (5, 'Cedarwood & Frankincense Wood-Wick Candle',
   'Soy wax poured into a matte ceramic tumbler featuring an FSC-certified organic wood wick that gently crackles like an open fireplace.',
   949.00,
   'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?w=600&q=80',
   'Diya Atelier', 1),

  (5, 'Temple Mogra & Camphor Incense Cones',
   'Box of 30 charcoal-free cones made from recycled sacred temple flowers and natural resins. Includes a miniature terracotta burning plate.',
   449.00,
   'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&q=80',
   'Diya Atelier', 1),

  (6, 'Lost-Wax Brass Dhokra Wind Chime',
   '4000-year-old metallurgical Dhokra craft from Bastar. Bell chimes produce a melodious harmonic pitch in the gentlest breeze.',
   1899.00,
   'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
   'Knotted Stories', 1),

  (6, 'Handwoven Sabai Grass Placemats (Set of 4)',
   'Woven by women artisans in Mayurbhanj using sturdy wild sabai grass. Heat-resistant, wipeable, and eco-friendly dining essentials.',
   1149.00,
   'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=80',
   'Knotted Stories', 1),

  (6, 'Moon Phase Macramé Mirror',
   '25 cm circular optical glass mirror encircled by intricate hand-knotted cotton fringes representing lunar crescent phases.',
   1649.00,
   'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
   'Knotted Stories', 1),

  -- Authentic Handicraft Goods (Products 45 to 60)
  (4, 'Peacock Brass Diya Oil Lamp',
   'Solid brass handcrafted oil lamp with intricate peacock carving and deep oil reservoir. Radiates traditional heritage charm.',
   1899.00,
   'https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&q=80',
   'Kaam Woodcraft', 1),

  (6, 'Madhubani Hand-Painted Folk Art Frame',
   'Authentic Mithila folk painting executed with natural dyes and nibs on handmade paper, framed in seasoned teakwood.',
   2499.00,
   'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80',
   'Knotted Stories', 1),

  (2, 'Chikankari Hand-Embroidered Kurta',
   'Lucknowi Chikankari shadow-work embroidered by master artisans on breathable pure fine mulmul cotton.',
   2899.00,
   'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
   'Rangrez House', 1),

  (4, 'Hammered Pure Copper Water Dispenser',
   'Hand-hammered 99.8% pure copper matka dispenser with brass spigot. Natural Ayurvedic oligodynamic water purification.',
   3299.00,
   'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&q=80',
   'Kaam Woodcraft', 1),

  (1, 'Warli Tribal Motif Terracotta Vase',
   'Earthy terracotta earthenware hand-painted with iconic Warli tribal harvest celebration scenes using white rice paste pigment.',
   1249.00,
   'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&q=80',
   'Mitti Kala', 1),

  (4, 'Kashmiri Carved Walnut Jewellery Box',
   'Single-piece Kashmiri walnut wood with deeply carved chinar leaf motifs, hidden sliding latch, and velvet-lined interior compartments.',
   2799.00,
   'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
   'Kaam Woodcraft', 1),

  (4, 'Hand-Carved Mysore Sandalwood Figurine',
   'Subtly fragrant Mysore sandalwood carved with traditional royal elephant motifs. Naturally retains warm soothing aroma for years.',
   3499.00,
   'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=600&q=80',
   'Kaam Woodcraft', 1),

  (4, 'Hammered Brass Thali Dining Set',
   'Traditional 6-piece royal dining set in pure solid hammered brass including thali plate, bowls, tumbler, and dessert dish.',
   3999.00,
   'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
   'Kaam Woodcraft', 1),

  (6, 'Tanjore 22K Gold Foil Framed Painting',
   'Classical South Indian Tanjore relief artwork adorned with 22-karat genuine gold foil leaf and semi-precious Jaipur stones in dark teak frame.',
   5499.00,
   'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600&q=80',
   'Knotted Stories', 1),

  (2, 'Hand-Loomed Sambalpuri Ikat Silk Stole',
   'Tie-dyed warp and weft double Ikat woven by master weavers from Odisha in raw mulberry silk with lustrous dual sheen.',
   2199.00,
   'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80',
   'Lokal Weaves', 1),

  (6, 'Agra Pietra Dura Marble Inlay Coasters',
   'White Makrana marble inlaid by descendants of Taj Mahal artisans using semi-precious lapis lazuli, malachite, and carnelian (Set of 4).',
   1999.00,
   'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80',
   'Knotted Stories', 1),

  (5, 'Handcrafted Khus Vetiver Root Hanging',
   'Woven wild vetiver (khus) root hanging. Spray with cold water to unleash earthy forest coolness and natural room fragrance.',
   749.00,
   'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
   'Diya Atelier', 1),

  (4, 'Dokra Tribal Musician Ensemble (Set of 3)',
   'Ancient lost-wax cast brass miniature statues of tribal folk musicians playing traditional dholak, shehnai, and bansuri flute.',
   2299.00,
   'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
   'Kaam Woodcraft', 1),

  (3, 'Desi Cow Ghee & Kannauj Rose Bathing Bar',
   'Slow-cured cold process soap enriched with grass-fed A2 Gir cow ghee and pure steam-distilled Kannauj damask rose absolute.',
   399.00,
   'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&q=80',
   'Vana Herbals', 1),

  (6, 'Handwoven Assam Golden Cane Picnic Basket',
   'Crafted from sustainable Assam river cane and treated split bamboo with double-hinged lid and reinforced vegan leather straps.',
   1799.00,
   'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80',
   'Knotted Stories', 1),

  (4, 'Himalayan Hand-Beaten Singing Bowl & Mallet',
   'Seven-metal alloy bowl hand-beaten in the foothills of Himachal. Emits long-sustaining 432 Hz therapeutic vibration; includes wooden striker.',
   2699.00,
   'https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=600&q=80',
   'Kaam Woodcraft', 1);

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
  (22, 30),   -- Woven Seagrass Storage Basket
  (23, 24),   -- Hand-Painted Blue Pottery Vase
  (24, 35),   -- Ceramic Pour-Over Coffee Dripper
  (25, 40),   -- Terracotta Water Carafe
  (26, 28),   -- Speckled Ceramic Ramen Bowl Set
  (27, 12),   -- Kashmiri Cashmere Shawl
  (28, 30),   -- Kalamkari Cushion Covers
  (29, 20),   -- Khadi Cotton Robe
  (30, 45),   -- Indigo Dabu Throw Pillow
  (31, 55),   -- Saffron Kumkumadi Elixir
  (32, 35),   -- Bronze Kansa Wand
  (33, 65),   -- Honey Walnut Exfoliator
  (34, 80),   -- Vetiver Root Mist
  (35, 25),   -- Walnut Desk Organizer
  (36, 40),   -- Channapatna Coasters
  (37, 30),   -- Teak Mortar and Pestle
  (38, 22),   -- Sheesham Book Stand
  (39, 18),   -- Brass Urli Candle
  (40, 45),   -- Cedarwood Wood-Wick Candle
  (41, 75),   -- Temple Mogra Incense
  (42, 16),   -- Brass Dhokra Wind Chime
  (43, 32),   -- Sabai Grass Placemats
  (44, 20),   -- Moon Phase Mirror
  (45, 24),   -- Peacock Brass Diya Oil Lamp
  (46, 18),   -- Madhubani Folk Art Frame
  (47, 30),   -- Chikankari Kurta
  (48, 15),   -- Hammered Copper Dispenser
  (49, 35),   -- Warli Terracotta Vase
  (50, 20),   -- Kashmiri Walnut Jewellery Box
  (51, 12),   -- Sandalwood Figurine
  (52, 16),   -- Hammered Brass Thali Set
  (53,  8),   -- Tanjore Gold Painting
  (54, 25),   -- Sambalpuri Ikat Silk Stole
  (55, 22),   -- Agra Marble Inlay Coasters
  (56, 50),   -- Khus Vetiver Hanging
  (57, 14),   -- Dokra Musician Ensemble
  (58, 95),   -- Desi Ghee & Rose Soap
  (59, 20),   -- Assam Cane Picnic Basket
  (60, 15);   -- Singing Bowl & Mallet

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
