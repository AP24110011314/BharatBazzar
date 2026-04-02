<<<<<<< HEAD
<<<<<<< HEAD
# BharatBazzar
A full-stack e-commerce platform featuring a normalized MySQL database with advanced SQL capabilities (triggers, stored procedures), a Node.js/Express REST API, and a beautifully designed, responsive vanilla JS frontend.
=======
=======
>>>>>>> d5e106a (initial commit)
# 🛒 ShopDB — Online Shopping System

> **DBMS Course Project** | Full-stack mini e-commerce system (MySQL + Node.js/Express + HTML/CSS/JS)

---

## 📁 Project Structure

```
DBMS-Project/
├── database/
│   ├── schema.sql          ← Full MySQL DDL (tables, triggers, views, stored procedures)
│   ├── seed.sql            ← Sample data (users, products, categories, coupons)
│   └── er_diagram.md       ← ER diagram in Mermaid format + normalization notes
│
├── backend/
│   ├── server.js           ← Express entry point
│   ├── package.json
│   ├── .env.example        ← Copy to .env and configure
│   ├── config/
│   │   └── db.js           ← MySQL2 connection pool
│   ├── middleware/
│   │   └── auth.js         ← JWT auth + admin role check
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── admin.js
│   └── controllers/
│       ├── authController.js
│       ├── productController.js
│       ├── cartController.js
│       ├── orderController.js
│       └── adminController.js
│
├── frontend/
│   ├── index.html          ← Login / Register page
│   ├── products.html       ← Product listing with search & filters
│   ├── cart.html           ← Shopping cart management
│   ├── checkout.html       ← Address, payment, order placement
│   ├── orders.html         ← Order history
│   ├── css/
│   │   └── style.css       ← Complete design system (dark theme)
│   └── js/
│       └── api.js          ← Centralized API client + helpers
│
└── README.md
```

---

## 🗄️ Database Design Highlights

| Entity | Description |
|---|---|
| Users | Customer + admin accounts with bcrypt passwords |
| Addresses | Multiple shipping addresses per user |
| Categories | Hierarchical (self-referencing parent_id) |
| Products | Core product catalog with brand, price, image |
| **Inventory** | **Stock tracked separately** (not in Products — 3NF) |
| Cart + Cart_Items | One active cart per user with line items |
| Orders + Order_Items | Placed orders with price snapshot at purchase time |
| Payments | Separate method + provider fields, transaction ref |
| Reviews | One review per user per product |
| Wishlist | Many-to-many user ↔ product |
| Coupons + Coupon_Usage | Discount codes with per-user usage tracking |

### Database Objects
- **3 Triggers**: Inventory deduction after order, stock validation, payment-confirms-order
- **2 Views**: `vw_top_products`, `vw_user_summary`
- **2 Stored Procedures**: `PlaceOrder()`, `ProcessPayment()`

---

## ⚙️ Setup Instructions

### Prerequisites
- **MySQL 8.0+** installed and running
- **Node.js 18+** and npm installed

---

### Step 1 — Set up MySQL Database

```bash
# Open MySQL shell (enter your root password when prompted)
mysql -u root -p

# Inside MySQL shell — run the schema and seed files:
source /path/to/DBMS-Project/database/schema.sql
source /path/to/DBMS-Project/database/seed.sql

# Verify tables were created:
USE shopdb;
SHOW TABLES;
exit;
```

Or run directly from terminal:
```bash
mysql -u root -p shopdb < database/schema.sql
mysql -u root -p shopdb < database/seed.sql
```

---

### Step 2 — Configure Backend

```bash
cd backend

# Copy the environment template
cp .env.example .env

# Edit .env with your MySQL credentials:
# DB_PASSWORD=your_actual_mysql_password
# JWT_SECRET=any_random_long_string
```

---

### Step 3 — Install Dependencies & Start Backend

```bash
cd backend
npm install
npm start
```

You should see:
```
✅  MySQL connected successfully
🛒  ShopDB Backend running at http://localhost:5000
```

---

### Step 4 — Open Frontend

Open the frontend directly in your browser:

```bash
# Option A: Open directly
open /path/to/DBMS-Project/frontend/index.html

# Option B: Use a simple HTTP server (recommended to avoid CORS issues)
cd frontend
npx serve .
# Then open http://localhost:3000
```

---

## 🧪 Demo Test Flow

### Accounts (pre-seeded)
| Email | Password | Role |
|---|---|---|
| alice@example.com | password123 | Customer |
| bob@example.com | password123 | Customer |
| admin@shop.com | password123 | Admin |

### Step-by-step walkthrough:

1. **Login** → Open `index.html`, login as `alice@example.com` / `password123`
2. **Browse Products** → View electronics, books, clothing; use search and filters
3. **Add to Cart** → Add "Clean Code" book and "Samsung Galaxy S23" to cart
4. **View Cart** → Adjust quantities, optionally apply coupon `SAVE10`
5. **Checkout** → Select address, choose payment method (e.g. UPI), place order
6. **Verify** → Check `orders.html` — order should appear with status `confirmed`
7. **Inventory Updated** → In MySQL, run:
   ```sql
   SELECT p.name, i.quantity FROM Products p JOIN Inventory i ON i.product_id = p.product_id;
   ```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login + get JWT |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/products | No | List products (filter, search, sort) |
| GET | /api/products/:id | No | Single product details |
| GET | /api/products/categories | No | List categories |
| GET | /api/cart | Yes | Get cart |
| POST | /api/cart/add | Yes | Add item to cart |
| PUT | /api/cart/update | Yes | Update quantity |
| DELETE | /api/cart/remove | Yes | Remove item |
| DELETE | /api/cart/clear | Yes | Clear cart |
| GET | /api/orders | Yes | Order history |
| POST | /api/orders/place | Yes | Place order (calls PlaceOrder SP) |
| GET | /api/orders/addresses | Yes | List user addresses |
| POST | /api/orders/addresses | Yes | Add new address |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/top-products | Admin | Top products (uses view) |
| GET | /api/admin/users | Admin | User summary (uses view) |
| GET | /api/admin/orders | Admin | All orders |

---

## 🛠️ Coupons for Testing

| Code | Type | Value | Min Order |
|---|---|---|---|
| SAVE10 | 10% off | 10% | ₹500 |
| FLAT500 | Flat ₹500 off | ₹500 | ₹5,000 |
| WELCOME20 | 20% off | 20% | ₹1,000 |

---

## 🧑‍💻 Technology Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8.0 |
| Backend | Node.js + Express 4 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| DB Client | mysql2 (promise-based pool) |
| Frontend | HTML5 + Vanilla CSS + Vanilla JS |
| Fonts | Google Fonts — Inter |

---

## 📊 System Flow Diagram

```
User registers / logs in
        ↓
 Receives JWT token
        ↓
 Browses products (GET /api/products)
        ↓
 Adds items to cart (POST /api/cart/add)
        ↓
 Proceeds to checkout
        ↓
 Selects address + payment method
        ↓
 Calls POST /api/orders/place
        ↓
 Backend calls CALL PlaceOrder() ─→ validates stock
                                    creates Orders record
                                    inserts Order_Items
                                    TRIGGER reduces Inventory
                                    clears Cart
        ↓
 Backend calls CALL ProcessPayment() → generates transaction ref
                                        inserts Payment record
                                        TRIGGER confirms Order
        ↓
 Frontend shows success + transaction ref
        ↓
 User views Order History (GET /api/orders)
```
<<<<<<< HEAD
>>>>>>> d5e106a (initial commit)
=======
>>>>>>> d5e106a (initial commit)
