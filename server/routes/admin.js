const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { run, all, get } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const guard = [authenticate, requireRole('admin')];

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

router.get('/stats', ...guard, async (req, res) => {
  try {
    const [tl, pl, al, tu, tt, tc, tb] = await Promise.all([
      get('SELECT COUNT(*) as c FROM listings'),
      get("SELECT COUNT(*) as c FROM listings WHERE status = 'pending'"),
      get("SELECT COUNT(*) as c FROM listings WHERE status = 'available'"),
      get("SELECT COUNT(*) as c FROM users WHERE role != 'admin'"),
      get("SELECT COUNT(*) as c FROM users WHERE role = 'tenant'"),
      get("SELECT COUNT(*) as c FROM users WHERE role = 'caretaker'"),
      get('SELECT COUNT(*) as c FROM bookings'),
    ]);
    res.json({ total_listings: tl.c, pending_listings: pl.c, available_listings: al.c, total_users: tu.c, total_tenants: tt.c, total_caretakers: tc.c, total_bookings: tb.c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users', ...guard, async (req, res) => {
  try {
    const { role } = req.query;
    let sql = "SELECT id, name, email, phone, role, is_verified, is_suspended, national_id, created_at FROM users WHERE role != 'admin'";
    const args = [];
    if (role) { sql += ' AND role = ?'; args.push(role); }
    res.json(await all(sql + ' ORDER BY created_at DESC', args));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users/:id', ...guard, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, phone, role, is_verified, is_suspended, national_id, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'tenant') {
      user.bookings = await all(
        `SELECT b.*, l.title, l.location FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.tenant_id = ? ORDER BY b.created_at DESC`,
        [user.id]
      );
    } else if (user.role === 'caretaker') {
      user.listings = await all('SELECT id, title, location, price, status FROM listings WHERE caretaker_id = ?', [user.id]);
    }
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/users/:id/suspend', ...guard, async (req, res) => {
  try {
    const user = await get('SELECT id, is_suspended FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await run('UPDATE users SET is_suspended = ? WHERE id = ?', [user.is_suspended ? 0 : 1, user.id]);
    res.json({ message: user.is_suspended ? 'User unsuspended' : 'User suspended' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/users/:id/verify', ...guard, async (req, res) => {
  try {
    await run('UPDATE users SET is_verified = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'User verified' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', ...guard, async (req, res) => {
  try {
    await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/listings/pending', ...guard, async (req, res) => {
  try {
    res.json(await all(
      `SELECT l.*, u.name as caretaker_name, u.email as caretaker_email
       FROM listings l JOIN users u ON l.caretaker_id = u.id
       WHERE l.status = 'pending' ORDER BY l.created_at DESC`
    ));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/listings/:id/approve', ...guard, async (req, res) => {
  try {
    await run("UPDATE listings SET status = 'available' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Listing approved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/listings/:id/reject', ...guard, async (req, res) => {
  try {
    await run("UPDATE listings SET status = 'unavailable' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Listing rejected' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/listings', ...guard, upload.array('images', 10), async (req, res) => {
  try {
    const { title, type, location, sub_location, price, bedrooms, bathrooms, furnished, parking, water, generator, gated, description } = req.body;
    if (!title || !type || !location || !price) return res.status(400).json({ error: 'Title, type, location, and price are required' });

    const result = await run(
      `INSERT INTO listings (caretaker_id, title, type, location, sub_location, price, bedrooms, bathrooms, furnished, parking, water, generator, gated, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
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
    res.status(201).json(listing);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
