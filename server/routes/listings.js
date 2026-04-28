const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { run, all, get } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `listing_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /jpeg|jpg|png|webp/.test(file.mimetype))
});

async function withImages(listing) {
  if (!listing) return null;
  listing.images = await all('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, uploaded_at ASC', [listing.id]);
  return listing;
}

// GET all available listings (public)
router.get('/', async (req, res) => {
  try {
    const { location, type, min_price, max_price, furnished, gated, parking } = req.query;
    let sql = `SELECT l.*, u.name as caretaker_name, u.phone as caretaker_phone
               FROM listings l JOIN users u ON l.caretaker_id = u.id
               WHERE l.status = 'available'`;
    const args = [];

    if (location) { sql += ` AND (l.location LIKE ? OR l.sub_location LIKE ?)`; args.push(`%${location}%`, `%${location}%`); }
    if (type) { sql += ` AND l.type = ?`; args.push(type); }
    if (min_price) { sql += ` AND l.price >= ?`; args.push(Number(min_price)); }
    if (max_price) { sql += ` AND l.price <= ?`; args.push(Number(max_price)); }
    if (furnished === 'true') sql += ` AND l.furnished = 1`;
    if (gated === 'true') sql += ` AND l.gated = 1`;
    if (parking === 'true') sql += ` AND l.parking = 1`;
    sql += ` ORDER BY l.created_at DESC`;

    const listings = await all(sql, args);
    const result = await Promise.all(listings.map(withImages));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET caretaker's own listings (must be before /:id)
router.get('/my/listings', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const listings = await all('SELECT * FROM listings WHERE caretaker_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(await Promise.all(listings.map(withImages)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single listing (public)
router.get('/:id', async (req, res) => {
  try {
    const listing = await get(
      `SELECT l.*, u.name as caretaker_name, u.phone as caretaker_phone
       FROM listings l JOIN users u ON l.caretaker_id = u.id WHERE l.id = ?`,
      [req.params.id]
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(await withImages(listing));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create listing
router.post('/', authenticate, requireRole('caretaker'), upload.array('images', 10), async (req, res) => {
  try {
    const { title, type, location, sub_location, price, bedrooms, bathrooms, furnished, parking, water, generator, gated, description } = req.body;
    if (!title || !type || !location || !price) return res.status(400).json({ error: 'Title, type, location, and price are required' });

    const result = await run(
      `INSERT INTO listings (caretaker_id, title, type, location, sub_location, price, bedrooms, bathrooms, furnished, parking, water, generator, gated, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, title, type, location, sub_location || null, Number(price),
       Number(bedrooms) || 0, Number(bathrooms) || 1,
       furnished === 'true' ? 1 : 0, parking === 'true' ? 1 : 0,
       water === 'true' ? 1 : 0, generator === 'true' ? 1 : 0,
       gated === 'true' ? 1 : 0, description || null]
    );

    const listingId = Number(result.lastInsertRowid);
    if (req.files?.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await run('INSERT INTO listing_images (listing_id, filename, is_primary) VALUES (?, ?, ?)', [listingId, req.files[i].filename, i === 0 ? 1 : 0]);
      }
    }

    const listing = await get('SELECT * FROM listings WHERE id = ?', [listingId]);
    res.status(201).json(await withImages(listing));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update listing details
router.put('/:id', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing) return res.status(404).json({ error: 'Not found' });
    if (listing.caretaker_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });

    const { title, type, location, sub_location, price, bedrooms, bathrooms, furnished, parking, water, generator, gated, description } = req.body;
    await run(
      `UPDATE listings SET title=?, type=?, location=?, sub_location=?, price=?, bedrooms=?, bathrooms=?,
       furnished=?, parking=?, water=?, generator=?, gated=?, description=? WHERE id=?`,
      [title || listing.title, type || listing.type, location || listing.location,
       sub_location ?? listing.sub_location, Number(price) || listing.price,
       Number(bedrooms) ?? listing.bedrooms, Number(bathrooms) ?? listing.bathrooms,
       furnished !== undefined ? (furnished === 'true' ? 1 : 0) : listing.furnished,
       parking !== undefined ? (parking === 'true' ? 1 : 0) : listing.parking,
       water !== undefined ? (water === 'true' ? 1 : 0) : listing.water,
       generator !== undefined ? (generator === 'true' ? 1 : 0) : listing.generator,
       gated !== undefined ? (gated === 'true' ? 1 : 0) : listing.gated,
       description ?? listing.description, req.params.id]
    );
    res.json(await withImages(await get('SELECT * FROM listings WHERE id = ?', [req.params.id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST add images to existing listing
router.post('/:id/images', authenticate, requireRole('caretaker'), upload.array('images', 10), async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing) return res.status(404).json({ error: 'Not found' });
    if (listing.caretaker_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });
    if (!req.files?.length) return res.status(400).json({ error: 'No images uploaded' });

    const hasPrimary = await get('SELECT id FROM listing_images WHERE listing_id = ? AND is_primary = 1', [listing.id]);
    for (let i = 0; i < req.files.length; i++) {
      await run('INSERT INTO listing_images (listing_id, filename, is_primary) VALUES (?, ?, ?)',
        [listing.id, req.files[i].filename, !hasPrimary && i === 0 ? 1 : 0]);
    }
    res.json(await withImages(await get('SELECT * FROM listings WHERE id = ?', [req.params.id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE a single image
router.delete('/:id/images/:imageId', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing || listing.caretaker_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const image = await get('SELECT * FROM listing_images WHERE id = ? AND listing_id = ?', [req.params.imageId, req.params.id]);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const filePath = path.join(__dirname, '../uploads', image.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await run('DELETE FROM listing_images WHERE id = ?', [image.id]);

    if (image.is_primary) {
      const next = await get('SELECT id FROM listing_images WHERE listing_id = ? LIMIT 1', [listing.id]);
      if (next) await run('UPDATE listing_images SET is_primary = 1 WHERE id = ?', [next.id]);
    }
    res.json({ message: 'Image deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH set primary image
router.patch('/:id/images/:imageId/primary', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing || listing.caretaker_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    await run('UPDATE listing_images SET is_primary = 0 WHERE listing_id = ?', [listing.id]);
    await run('UPDATE listing_images SET is_primary = 1 WHERE id = ? AND listing_id = ?', [req.params.imageId, listing.id]);
    res.json({ message: 'Primary image updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE listing
router.delete('/:id', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const listing = await get('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!listing) return res.status(404).json({ error: 'Not found' });
    if (listing.caretaker_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });

    const images = await all('SELECT filename FROM listing_images WHERE listing_id = ?', [listing.id]);
    images.forEach(img => {
      const fp = path.join(__dirname, '../uploads', img.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });
    await run('DELETE FROM listing_images WHERE listing_id = ?', [listing.id]);
    await run('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Listing deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
