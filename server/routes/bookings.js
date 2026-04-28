const router = require('express').Router();
const { run, all, get } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', authenticate, requireRole('tenant'), async (req, res) => {
  try {
    const { listing_id, viewing_date, message } = req.body;
    if (!listing_id || !viewing_date) return res.status(400).json({ error: 'listing_id and viewing_date required' });

    const listing = await get("SELECT * FROM listings WHERE id = ? AND status = 'available'", [listing_id]);
    if (!listing) return res.status(404).json({ error: 'Listing not available' });

    const result = await run(
      'INSERT INTO bookings (tenant_id, listing_id, viewing_date, message) VALUES (?, ?, ?, ?)',
      [req.user.id, listing_id, viewing_date, message || null]
    );
    res.status(201).json(await get('SELECT * FROM bookings WHERE id = ?', [Number(result.lastInsertRowid)]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/my', authenticate, requireRole('tenant'), async (req, res) => {
  try {
    const bookings = await all(
      `SELECT b.*, l.title, l.location, l.sub_location, l.price, l.type,
              u.name as caretaker_name, u.phone as caretaker_phone
       FROM bookings b JOIN listings l ON b.listing_id = l.id JOIN users u ON l.caretaker_id = u.id
       WHERE b.tenant_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(bookings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/cancel', authenticate, requireRole('tenant'), async (req, res) => {
  try {
    const booking = await get('SELECT * FROM bookings WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Only pending bookings can be cancelled' });
    await run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/requests', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const requests = await all(
      `SELECT b.*, l.title, l.location, l.sub_location,
              u.name as tenant_name, u.phone as tenant_phone, u.email as tenant_email
       FROM bookings b JOIN listings l ON b.listing_id = l.id JOIN users u ON b.tenant_id = u.id
       WHERE l.caretaker_id = ? AND b.status = 'pending' ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(requests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/confirm', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const booking = await get(
      `SELECT b.* FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.id = ? AND l.caretaker_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    await run("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking confirmed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/reject', authenticate, requireRole('caretaker'), async (req, res) => {
  try {
    const booking = await get(
      `SELECT b.* FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.id = ? AND l.caretaker_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    await run("UPDATE bookings SET status = 'rejected' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking rejected' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
