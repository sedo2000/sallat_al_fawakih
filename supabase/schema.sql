-- Supabase PostgreSQL Schema for سلة الفاكهة

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_active ON categories(is_active);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price DECIMAL(10, 3) NOT NULL,
  old_price DECIMAL(10, 3),
  discount INT DEFAULT 0,
  unit VARCHAR(50),
  image_url VARCHAR(500),
  stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);

-- Addresses table
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50),
  street VARCHAR(255) NOT NULL,
  building VARCHAR(100),
  floor VARCHAR(50),
  apartment VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  notes TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

-- Favorites table
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id INT NOT NULL REFERENCES addresses(id),
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10, 3) NOT NULL,
  discount_amount DECIMAL(10, 3) DEFAULT 0,
  delivery_fee DECIMAL(10, 3) DEFAULT 0,
  total DECIMAL(10, 3) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Order items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- OTP codes table
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- Banners table
CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title_ar VARCHAR(255),
  title_en VARCHAR(255),
  description_ar TEXT,
  description_en TEXT,
  image_url VARCHAR(500) NOT NULL,
  link VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(is_active);

-- Settings table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (can view own data)
CREATE POLICY users_select ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for addresses (can view own addresses)
CREATE POLICY addresses_select ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY addresses_insert ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY addresses_update ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY addresses_delete ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for orders (can view own orders)
CREATE POLICY orders_select ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY orders_insert ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for favorites (can view own favorites)
CREATE POLICY favorites_select ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY favorites_insert ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY favorites_delete ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Public read access to products, categories, and banners
CREATE POLICY products_select ON products FOR SELECT
  USING (TRUE);

CREATE POLICY categories_select ON categories FOR SELECT
  USING (TRUE);

CREATE POLICY banners_select ON banners FOR SELECT
  USING (TRUE);
