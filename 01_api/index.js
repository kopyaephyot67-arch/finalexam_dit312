const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'products_db',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, suffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|gif|webp/;
    const ext = types.test(path.extname(file.originalname).toLowerCase());
    const mime = types.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Images only!'));
  }
});

// Helper function to get full image URL
function getImageUrl(imageUrl, req) {
  if (!imageUrl) return null;
  
  // If it's already a full URL (starts with http:// or https://), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path (starts with /uploads), construct full URL
  if (imageUrl.startsWith('/uploads/')) {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}${imageUrl}`;
  }
  
  return imageUrl;
}

// ========== ROUTES ==========

// Health check
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Get all products (with search & filter)
app.get('/products', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }
    
    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }
    
    if (minPrice) {
      query += ' AND price >= ?';
      countQuery += ' AND price >= ?';
      params.push(parseFloat(minPrice));
      countParams.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND price <= ?';
      countQuery += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
      countParams.push(parseFloat(maxPrice));
    }
    
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;
    
    // Convert relative URLs to absolute URLs
    const productsWithFullUrls = rows.map(product => ({
      ...product,
      imageUrl: getImageUrl(product.imageUrl, req)
    }));
    
    res.json({
      data: productsWithFullUrls,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    const product = {
      ...rows[0],
      imageUrl: getImageUrl(rows[0].imageUrl, req)
    };
    
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, price, category, stock, imageUrl } = req.body;
    
    if (!name || !slug || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Priority: uploaded file > provided URL > null
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl && imageUrl.trim()) {
      finalImageUrl = imageUrl.trim();
    }
    
    const [result] = await pool.query(
      'INSERT INTO products (name, slug, description, price, category, stock, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, slug, description || null, parseFloat(price), category, parseInt(stock) || 0, finalImageUrl]
    );
    
    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    const productWithFullUrl = {
      ...newProduct[0],
      imageUrl: getImageUrl(newProduct[0].imageUrl, req)
    };
    
    res.status(201).json(productWithFullUrl);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Product slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, slug, description, price, category, stock, imageUrl } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    // Priority: uploaded file > provided URL > existing URL
    let finalImageUrl = existing[0].imageUrl;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl && imageUrl.trim()) {
      finalImageUrl = imageUrl.trim();
    }
    
    await pool.query(
      'UPDATE products SET name=?, slug=?, description=?, price=?, category=?, stock=?, imageUrl=? WHERE id=?',
      [name, slug, description || null, parseFloat(price), category, parseInt(stock) || 0, finalImageUrl, req.params.id]
    );
    
    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    const productWithFullUrl = {
      ...updated[0],
      imageUrl: getImageUrl(updated[0].imageUrl, req)
    };
    
    res.json(productWithFullUrl);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories
app.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API on http://localhost:${port}`));