import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [form, setForm] = useState({ viewing_date: '', message: '' });
  const [booking, setBooking] = useState({ loading: false, success: '', error: '' });

  useEffect(() => {
    axios.get(`/api/listings/${id}`)
      .then(r => { setListing(r.data); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBook(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (user.role !== 'tenant') return setBooking(b => ({ ...b, error: 'Only tenants can book viewings.' }));
    setBooking({ loading: true, success: '', error: '' });
    try {
      await axios.post('/api/bookings', { listing_id: listing.id, viewing_date: form.viewing_date, message: form.message });
      setBooking({ loading: false, success: 'Viewing request sent! The caretaker will confirm shortly.', error: '' });
      setForm({ viewing_date: '', message: '' });
    } catch (err) {
      setBooking({ loading: false, success: '', error: err.response?.data?.error || 'Failed to send request.' });
    }
  }

  if (loading) return <div className="spinner">Loading listing...</div>;
  if (!listing) return null;

  const images = listing.images || [];
  const primaryIdx = images.findIndex(i => i.is_primary);
  const orderedImages = primaryIdx > 0
    ? [images[primaryIdx], ...images.filter((_, i) => i !== primaryIdx)]
    : images;

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
        <span style={{ color: '#16a34a', cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
        {' › '}
        <span style={{ color: '#16a34a', cursor: 'pointer' }} onClick={() => navigate('/search')}>{listing.location}</span>
        {' › '}
        {listing.title}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        {/* Left column */}
        <div>
          {/* Photo gallery */}
          {orderedImages.length > 0 ? (
            <div>
              <div style={{ borderRadius: 14, overflow: 'hidden', height: 300, background: '#e5e7eb', marginBottom: 8 }}>
                <img src={`/uploads/${orderedImages[activeImg]?.filename}`} alt="listing"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {orderedImages.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {orderedImages.map((img, i) => (
                    <div key={img.id} onClick={() => setActiveImg(i)}
                      style={{ width: 72, height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                        border: `2px solid ${i === activeImg ? '#16a34a' : '#e5e7eb'}` }}>
                      <img src={`/uploads/${img.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 280, background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>🏠</div>
          )}

          {/* Title & details */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span className="pill pill-green">Available</span>
              {listing.caretaker_name && <span className="pill pill-blue">✓ Verified Caretaker</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{listing.title}</h1>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>
              📍 {listing.sub_location ? `${listing.sub_location}, ` : ''}{listing.location}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#16a34a', marginBottom: 18 }}>
              KES {Number(listing.price).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: '#aaa' }}>/month</span>
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {[
                listing.bedrooms > 0 && `🛏 ${listing.bedrooms} Bedroom${listing.bedrooms > 1 ? 's' : ''}`,
                listing.bathrooms > 0 && `🚿 ${listing.bathrooms} Bathroom${listing.bathrooms > 1 ? 's' : ''}`,
                listing.furnished && '✅ Furnished',
                listing.parking && '🅿️ Parking',
                listing.gated && '🔒 Gated',
                listing.water && '💧 24/7 Water',
                listing.generator && '⚡ Backup Power',
              ].filter(Boolean).map(c => (
                <span key={c} style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#444' }}>{c}</span>
              ))}
            </div>

            {/* Description */}
            {listing.description && (
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 20 }}>{listing.description}</p>
            )}

            {/* Caretaker */}
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                {listing.caretaker_name?.[0] || 'C'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{listing.caretaker_name || 'Caretaker'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {user ? listing.caretaker_phone : 'Sign in to view contact'}
                </div>
              </div>
              <span className="pill pill-blue" style={{ marginLeft: 'auto' }}>✓ Verified</span>
            </div>
          </div>
        </div>

        {/* Right: Booking card */}
        <div>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 80 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Book a Viewing</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', marginBottom: 16 }}>
              KES {Number(listing.price).toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400, color: '#aaa' }}>/mo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 14, color: '#15803d', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
              Available Now
            </div>

            {booking.success ? (
              <div className="success-msg">{booking.success}</div>
            ) : (
              <form onSubmit={handleBook}>
                {booking.error && <div className="error-msg">{booking.error}</div>}
                <div className="field">
                  <label>Preferred Viewing Date</label>
                  <input type="date" required value={form.viewing_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, viewing_date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Message (optional)</label>
                  <textarea placeholder="Any questions for the caretaker?" value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-green w-full btn-lg" disabled={booking.loading}>
                  {booking.loading ? 'Sending...' : '📅 Request Viewing'}
                </button>
                {!user && (
                  <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 10 }}>
                    You need to <span style={{ color: '#16a34a', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>login</span> to book a viewing
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
