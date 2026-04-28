import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LOCATIONS = [
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

const BLANK = { title: '', type: '1 Bedroom', location: 'Westlands', sub_location: '', price: '', bedrooms: 1, bathrooms: 1, furnished: false, parking: false, water: false, generator: false, gated: false, description: '' };

export default function CaretakerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editListing, setEditListing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [images, setImages] = useState([]);       // new files to upload
  const [previews, setPreviews] = useState([]);   // preview URLs
  const [manageImages, setManageImages] = useState(null); // listing whose images we're managing
  const [addImages, setAddImages] = useState([]);
  const [addPreviews, setAddPreviews] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const fileRef = useRef();
  const addFileRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [l, r] = await Promise.all([
      axios.get('/api/listings/my/listings').then(r => r.data),
      axios.get('/api/bookings/requests').then(r => r.data),
    ]);
    setListings(l); setRequests(r);
    setLoading(false);
  }

  function onFileChange(e) {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  function removePreview(i) {
    setImages(imgs => imgs.filter((_, j) => j !== i));
    setPreviews(ps => ps.filter((_, j) => j !== i));
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submitListing(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    images.forEach(img => fd.append('images', img));
    try {
      if (editListing) {
        await axios.put(`/api/listings/${editListing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        // Also upload new images if any
        if (images.length > 0) {
          const imgFd = new FormData();
          images.forEach(img => imgFd.append('images', img));
          await axios.post(`/api/listings/${editListing.id}/images`, imgFd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        setMsg('Listing updated!');
      } else {
        await axios.post('/api/listings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Listing submitted for admin approval!');
      }
      setShowForm(false); setEditListing(null); setForm(BLANK); setImages([]); setPreviews([]);
      fetchAll();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to save listing.');
    }
  }

  function openEdit(listing) {
    setForm({
      title: listing.title, type: listing.type, location: listing.location,
      sub_location: listing.sub_location || '', price: listing.price,
      bedrooms: listing.bedrooms, bathrooms: listing.bathrooms,
      furnished: !!listing.furnished, parking: !!listing.parking,
      water: !!listing.water, generator: !!listing.generator,
      gated: !!listing.gated, description: listing.description || '',
    });
    setImages([]); setPreviews([]);
    setEditListing(listing);
    setShowForm(true);
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing?')) return;
    await axios.delete(`/api/listings/${id}`);
    fetchAll();
  }

  async function handleRequest(id, action) {
    await axios.patch(`/api/bookings/${id}/${action}`);
    fetchAll();
  }

  // Image management for existing listings
  async function deleteImage(listingId, imageId) {
    await axios.delete(`/api/listings/${listingId}/images/${imageId}`);
    const updated = await axios.get(`/api/listings/${listingId}`).then(r => r.data);
    setManageImages(updated);
    fetchAll();
  }

  async function setPrimary(listingId, imageId) {
    await axios.patch(`/api/listings/${listingId}/images/${imageId}/primary`);
    const updated = await axios.get(`/api/listings/${listingId}`).then(r => r.data);
    setManageImages(updated);
    fetchAll();
  }

  async function uploadMoreImages(e) {
    e.preventDefault();
    if (!addImages.length) return;
    const fd = new FormData();
    addImages.forEach(f => fd.append('images', f));
    await axios.post(`/api/listings/${manageImages.id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const updated = await axios.get(`/api/listings/${manageImages.id}`).then(r => r.data);
    setManageImages(updated);
    setAddImages([]); setAddPreviews([]);
    fetchAll();
  }

  const statusColor = { pending: 'pill-yellow', available: 'pill-green', reserved: 'pill-blue', unavailable: 'pill-red' };

  if (loading) return <div className="spinner">Loading...</div>;

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <div className="dash-sidebar">
        <div className="user-info">
          <div className="avatar">{user?.name?.[0]}</div>
          <div className="user-name">{user?.name}</div>
          <div className="user-role">Caretaker</div>
        </div>
        <nav className="dash-nav">
          {[['overview','📊 Overview'], ['requests','📥 Booking Requests'], ['listings', '🏠 My Listings'], ['images', '🖼️ Manage Images'], ['change-password','🔐 Change Password']].map(([key, label]) => (
            <a key={key} href="#" className={tab === key ? 'active' : ''} onClick={e => { e.preventDefault(); setTab(key); }}>
              {label} {key === 'requests' && requests.length > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 20, marginLeft: 4 }}>{requests.length}</span>}
            </a>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="dash-main">
        {/* ALERT BANNER FOR PENDING REQUESTS */}
        {requests.length > 0 && tab !== 'requests' && (
          <div style={{ background: '#fef3c7', border: '2px solid #fcd34d', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32, flexShrink: 0 }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#92400e', marginBottom: 4 }}>
                {requests.length} New Booking Request{requests.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 13, color: '#b45309' }}>
                Tenant{requests.length > 1 ? 's' : ''} want{requests.length > 1 ? '' : 's'} to view your house{requests.length > 1 ? 's' : ''}!
              </div>
            </div>
            <button className="btn btn-green" onClick={() => setTab('requests')} style={{ flexShrink: 0, padding: '8px 16px', fontSize: 13 }}>
              View Requests →
            </button>
          </div>
        )}

        {msg && <div className="success-msg">{msg}</div>}
        {err && <div className="error-msg">{err}</div>}

        {/* ---- OVERVIEW TAB ---- */}
        {tab === 'overview' && (
          <>
            <h2>Dashboard</h2>
            <div className="sub">Welcome back, {user?.name?.split(' ')[0]} 👋</div>

            <div className="stat-row">
              <div className="stat-box">
                <div className="n">{listings.length}</div><div className="l">My Listings</div>
              </div>
              <div className="stat-box">
                <div className="n">{listings.filter(l => l.status === 'available').length}</div><div className="l">Available</div>
              </div>
              <div className="stat-box">
                <div className="n" style={{ color: '#ca8a04' }}>{listings.filter(l => l.status === 'pending').length}</div><div className="l">Pending Approval</div>
              </div>
              <div className="stat-box">
                <div className="n" style={{ color: '#dc2626' }}>{requests.length}</div><div className="l">Booking Requests</div>
              </div>
            </div>

            {requests.length > 0 && (
              <div className="table-card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 20 }}>
                <h3 style={{ color: '#dc2626' }}>⏰ Pending Viewing Requests</h3>
                {requests.map((r, i) => (
                  <div key={r.id} style={{ padding: '12px 0', borderBottom: i < requests.length - 1 ? '1px solid #fed7d7' : 'none', fontSize: 14 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{r.tenant_name} requested to view: <span style={{ color: '#16a34a' }}>{r.title}</span></div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Viewing date: {r.viewing_date} · 📞 {r.tenant_phone}</div>
                  </div>
                ))}
                <button className="btn btn-green" onClick={() => setTab('requests')} style={{ marginTop: 12 }}>
                  Review All Requests
                </button>
              </div>
            )}

            <div className="table-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ color: '#15803d' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-green" onClick={() => setTab('listings')}>+ Add New Listing</button>
                <button className="btn btn-outline" onClick={() => setTab('listings')}>Manage Listings</button>
              </div>
            </div>
          </>
        )}

        {/* ---- LISTINGS TAB ---- */}
        {tab === 'listings' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div><h2>My Listings</h2><div className="sub">Manage your properties</div></div>
              <button className="btn btn-green" onClick={() => { setShowForm(true); setEditListing(null); setForm(BLANK); setImages([]); setPreviews([]); }}>
                + Add New Listing
              </button>
            </div>

            <div className="stat-row">
              <div className="stat-box"><div className="n">{listings.length}</div><div className="l">Total</div></div>
              <div className="stat-box"><div className="n">{listings.filter(l => l.status === 'available').length}</div><div className="l">Available</div></div>
              <div className="stat-box"><div className="n" style={{ color: '#ca8a04' }}>{listings.filter(l => l.status === 'pending').length}</div><div className="l">Pending</div></div>
              <div className="stat-box"><div className="n" style={{ color: '#2563eb' }}>{listings.filter(l => l.status === 'reserved').length}</div><div className="l">Reserved</div></div>
            </div>

            {/* Add/Edit form */}
            {showForm && (
              <div className="table-card" style={{ marginBottom: 24 }}>
                <h3>{editListing ? 'Edit Listing' : 'Add New Listing'}</h3>
                <form onSubmit={submitListing}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="field"><label>Title *</label><input required value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Modern 2BR in Westlands" /></div>
                    <div className="field"><label>Type *</label>
                      <select value={form.type} onChange={e => setField('type', e.target.value)}>
                        {['Bedsitter','Studio','1 Bedroom','2 Bedrooms','3 Bedrooms','Townhouse'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Location *</label>
                      <select value={form.location} onChange={e => setField('location', e.target.value)}>
                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Sub-location / Estate</label><input value={form.sub_location} onChange={e => setField('sub_location', e.target.value)} placeholder="e.g. Brookside Drive" /></div>
                    <div className="field"><label>Rent (KES/month) *</label><input required type="number" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="45000" /></div>
                    <div className="field"><label>Bedrooms</label>
                      <select value={form.bedrooms} onChange={e => setField('bedrooms', e.target.value)}>
                        {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'Studio/Bedsitter' : n}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Bathrooms</label>
                      <select value={form.bathrooms} onChange={e => setField('bathrooms', e.target.value)}>
                        {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                    {[['furnished','✅ Furnished'], ['parking','🅿️ Parking'], ['water','💧 24/7 Water'], ['generator','⚡ Backup Power'], ['gated','🔒 Gated Estate']].map(([key, label]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form[key]} onChange={e => setField(key, e.target.checked)} style={{ accentColor: '#16a34a', width: 16, height: 16 }} />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div className="field">
                    <label>Description</label>
                    <textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe the property — size, nearby landmarks, what makes it great..." style={{ minHeight: 90 }} />
                  </div>

                  {/* Image upload */}
                  <div className="field">
                    <label>House Photos {editListing ? '(add more photos)' : ''}</label>
                    <div className="upload-area" onClick={() => fileRef.current.click()}>
                      <input type="file" ref={fileRef} multiple accept="image/*" onChange={onFileChange} />
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to upload photos</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>JPG, PNG, WebP · Max 5MB each · Up to 10 photos</div>
                    </div>
                    {previews.length > 0 && (
                      <div className="image-preview-grid">
                        {previews.map((src, i) => (
                          <div key={i} className="image-preview">
                            <img src={src} alt="" />
                            {i === 0 && <span className="primary-tag">MAIN</span>}
                            <button className="remove-btn" type="button" onClick={() => removePreview(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button type="submit" className="btn btn-green">{editListing ? 'Save Changes' : 'Submit Listing'}</button>
                    <button type="button" className="btn btn-gray" onClick={() => { setShowForm(false); setEditListing(null); }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {listings.length === 0 ? (
              <div className="spinner">No listings yet. Add your first one!</div>
            ) : (
              <div className="table-card">
                {listings.map(l => (
                  <div key={l.id} className="row-item">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                      <div style={{ width: 60, height: 50, borderRadius: 8, overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
                        {l.images?.[0]
                          ? <img src={`/uploads/${l.images.find(i => i.is_primary)?.filename || l.images[0].filename}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏠</div>
                        }
                      </div>
                      <div>
                        <div className="row-title">{l.title}</div>
                        <div className="row-sub">📍 {l.sub_location || l.location} · KES {Number(l.price).toLocaleString()}/mo · {l.images?.length || 0} photo{l.images?.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <span className={`pill ${statusColor[l.status] || 'pill-gray'}`} style={{ textTransform: 'capitalize' }}>{l.status}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-blue btn-sm" onClick={() => openEdit(l)}>Edit</button>
                      <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a' }} onClick={() => { setManageImages(l); setTab('images'); }}>Photos</button>
                      <button className="btn btn-red btn-sm" onClick={() => deleteListing(l.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- REQUESTS TAB ---- */}
        {tab === 'requests' && (
          <>
            <h2>Booking Requests</h2>
            <div className="sub">Accept or reject tenant viewing requests</div>
            <div className="table-card">
              {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No pending requests</div>
              ) : requests.map(r => (
                <div key={r.id} className="row-item">
                  <div>
                    <div className="row-title">{r.tenant_name}</div>
                    <div className="row-sub">{r.title} · {r.location} · Viewing: {r.viewing_date}</div>
                    <div className="row-sub">📞 {r.tenant_phone} · ✉️ {r.tenant_email}</div>
                    {r.message && <div className="row-sub" style={{ fontStyle: 'italic' }}>"{r.message}"</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-green btn-sm" onClick={() => handleRequest(r.id, 'confirm')}>✓ Accept</button>
                    <button className="btn btn-red btn-sm" onClick={() => handleRequest(r.id, 'reject')}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- IMAGES TAB ---- */}
        {tab === 'images' && (
          <>
            <h2>Manage Photos</h2>
            <div className="sub">Select a listing to manage its photos</div>

            {/* Listing selector */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {listings.map(l => (
                <button key={l.id} className={`btn btn-sm ${manageImages?.id === l.id ? 'btn-green' : 'btn-gray'}`}
                  onClick={() => setManageImages(l)}>
                  {l.title}
                </button>
              ))}
            </div>

            {manageImages && (
              <div className="table-card">
                <h3>Photos — {manageImages.title}</h3>

                {/* Existing images */}
                {manageImages.images?.length === 0 ? (
                  <div style={{ color: '#6b7280', marginBottom: 20 }}>No photos yet.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                    {manageImages.images?.map(img => (
                      <div key={img.id} style={{ position: 'relative', width: 120, height: 100, borderRadius: 10, overflow: 'hidden', border: `2px solid ${img.is_primary ? '#16a34a' : '#e5e7eb'}` }}>
                        <img src={`/uploads/${img.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {img.is_primary && <span style={{ position: 'absolute', bottom: 4, left: 4, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>MAIN</span>}
                        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {!img.is_primary && (
                            <button title="Set as main photo" onClick={() => setPrimary(manageImages.id, img.id)}
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 11, cursor: 'pointer' }}>★</button>
                          )}
                          <button title="Delete photo" onClick={() => deleteImage(manageImages.id, img.id)}
                            style={{ background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload more */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Upload More Photos</div>
                  <form onSubmit={uploadMoreImages}>
                    <div className="upload-area" onClick={() => addFileRef.current.click()}>
                      <input type="file" ref={addFileRef} multiple accept="image/*"
                        onChange={e => { const f = Array.from(e.target.files); setAddImages(f); setAddPreviews(f.map(x => URL.createObjectURL(x))); }} />
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                      <div style={{ fontWeight: 600 }}>Click to select photos</div>
                    </div>
                    {addPreviews.length > 0 && (
                      <div className="image-preview-grid" style={{ marginTop: 12 }}>
                        {addPreviews.map((src, i) => (
                          <div key={i} className="image-preview">
                            <img src={src} alt="" />
                            <button className="remove-btn" type="button"
                              onClick={() => { setAddImages(a => a.filter((_, j) => j !== i)); setAddPreviews(p => p.filter((_, j) => j !== i)); }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {addImages.length > 0 && (
                      <button type="submit" className="btn btn-green" style={{ marginTop: 14 }}>
                        Upload {addImages.length} Photo{addImages.length > 1 ? 's' : ''}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* ---- CHANGE PASSWORD ---- */}
        {tab === 'change-password' && (
          <>
            <h2>Change Password</h2>
            <div className="sub">Update your account password</div>
            <div className="table-card" style={{ maxWidth: 400 }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                  setErr('❌ Passwords do not match');
                  setMsg('');
                  return;
                }
                if (pwdForm.newPassword.length < 6) {
                  setErr('❌ Password must be at least 6 characters');
                  setMsg('');
                  return;
                }
                setPwdLoading(true);
                try {
                  await axios.post('/api/auth/change-password', {
                    currentPassword: pwdForm.currentPassword,
                    newPassword: pwdForm.newPassword
                  });
                  setMsg('✅ Password changed successfully!');
                  setErr('');
                  setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } catch (e) {
                  setErr('❌ ' + (e.response?.data?.error || 'Failed to change password'));
                  setMsg('');
                } finally {
                  setPwdLoading(false);
                }
              }}>
                <div className="field">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCurrentPwd ? 'text' : 'password'} placeholder="Enter current password" required
                      value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowCurrentPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700 }}>
                      {showCurrentPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPwd ? 'text' : 'password'} placeholder="Enter new password" required
                      value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700 }}>
                      {showNewPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPwd ? 'text' : 'password'} placeholder="Confirm new password" required
                      value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 700 }}>
                      {showConfirmPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-green" disabled={pwdLoading}>
                  {pwdLoading ? '⏳ Updating...' : '✓ Change Password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
