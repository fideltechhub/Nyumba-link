import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ListingCard from '../components/ListingCard';

const AREAS = [
  'Westlands','Kilimani','Karen','Lavington','Kileleshwa','Parklands','Spring Valley',
  'Runda','Muthaiga','Gigiri','Ridgeways','Rosslyn','Loresho','Kangemi',
  'Kasarani','Roysambu','Kahawa West','Kahawa Sukari','Githurai 44','Githurai 45',
  'Ruaraka','Garden Estate','Mirema','Lucky Summer','Zimmerman',
  'Eastleigh Section 1','Eastleigh Section 2','Eastleigh Section 3',
  'Buruburu Phase 1','Buruburu Phase 2','Umoja 1','Umoja 2','Donholm',
  'Fedha Estate','Komarock Phase 1','Komarock Phase 2','Kayole','Dandora Phase 1',
  'Kariobangi North','Kariobangi South','Embakasi','Imara Daima','Pipeline',
  'Makadara','Mathare','Huruma','Ngong Road','Dagoretti','Kabete','Uthiru',
  'Ruaka','Banana','Ndenderu','Rongai','Ngong Town','Syokimau','Mlolongo',
  'Kitengela','Athi River','Juja','Ruiru','Kikuyu','Kinoo','Upper Hill',
  'South B','South C','Hurlingham','Adams Arcade','Nairobi West','Ngumo',
  'Woodley','Industrial Area','Nairobi CBD',
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || '',
    max_price: searchParams.get('max_price') || '',
    min_price: '',
    furnished: false,
    gated: false,
    parking: false,
  });

  function fetchListings(f = filters) {
    setLoading(true);
    const params = {};
    if (f.location) params.location = f.location;
    if (f.type) params.type = f.type;
    if (f.max_price) params.max_price = f.max_price;
    if (f.min_price) params.min_price = f.min_price;
    if (f.furnished) params.furnished = 'true';
    if (f.gated) params.gated = 'true';
    if (f.parking) params.parking = 'true';
    axios.get('/api/listings', { params })
      .then(r => setListings(r.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchListings(); }, []);

  function applyFilters(e) {
    e.preventDefault();
    fetchListings(filters);
  }

  function set(key, val) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 57px)' }}>
      {/* Sidebar filters */}
      <div style={{ width: 260, background: '#fff', borderRight: '1px solid #eee', padding: 24, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>🔧 Filters</div>
        <form onSubmit={applyFilters}>

          <div className="field">
            <label>Location</label>
            <select value={filters.location} onChange={e => set('location', e.target.value)}>
              <option value="">All Nairobi</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Property Type</label>
            <select value={filters.type} onChange={e => set('type', e.target.value)}>
              <option value="">Any Type</option>
              <option>Bedsitter</option>
              <option>Studio</option>
              <option>1 Bedroom</option>
              <option>2 Bedrooms</option>
              <option>3 Bedrooms</option>
              <option>Townhouse</option>
            </select>
          </div>

          <div className="field">
            <label>Min Price (KES)</label>
            <input type="number" placeholder="e.g. 5000" value={filters.min_price} onChange={e => set('min_price', e.target.value)} />
          </div>

          <div className="field">
            <label>Max Price (KES)</label>
            <input type="number" placeholder="e.g. 50000" value={filters.max_price} onChange={e => set('max_price', e.target.value)} />
          </div>

          <div className="field">
            <label>Amenities</label>
            {[['furnished', '✅ Furnished'], ['gated', '🔒 Gated Estate'], ['parking', '🅿️ Parking']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 400, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={filters[key]} onChange={e => set(key, e.target.checked)} style={{ accentColor: '#16a34a', width: 16, height: 16 }} />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" className="btn btn-green w-full">Apply Filters</button>
          <button type="button" className="btn btn-gray w-full" style={{ marginTop: 8 }}
            onClick={() => { setFilters({ location: '', type: '', max_price: '', min_price: '', furnished: false, gated: false, parking: false }); fetchListings({ location: '', type: '', max_price: '', min_price: '', furnished: false, gated: false, parking: false }); }}>
            Clear All
          </button>
        </form>
      </div>

      {/* Results */}
      <div style={{ flex: 1, padding: '24px 28px' }}>
        <div className="flex between center mb-3">
          <div style={{ fontSize: 15, color: '#6b7280' }}>
            Showing <strong style={{ color: '#1a1a2e' }}>{listings.length} houses</strong> in Nairobi
          </div>
        </div>

        {loading ? (
          <div className="spinner">Searching...</div>
        ) : listings.length === 0 ? (
          <div className="spinner">No listings match your filters. Try adjusting them.</div>
        ) : (
          <div className="listing-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
