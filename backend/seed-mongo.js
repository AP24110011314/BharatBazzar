const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Address = require('./models/Address');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Coupon = require('./models/Coupon');
const Review = require('./models/Review');
const Wishlist = require('./models/Wishlist');
const { Counter } = require('./models/Counter');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI is missing in .env file!');
  process.exit(1);
}

const dbName = process.env.DB_NAME || 'shopdb';

async function seedData() {
  console.log(`📡 Connecting to MongoDB Atlas (${dbName})...`);
  await mongoose.connect(uri, { dbName });
  console.log('✅ Connected to MongoDB Atlas.');

  console.log('🧹 Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Address.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({}),
    Counter.deleteMany({})
  ]);

  console.log('🌱 Seeding Users...');
  const users = [
    {
      user_id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: '$2a$10$qyVJornbqFIiUQ68ekg6LeWMc7ntmjZ4dW/KYQc12qIfCx4erXT6a', // password123
      phone: '9876543210',
      role: 'customer'
    },
    {
      user_id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: '$2a$10$qyVJornbqFIiUQ68ekg6LeWMc7ntmjZ4dW/KYQc12qIfCx4erXT6a', // password123
      phone: '9123456780',
      role: 'customer'
    },
    {
      user_id: 3,
      name: 'Admin User',
      email: 'admin@shop.com',
      password: '$2a$10$qyVJornbqFIiUQ68ekg6LeWMc7ntmjZ4dW/KYQc12qIfCx4erXT6a', // password123
      phone: '9000000001',
      role: 'admin'
    }
  ];
  await User.insertMany(users);

  console.log('🌱 Seeding Addresses...');
  const addresses = [
    { address_id: 1, user_id: 1, label: 'Home', street: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', zip: '560001', country: 'India', is_default: true },
    { address_id: 2, user_id: 2, label: 'Home', street: '45 Park Street', city: 'Kolkata', state: 'West Bengal', zip: '700016', country: 'India', is_default: true },
    { address_id: 3, user_id: 2, label: 'Studio', street: '78 Anna Salai', city: 'Chennai', state: 'Tamil Nadu', zip: '600002', country: 'India', is_default: false }
  ];
  await Address.insertMany(addresses);

  console.log('🌱 Seeding Categories...');
  const categories = [
    { category_id: 1, name: 'Pottery & Ceramics', description: 'Handthrown clay pots, mugs, and bowls', parent_id: null },
    { category_id: 2, name: 'Handwoven Textiles', description: 'Block-printed fabrics, rugs, and hand-loomed cloth', parent_id: null },
    { category_id: 3, name: 'Natural Skincare', description: 'Herb-infused oils, soaps, and balms', parent_id: null },
    { category_id: 4, name: 'Woodcraft', description: 'Hand-carved and turned wooden homewares', parent_id: null },
    { category_id: 5, name: 'Candles & Wax', description: 'Soy, beeswax, and botanical candles', parent_id: 1 },
    { category_id: 6, name: 'Macramé & Fibre', description: 'Hand-knotted wall art, plant hangers, and baskets', parent_id: 2 }
  ];
  await Category.insertMany(categories);

  console.log('🌱 Seeding Products...');
  const products = [
    {
      product_id: 1,
      category_id: 1,
      name: 'Terracotta Clay Mug',
      description: 'Handthrown on the wheel from local red clay, food-safe glaze inside. Each piece uniquely shaped by the artisan.',
      price: 849.00,
      image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
      brand: 'Mitti Kala',
      is_active: true
    },
    {
      product_id: 2,
      category_id: 1,
      name: 'Stoneware Spice Jar Set',
      description: 'Set of 4 hand-thrown stoneware jars with cork lids. Perfect for storing spices, seeds, or dried herbs.',
      price: 1599.00,
      image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80',
      brand: 'Mitti Kala',
      is_active: true
    },
    {
      product_id: 3,
      category_id: 1,
      name: 'Handmade Ceramic Salad Bowl',
      description: 'Large serving bowl with a natural ash glaze. Oven, microwave, and dishwasher safe.',
      price: 2199.00,
      image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80',
      brand: 'Earth & Fire Studio',
      is_active: true
    },
    {
      product_id: 4,
      category_id: 2,
      name: 'Block-Printed Linen Tablecloth',
      description: 'Hand block-printed in Jaipur using natural indigo dye on 100% linen. Fits a 6-seater table.',
      price: 2499.00,
      image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
      brand: 'Rangrez House',
      is_active: true
    },
    {
      product_id: 5,
      category_id: 2,
      name: 'Hand-Loomed Jute Rug',
      description: 'Naturally dyed jute rug, hand-loomed by artisans in West Bengal. 120 × 180 cm.',
      price: 3799.00,
      image_url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
      brand: 'Lokal Weaves',
      is_active: true
    },
    {
      product_id: 6,
      category_id: 6,
      name: 'Macramé Wall Hanging',
      description: 'Hand-knotted from unbleached cotton rope. Boho-style statement piece — 40 cm wide, 90 cm drop.',
      price: 1299.00,
      image_url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 7,
      category_id: 3,
      name: 'Cold-Pressed Rosehip Face Oil',
      description: 'Pure, unrefined rosehip seed oil cold-pressed in small batches. Brightens skin and fades scars. 30 ml glass dropper bottle.',
      price: 899.00,
      image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 8,
      category_id: 3,
      name: 'Artisan Charcoal Soap Bar',
      description: 'Made with activated bamboo charcoal, shea butter, and tea tree oil. Deep-cleansing, zero-waste packaging.',
      price: 349.00,
      image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 9,
      category_id: 4,
      name: 'Hand-Carved Mango Wood Serving Board',
      description: 'Solid mango wood, hand-carved and finished with food-safe beeswax. Perfect for bread, cheese, or fruit platters.',
      price: 1799.00,
      image_url: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 10,
      category_id: 4,
      name: 'Turned Neem Wood Salad Servers',
      description: 'Pair of hand-turned neem wood servers. Naturally antibacterial, smooth satin finish.',
      price: 699.00,
      image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 11,
      category_id: 5,
      name: 'Soy & Beeswax Botanical Candle',
      description: 'Poured in small batches with 100% soy & beeswax blend. Infused with dried lavender flowers and essential oils. 200g.',
      price: 699.00,
      image_url: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 12,
      category_id: 5,
      name: 'Sage & Sandalwood Pillar Candle',
      description: 'Hand-poured unbleached beeswax pillar candle. Scented with pure sage and sandalwood essential oils. Burns 60+ hours.',
      price: 1199.00,
      image_url: 'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 13,
      category_id: 1,
      name: 'Indigo Blue Ceramic Planter',
      description: 'Hand-thrown ceramic planter with a rich indigo glaze and drainage hole. Ideal for succulents or small ferns. 15 cm diameter.',
      price: 1349.00,
      image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80',
      brand: 'Earth & Fire Studio',
      is_active: true
    },
    {
      product_id: 14,
      category_id: 1,
      name: 'Raku-Fired Tea Cup Set',
      description: 'Set of 2 Japanese-inspired raku-fired cups. Each cup is unique with crackle glaze in earthy tones. Perfect for tea ceremonies.',
      price: 1899.00,
      image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80',
      brand: 'Mitti Kala',
      is_active: true
    },
    {
      product_id: 15,
      category_id: 2,
      name: 'Ajrakh Block-Print Cotton Stole',
      description: 'Hand block-printed stole using traditional Ajrakh motifs on soft handspun cotton. 200 x 70 cm. Natural indigo and madder dyes.',
      price: 1149.00,
      image_url: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=600&q=80',
      brand: 'Rangrez House',
      is_active: true
    },
    {
      product_id: 16,
      category_id: 2,
      name: 'Hand-Knitted Wool Throw Blanket',
      description: 'Chunky hand-knitted throw in undyed natural wool. 130 x 180 cm — drapes beautifully over sofas.',
      price: 4599.00,
      image_url: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&q=80',
      brand: 'Lokal Weaves',
      is_active: true
    },
    {
      product_id: 17,
      category_id: 3,
      name: 'Turmeric & Neem Face Mask Powder',
      description: 'Blend of wild turmeric, neem leaf, and kaolin clay. Mix with rose water for a brightening mask. 60g resealable pouch.',
      price: 449.00,
      image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 18,
      category_id: 3,
      name: 'Whipped Shea & Kokum Body Butter',
      description: 'Rich body butter whipped with raw shea, kokum, and mango butter. Deeply moisturising, melts on contact. 150g glass jar.',
      price: 699.00,
      image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 19,
      category_id: 4,
      name: 'Hand-Carved Sheesham Wood Incense Holder',
      description: 'Intricately carved sheesham (Indian rosewood) incense stand with ash-catcher tray. Holds standard agarbatti sticks.',
      price: 849.00,
      image_url: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 20,
      category_id: 5,
      name: 'Rose & Geranium Beeswax Taper Candles',
      description: 'Pair of hand-dipped beeswax taper candles, scented with rose absolute and geranium. Burn time ~8 hours each. 25 cm tall.',
      price: 599.00,
      image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 21,
      category_id: 6,
      name: 'Macrame Plant Hanger Set of 2',
      description: 'Pair of hand-knotted cotton macrame plant hangers. Holds up to 20 cm pots. Adjustable loops at top. Natural and ivory finish.',
      price: 799.00,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 22,
      category_id: 6,
      name: 'Woven Seagrass Storage Basket',
      description: 'Handwoven seagrass basket with braided leather handles. Multi-purpose — great for blankets, toys, or laundry. 35 x 30 cm.',
      price: 1499.00,
      image_url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 23,
      category_id: 1,
      name: 'Hand-Painted Blue Pottery Vase',
      description: 'Handmade in Jaipur using traditional quartz powder, fullers earth, and natural mineral dyes. Delicate Persian floral patterns with a lustrous glaze.',
      price: 2299.00,
      image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80',
      brand: 'Jaipur Craft Guild',
      is_active: true
    },
    {
      product_id: 24,
      category_id: 1,
      name: 'Ceramic Pour-Over Coffee Dripper',
      description: 'Wheel-thrown ceramic cone with spiral interior extraction ribs. Retains heat perfectly for a clean, rich artisanal pour-over brew.',
      price: 1199.00,
      image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=80',
      brand: 'Mitti Kala',
      is_active: true
    },
    {
      product_id: 25,
      category_id: 1,
      name: 'Terracotta Water Carafe with Tumbler',
      description: 'Unadulterated local red clay carafe with nesting drinking cup. Naturally chills water through micro-porous evaporative cooling, infusing an earthy scent.',
      price: 999.00,
      image_url: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?w=600&q=80',
      brand: 'Mitti Kala',
      is_active: true
    },
    {
      product_id: 26,
      category_id: 1,
      name: 'Speckled Ceramic Ramen Bowl Set',
      description: 'Deep stoneware soup bowl with carved chopstick notch and matching handmade wooden spoons. Matte speckled iron finish.',
      price: 1449.00,
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
      brand: 'Earth & Fire Studio',
      is_active: true
    },
    {
      product_id: 27,
      category_id: 2,
      name: 'Kashmiri Cashmere Weave Shawl',
      description: 'Spun from ultra-fine Himalayan mountain wool on traditional wooden looms. Featherlight, incredibly insulating, edged with subtle needlework.',
      price: 6499.00,
      image_url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&q=80',
      brand: 'Rangrez House',
      is_active: true
    },
    {
      product_id: 28,
      category_id: 2,
      name: 'Kalamkari Hand-Painted Cushion Covers (Set of 2)',
      description: 'Drawn freehand using bamboo reed pens and organic vegetable dyes on heavy organic cotton. Intricate heritage mythological flora and fauna motifs.',
      price: 1399.00,
      image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
      brand: 'Rangrez House',
      is_active: true
    },
    {
      product_id: 29,
      category_id: 2,
      name: 'Handspun Khadi Cotton Lounge Robe',
      description: '100% handspun and hand-loomed khadi cotton kimono robe with belt tie. Gets softer with every wash, naturally breathable in all seasons.',
      price: 2199.00,
      image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80',
      brand: 'Lokal Weaves',
      is_active: true
    },
    {
      product_id: 30,
      category_id: 2,
      name: 'Indigo Dabu Mud-Resist Throw Pillow',
      description: 'Traditional mud-resist block printing from Akola, dipped multiple times in deep natural fermented indigo vats. 45 x 45 cm.',
      price: 899.00,
      image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
      brand: 'Lokal Weaves',
      is_active: true
    },
    {
      product_id: 31,
      category_id: 3,
      name: 'Saffron & Kumkumadi Glow Elixir',
      description: 'Classical Ayurvedic formulation with Grade A Kashmiri saffron stamen, sandalwood, and goat milk extract. Restores radiant skin luminosity.',
      price: 1499.00,
      image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 32,
      category_id: 3,
      name: 'Ayurvedic Bronze Kansa Facial Wand',
      description: 'Hand-cast bell metal bronze dome with carved teak handle. Balances skin pH, detoxifies tissues, and relieves facial muscle tension.',
      price: 1299.00,
      image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 33,
      category_id: 3,
      name: 'Wild Forest Honey & Walnut Exfoliator',
      description: 'Raw unprocessed honey harvested by indigenous forest gatherers blended with crushed walnut shells and cold-pressed sweet almond oil.',
      price: 549.00,
      image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 34,
      category_id: 3,
      name: 'Vetiver Root Steam-Distilled Mist',
      description: 'Pure hydrosol steam-distilled from freshly harvested South Indian khus vetiver roots. Calms redness, tightens pores, and grounds the senses.',
      price: 499.00,
      image_url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 35,
      category_id: 4,
      name: 'Walnut Wood Sculpted Desk Organizer',
      description: 'Carved from a single piece of seasoned walnut wood. Features dedicated angled smartphone slot, pen grooves, and brass-lined paperclip catch.',
      price: 1699.00,
      image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 36,
      category_id: 4,
      name: 'Channapatna Lacquer Wood Coaster Set',
      description: 'Set of 6 turned wood coasters crafted by GI-tagged Channapatna artisans using non-toxic tree resin lacquers and turmeric dyes.',
      price: 849.00,
      image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 37,
      category_id: 4,
      name: 'Solid Teak Wood Mortar and Pestle',
      description: 'Dense, high-oil reclaim teak wood hand-hollowed for pounding peppercorns, garlic, ginger, and coarse spices without absorbing odors.',
      price: 1349.00,
      image_url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 38,
      category_id: 4,
      name: 'Carved Sheesham Wood Book Stand',
      description: 'Foldable rehal-style book holder carved with traditional jali lattice patterns. Ideal for holding cookbooks, tablets, or novels.',
      price: 1099.00,
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 39,
      category_id: 5,
      name: 'Brass Urli Jasmine & Marigold Candle',
      description: 'Poured into an authentic hammered brass urli bowl with three cotton wicks. Floated with real dried marigold petals and mogra essential oils.',
      price: 1799.00,
      image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 40,
      category_id: 5,
      name: 'Cedarwood & Frankincense Wood-Wick Candle',
      description: 'Soy wax poured into a matte ceramic tumbler featuring an FSC-certified organic wood wick that gently crackles like an open fireplace.',
      price: 949.00,
      image_url: 'https://images.unsplash.com/photo-1596433809252-260c2745dfdd?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 41,
      category_id: 5,
      name: 'Temple Mogra & Camphor Incense Cones',
      description: 'Box of 30 charcoal-free cones made from recycled sacred temple flowers and natural resins. Includes a miniature terracotta burning plate.',
      price: 449.00,
      image_url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 42,
      category_id: 6,
      name: 'Lost-Wax Brass Dhokra Wind Chime',
      description: '4000-year-old metallurgical Dhokra craft from Bastar. Bell chimes produce a melodious harmonic pitch in the gentlest breeze.',
      price: 1899.00,
      image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 43,
      category_id: 6,
      name: 'Handwoven Sabai Grass Placemats (Set of 4)',
      description: 'Woven by women artisans in Mayurbhanj using sturdy wild sabai grass. Heat-resistant, wipeable, and eco-friendly dining essentials.',
      price: 1149.00,
      image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 44,
      category_id: 6,
      name: 'Moon Phase Macramé Mirror',
      description: '25 cm circular optical glass mirror encircled by intricate hand-knotted cotton fringes representing lunar crescent phases.',
      price: 1649.00,
      image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 45,
      category_id: 4,
      name: 'Peacock Brass Diya Oil Lamp',
      description: 'Solid brass handcrafted oil lamp with intricate peacock carving and deep oil reservoir. Radiates traditional heritage charm.',
      price: 1899.00,
      image_url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 46,
      category_id: 6,
      name: 'Madhubani Hand-Painted Folk Art Frame',
      description: 'Authentic Mithila folk painting executed with natural dyes and nibs on handmade paper, framed in seasoned teakwood.',
      price: 2499.00,
      image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 47,
      category_id: 2,
      name: 'Chikankari Hand-Embroidered Kurta',
      description: 'Lucknowi Chikankari shadow-work embroidered by master artisans on breathable pure fine mulmul cotton.',
      price: 2899.00,
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
      brand: 'Rangrez House',
      is_active: true
    },
    {
      product_id: 48,
      category_id: 4,
      name: 'Hammered Pure Copper Water Dispenser',
      description: 'Hand-hammered 99.8% pure copper matka dispenser with brass spigot. Natural Ayurvedic oligodynamic water purification.',
      price: 3299.00,
      image_url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 49,
      category_id: 1,
      name: 'Warli Tribal Motif Terracotta Vase',
      description: 'Earthy terracotta earthenware hand-painted with iconic Warli tribal harvest celebration scenes using white rice paste pigment.',
      price: 1249.00,
      image_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&q=80',
      brand: 'Mitti Kala',
      is_active: true
    },
    {
      product_id: 50,
      category_id: 4,
      name: 'Kashmiri Carved Walnut Jewellery Box',
      description: 'Single-piece Kashmiri walnut wood with deeply carved chinar leaf motifs, hidden sliding latch, and velvet-lined interior compartments.',
      price: 2799.00,
      image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 51,
      category_id: 4,
      name: 'Hand-Carved Mysore Sandalwood Figurine',
      description: 'Subtly fragrant Mysore sandalwood carved with traditional royal elephant motifs. Naturally retains warm soothing aroma for years.',
      price: 3499.00,
      image_url: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 52,
      category_id: 4,
      name: 'Hammered Brass Thali Dining Set',
      description: 'Traditional 6-piece royal dining set in pure solid hammered brass including thali plate, bowls, tumbler, and dessert dish.',
      price: 3999.00,
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 53,
      category_id: 6,
      name: 'Tanjore 22K Gold Foil Framed Painting',
      description: 'Classical South Indian Tanjore relief artwork adorned with 22-karat genuine gold foil leaf and semi-precious Jaipur stones in dark teak frame.',
      price: 5499.00,
      image_url: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 54,
      category_id: 2,
      name: 'Hand-Loomed Sambalpuri Ikat Silk Stole',
      description: 'Tie-dyed warp and weft double Ikat woven by master weavers from Odisha in raw mulberry silk with lustrous dual sheen.',
      price: 2199.00,
      image_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80',
      brand: 'Lokal Weaves',
      is_active: true
    },
    {
      product_id: 55,
      category_id: 6,
      name: 'Agra Pietra Dura Marble Inlay Coasters',
      description: 'White Makrana marble inlaid by descendants of Taj Mahal artisans using semi-precious lapis lazuli, malachite, and carnelian (Set of 4).',
      price: 1999.00,
      image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 56,
      category_id: 5,
      name: 'Handcrafted Khus Vetiver Root Hanging',
      description: 'Woven wild vetiver (khus) root hanging. Spray with cold water to unleash earthy forest coolness and natural room fragrance.',
      price: 749.00,
      image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
      brand: 'Diya Atelier',
      is_active: true
    },
    {
      product_id: 57,
      category_id: 4,
      name: 'Dokra Tribal Musician Ensemble (Set of 3)',
      description: 'Ancient lost-wax cast brass miniature statues of tribal folk musicians playing traditional dholak, shehnai, and bansuri flute.',
      price: 2299.00,
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    },
    {
      product_id: 58,
      category_id: 3,
      name: 'Desi Cow Ghee & Kannauj Rose Bathing Bar',
      description: 'Slow-cured cold process soap enriched with grass-fed A2 Gir cow ghee and pure steam-distilled Kannauj damask rose absolute.',
      price: 399.00,
      image_url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&q=80',
      brand: 'Vana Herbals',
      is_active: true
    },
    {
      product_id: 59,
      category_id: 6,
      name: 'Handwoven Assam Golden Cane Picnic Basket',
      description: 'Crafted from sustainable Assam river cane and treated split bamboo with double-hinged lid and reinforced vegan leather straps.',
      price: 1799.00,
      image_url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80',
      brand: 'Knotted Stories',
      is_active: true
    },
    {
      product_id: 60,
      category_id: 4,
      name: 'Himalayan Hand-Beaten Singing Bowl & Mallet',
      description: 'Seven-metal alloy bowl hand-beaten in the foothills of Himachal. Emits long-sustaining 432 Hz therapeutic vibration; includes wooden striker.',
      price: 2699.00,
      image_url: 'https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=600&q=80',
      brand: 'Kaam Woodcraft',
      is_active: true
    }
  ];
  await Product.insertMany(products);

  console.log('🌱 Seeding Inventory...');
  const inventoryData = [
    { product_id: 1, quantity: 45 },
    { product_id: 2, quantity: 30 },
    { product_id: 3, quantity: 20 },
    { product_id: 4, quantity: 35 },
    { product_id: 5, quantity: 18 },
    { product_id: 6, quantity: 50 },
    { product_id: 7, quantity: 80 },
    { product_id: 8, quantity: 120 },
    { product_id: 9, quantity: 25 },
    { product_id: 10, quantity: 40 },
    { product_id: 11, quantity: 60 },
    { product_id: 12, quantity: 35 },
    { product_id: 13, quantity: 28 },
    { product_id: 14, quantity: 22 },
    { product_id: 15, quantity: 55 },
    { product_id: 16, quantity: 15 },
    { product_id: 17, quantity: 90 },
    { product_id: 18, quantity: 70 },
    { product_id: 19, quantity: 32 },
    { product_id: 20, quantity: 48 },
    { product_id: 21, quantity: 65 },
    { product_id: 22, quantity: 30 },
    { product_id: 23, quantity: 24 },
    { product_id: 24, quantity: 35 },
    { product_id: 25, quantity: 40 },
    { product_id: 26, quantity: 28 },
    { product_id: 27, quantity: 12 },
    { product_id: 28, quantity: 30 },
    { product_id: 29, quantity: 20 },
    { product_id: 30, quantity: 45 },
    { product_id: 31, quantity: 55 },
    { product_id: 32, quantity: 35 },
    { product_id: 33, quantity: 65 },
    { product_id: 34, quantity: 80 },
    { product_id: 35, quantity: 25 },
    { product_id: 36, quantity: 40 },
    { product_id: 37, quantity: 30 },
    { product_id: 38, quantity: 22 },
    { product_id: 39, quantity: 18 },
    { product_id: 40, quantity: 45 },
    { product_id: 41, quantity: 75 },
    { product_id: 42, quantity: 16 },
    { product_id: 43, quantity: 32 },
    { product_id: 44, quantity: 20 },
    { product_id: 45, quantity: 24 },
    { product_id: 46, quantity: 18 },
    { product_id: 47, quantity: 30 },
    { product_id: 48, quantity: 15 },
    { product_id: 49, quantity: 35 },
    { product_id: 50, quantity: 20 },
    { product_id: 51, quantity: 12 },
    { product_id: 52, quantity: 16 },
    { product_id: 53, quantity: 8 },
    { product_id: 54, quantity: 25 },
    { product_id: 55, quantity: 22 },
    { product_id: 56, quantity: 50 },
    { product_id: 57, quantity: 14 },
    { product_id: 58, quantity: 95 },
    { product_id: 59, quantity: 20 },
    { product_id: 60, quantity: 15 }
  ];
  await Inventory.insertMany(inventoryData);

  console.log('🌱 Seeding Coupons...');
  const coupons = [
    { coupon_id: 1, code: 'EARTHY10', discount_type: 'percent', discount_value: 10.00, min_order_amt: 500.00, max_uses: 50, is_active: true },
    { coupon_id: 2, code: 'CRAFT500', discount_type: 'flat', discount_value: 500.00, min_order_amt: 3000.00, max_uses: 20, is_active: true },
    { coupon_id: 3, code: 'WELCOME15', discount_type: 'percent', discount_value: 15.00, min_order_amt: 1000.00, max_uses: 100, is_active: true }
  ];
  await Coupon.insertMany(coupons);

  console.log('🌱 Seeding Sample Reviews...');
  const reviews = [
    { review_id: 1, product_id: 1, user_id: 1, rating: 5, title: 'Absolutely love this mug!', body: 'The weight, the texture — it feels so alive in your hands. My morning chai tastes better in it.' },
    { review_id: 2, product_id: 7, user_id: 2, rating: 5, title: 'Best face oil I have ever used', body: 'After just two weeks my skin looks visibly brighter. Worth every rupee. Minimal, clean packaging too.' },
    { review_id: 3, product_id: 6, user_id: 1, rating: 4, title: 'Beautiful wall piece', body: 'Looks stunning above the sofa. Shipped safely and arrived perfectly. Slight knot imperfection but that is the charm.' },
    { review_id: 4, product_id: 9, user_id: 2, rating: 5, title: 'Heirloom quality', body: 'Heavy, smooth, and beautifully finished. We use it every day. Mango wood grain is stunning.' },
    { review_id: 5, product_id: 23, user_id: 1, rating: 5, title: 'Exquisite craftsmanship', body: 'The blue glaze catches the light breathtakingly. Looks magnificent on our entryway console.' },
    { review_id: 6, product_id: 27, user_id: 2, rating: 5, title: 'Pure Kashmiri luxury', body: 'Unbelievably soft and warm yet weights almost nothing. Highly recommended artisan craft.' },
    { review_id: 7, product_id: 31, user_id: 1, rating: 5, title: 'Divine scent and texture', body: 'The saffron fragrance is authentic and not overpowering. Gives a healthy morning glow.' },
    { review_id: 8, product_id: 39, user_id: 2, rating: 5, title: 'Magnificent festive centerpiece', body: 'The brass urli is heavy and heirloom grade. Scent fills the whole living room.' },
    { review_id: 9, product_id: 48, user_id: 1, rating: 5, title: 'Incredible artisanal quality', body: 'The hammered copper is substantial and stunning. Water stays cool and tastes remarkably fresh.' },
    { review_id: 10, product_id: 52, user_id: 2, rating: 5, title: 'Brings royal heritage to dining', body: 'Heavy, brilliant polish, and a joy to host guests with. Highly recommend.' }
  ];
  await Review.insertMany(reviews);

  console.log('🌱 Initializing Carts for seeded users...');
  await Cart.insertMany([
    { cart_id: 1, user_id: 1, items: [] },
    { cart_id: 2, user_id: 2, items: [] },
    { cart_id: 3, user_id: 3, items: [] }
  ]);

  console.log('🌱 Initializing Sequence Counters...');
  const counters = [
    { name: 'user_id', seq: 3 },
    { name: 'address_id', seq: 3 },
    { name: 'category_id', seq: 6 },
    { name: 'product_id', seq: 60 },
    { name: 'coupon_id', seq: 3 },
    { name: 'review_id', seq: 10 },
    { name: 'cart_id', seq: 3 },
    { name: 'cart_item_id', seq: 0 },
    { name: 'order_id', seq: 0 },
    { name: 'payment_id', seq: 0 }
  ];
  await Counter.insertMany(counters);

  console.log('✨ All data successfully seeded into MongoDB Atlas cloud database!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

