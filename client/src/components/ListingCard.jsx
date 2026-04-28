import { useNavigate } from 'react-router-dom';

const ICONS = { '1 Bedroom': '🏠', '2 Bedrooms': '🏢', '3 Bedrooms': '🏘', 'Bedsitter': '🛏', 'Studio': '🏗', 'Townhouse': '🏡' };

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const primary = listing.images?.find(i => i.is_primary) || listing.images?.[0];

  return (
    <div className="card listing-card" onClick={() => navigate(`/listings/${listing.id}`)}>
      <div className="img-wrap">
        {primary
          ? <img src={`/uploads/${primary.filename}`} alt={listing.title} />
          : <div className="img-placeholder">{ICONS[listing.type] || '🏠'}</div>
        }
        <div className="badge-wrap">
          <span className="pill pill-green" style={{ fontSize: 11 }}>Available</span>
          {listing.images?.length > 0 && (
            <span className="pill pill-blue" style={{ fontSize: 11 }}>📷 {listing.images.length}</span>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="card-title">{listing.title}</div>
        <div className="card-loc">📍 {listing.sub_location || listing.location}</div>
        <div className="card-meta">
          {listing.bedrooms > 0 && <span className="meta-chip">🛏 {listing.bedrooms} Bed{listing.bedrooms > 1 ? 's' : ''}</span>}
          {listing.bathrooms > 0 && <span className="meta-chip">🚿 {listing.bathrooms} Bath</span>}
          {listing.furnished ? <span className="meta-chip">✅ Furnished</span> : null}
          {listing.gated ? <span className="meta-chip">🔒 Gated</span> : null}
          {listing.parking ? <span className="meta-chip">🅿️ Parking</span> : null}
        </div>
        <div className="card-price">
          KES {Number(listing.price).toLocaleString()} <span>/month</span>
        </div>
        <button className="btn btn-green w-full" style={{ borderRadius: 8 }}>View Details</button>
      </div>
    </div>
  );
}
