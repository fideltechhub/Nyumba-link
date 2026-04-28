import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ListingCard from '../components/ListingCard';

const AREAS = [
  'Westlands','Kilimani','Karen','Lavington','Kileleshwa','Parklands',
  'Runda','Muthaiga','Gigiri','Kasarani','Roysambu','Kahawa West',
  'Githurai','Eastleigh','Buruburu','Umoja','Donholm','Komarock',
  'Kayole','Embakasi','Ruaka','Rongai','Ngong','Syokimau','Kitengela',
  'Upper Hill','South B','South C','Hurlingham','Ngong Road',
];

export default function Home() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ location: '', type: '', max_price: '' });

  useEffect(() => {
    axios.get('/api/listings?').then(r => setListings(r.data)).finally(() => setLoading(false));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.location) params.set('location', search.location);
    if (search.type) params.set('type', search.type);
    if (search.max_price) params.set('max_price', search.max_price);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <h1>Find Your Home in Nairobi</h1>
        <p>Browse verified listings, book a viewing, and move in — stress free.</p>
        <form className="search-bar" onSubmit={handleSearch}>
          <select value={search.location} onChange={e => setSearch(s => ({ ...s, location: e.target.value }))}>
            <option value="">📍 All Locations</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={search.type} onChange={e => setSearch(s => ({ ...s, type: e.target.value }))}>
            <option value="">🏠 Any Type</option>
            <option>Bedsitter</option>
            <option>Studio</option>
            <option>1 Bedroom</option>
            <option>2 Bedrooms</option>
            <option>3 Bedrooms</option>
            <option>Townhouse</option>
          </select>
          <select value={search.max_price} onChange={e => setSearch(s => ({ ...s, max_price: e.target.value }))}>
            <option value="">💰 Any Budget</option>
            <option value="15000">Under KES 15,000</option>
            <option value="30000">Under KES 30,000</option>
            <option value="60000">Under KES 60,000</option>
            <option value="100000">Under KES 100,000</option>
          </select>
          <button type="submit" className="search-btn">Search →</button>
        </form>
      </div>

      {/* Stats */}
      <div style={{ background: '#fff', display: 'flex', justifyContent: 'center', gap: 60, padding: '20px 32px', borderBottom: '1px solid #eee', flexWrap: 'wrap' }}>
        {[['620+', 'Active Listings'], ['25+', 'Neighborhoods'], ['100%', 'Verified'], ['1,200+', 'Happy Tenants']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>{n}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Listings */}
      <div className="page-wrap">
        <div className="section-title">Available Houses</div>
        <div className="section-sub">Updated daily — verified listings only</div>

        {loading ? (
          <div className="spinner">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="spinner">No listings yet. Check back soon!</div>
        ) : (
          <div className="listing-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ background: '#fff', padding: '48px 32px', marginTop: 32 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-title">How It Works</div>
          <div className="section-sub">From search to move-in in 3 steps</div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            {[['🔍', '1. Search', 'Browse verified listings by location, type, and price.'],
              ['📅', '2. Book Viewing', 'Request a viewing online. The caretaker confirms.'],
              ['🏠', '3. Move In', 'Reserve your house and get your keys.']].map(([icon, title, desc]) => (
              <div key={title} style={{ flex: 1, minWidth: 180, padding: '24px 16px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
