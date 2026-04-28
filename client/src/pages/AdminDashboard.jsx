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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFilter, setUserFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [s, p, u] = await Promise.all([
      axios.get('/api/admin/stats').then(r => r.data),
      axios.get('/api/admin/listings/pending').then(r => r.data),
      axios.get('/api/admin/users').then(r => r.data),
    ]);
    setStats(s); setPending(p); setUsers(u);
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
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    images.forEach(img => fd.append('images', img));
    try {
      await axios.post('/api/admin/listings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('✓ Listing created and is now live!');
      setShowForm(false);
      setForm(BLANK);
      setImages([]);
      setPreviews([]);
      fetchAll();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to create listing.');
    }
    setSubmitting(false);
  }

  async function approveListing(id) {
    await axios.patch(`/api/admin/listings/${id}/approve`);
    setMsg('Listing approved ✓');
    fetchAll();
  }

  async function rejectListing(id) {
    await axios.patch(`/api/admin/listings/${id}/reject`);
    setMsg('Listing rejected.');
    fetchAll();
  }

  async function toggleSuspend(user) {
    await axios.patch(`/api/admin/users/${user.id}/suspend`);
    setMsg(`User ${user.is_suspended ? 'unsuspended' : 'suspended'}.`);
    setSelectedUser(null);
    fetchAll();
  }

  async function verifyUser(id) {
    await axios.patch(`/api/admin/users/${id}/verify`);
    setMsg('User verified ✓');
    fetchAll();
  }

  async function deleteUser(id) {
    if (!confirm('Permanently delete this user?')) return;
    await axios.delete(`/api/admin/users/${id}`);
    setMsg('User deleted.');
    setSelectedUser(null);
    fetchAll();
  }

  async function openUser(id) {
    const u = await axios.get(`/api/admin/users/${id}`).then(r => r.data);
    setSelectedUser(u);
  }

  const filteredUsers = users.filter(u =>
    !userFilter || u.role === userFilter
  );

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <div className="dash-sidebar">
        <div className="user-info">
          <div className="avatar" style={{ background: '#7c3aed' }}>A</div>
          <div className="user-name">Admin</div>
          <div className="user-role">Platform Admin</div>
        </div>
        <nav className="dash-nav">
          {[['overview','📊 Overview'], ['listings','🏠 Create Listing'], ['pending','⏳ Pending Listings'], ['users','👥 Users'], ['change-password','🔐 Change Password']].map(([key, label]) => (
            <a key={key} href="#" className={tab === key ? 'active' : ''}
              onClick={e => { e.preventDefault(); setTab(key); setSelectedUser(null); }}>
              {label}
              {key === 'pending' && pending.length > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 20, marginLeft: 4 }}>{pending.length}</span>
              )}
            </a>
          ))}
        </nav>
      </div>

      <div className="dash-main">
        {msg && <div className="success-msg" style={{ marginBottom: 16 }}>{msg} <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }} onClick={() => setMsg('')}>✕</button></div>}

        {/* ---- OVERVIEW ---- */}
        {tab === 'overview' && stats && (
          <>
            <h2>Admin Dashboard</h2>
            <div className="sub">Platform overview</div>
            <div className="stat-row">
              <div className="stat-box"><div className="n">{stats.total_listings}</div><div className="l">Total Listings</div></div>
              <div className="stat-box"><div className="n" style={{ color: '#ca8a04' }}>{stats.pending_listings}</div><div className="l">Pending Approval</div></div>
              <div className="stat-box"><div className="n">{stats.available_listings}</div><div className="l">Live Listings</div></div>
              <div className="stat-box"><div className="n">{stats.total_users}</div><div className="l">Total Users</div></div>
              <div className="stat-box"><div className="n">{stats.total_tenants}</div><div className="l">Tenants</div></div>
              <div className="stat-box"><div className="n">{stats.total_caretakers}</div><div className="l">Caretakers</div></div>
            </div>
            <div className="table-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ color: '#15803d' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-green" onClick={() => setTab('pending')}>Review Pending Listings ({stats.pending_listings})</button>
                <button className="btn btn-outline" onClick={() => setTab('users')}>Manage Users</button>
              </div>
            </div>
          </>
        )}

        {/* ---- CREATE LISTING ---- */}
        {tab === 'listings' && (
          <>
            <h2>Create House Listing</h2>
            <div className="sub">Add a new property to the platform</div>
            {!showForm ? (
              <div className="table-card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Ready to list a new house?</div>
                <button className="btn btn-green" onClick={() => setShowForm(true)}>+ Create Listing</button>
              </div>
            ) : (
              <div className="table-card">
                <form onSubmit={submitListing}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div className="field"><label>Title</label>
                      <input type="text" placeholder="e.g. Modern 2BR Apartment" required value={form.title} onChange={e => setField('title', e.target.value)} />
                    </div>
                    <div className="field"><label>Type</label>
                      <select value={form.type} onChange={e => setField('type', e.target.value)}>
                        {['Bedsitter', 'Studio', '1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4 Bedrooms'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Location</label>
                      <select value={form.location} onChange={e => setField('location', e.target.value)}>
                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Sub-location</label>
                      <input type="text" placeholder="e.g. Near Westgate Mall" value={form.sub_location} onChange={e => setField('sub_location', e.target.value)} />
                    </div>
                    <div className="field"><label>Price (KES/month)</label>
                      <input type="number" placeholder="50000" required value={form.price} onChange={e => setField('price', e.target.value)} />
                    </div>
                    <div className="field"><label>Bedrooms</label>
                      <input type="number" min="0" placeholder="2" value={form.bedrooms} onChange={e => setField('bedrooms', e.target.value)} />
                    </div>
                    <div className="field"><label>Bathrooms</label>
                      <input type="number" min="0" placeholder="1" value={form.bathrooms} onChange={e => setField('bathrooms', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>Amenities</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        ['furnished', '✅ Furnished'],
                        ['parking', '🅿️ Parking'],
                        ['water', '💧 24/7 Water'],
                        ['generator', '⚡ Backup Power'],
                        ['gated', '🔒 Gated Community'],
                      ].map(([k, l]) => (
                        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={form[k]} onChange={e => setField(k, e.target.checked)} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="field"><label>Description</label>
                    <textarea placeholder="Tell prospective tenants more about this property..." rows="4" value={form.description} onChange={e => setField('description', e.target.value)} style={{ resize: 'vertical' }} />
                  </div>

                  <div className="field"><label>Upload Photos (up to 10)</label>
                    <div onClick={() => fileRef.current?.click()} style={{ borderRadius: 10, border: '2px dashed #d1d5db', padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f9fafb', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
                      <div style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>Click to select images</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Supports JPG, PNG, WebP (max 5MB each)</div>
                    </div>
                    <input type="file" ref={fileRef} multiple accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
                  </div>

                  {previews.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 10 }}>{previews.length} image{previews.length > 1 ? 's' : ''} selected</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {previews.map((p, i) => (
                          <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removePreview(i)} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-green" disabled={submitting}>{submitting ? '⏳ Creating...' : '✓ Create Listing'}</button>
                    <button type="button" className="btn btn-gray" onClick={() => { setShowForm(false); setForm(BLANK); setImages([]); setPreviews([]); }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* ---- PENDING LISTINGS ---- */}
        {tab === 'pending' && (
          <>
            <h2>Pending Listings</h2>
            <div className="sub">Approve or reject listings before they go live</div>
            <div className="table-card">
              {pending.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>✓ All caught up — no pending listings</div>
              ) : pending.map(l => (
                <div key={l.id} className="row-item">
                  <div style={{ flex: 1 }}>
                    <div className="row-title">{l.title}</div>
                    <div className="row-sub">📍 {l.location} · {l.type} · KES {Number(l.price).toLocaleString()}/mo</div>
                    <div className="row-sub">By: {l.caretaker_name} ({l.caretaker_email}) · {new Date(l.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-green btn-sm" onClick={() => approveListing(l.id)}>✓ Approve</button>
                    <button className="btn btn-red btn-sm" onClick={() => rejectListing(l.id)}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- USERS ---- */}
        {tab === 'users' && !selectedUser && (
          <>
            <h2>All Users</h2>
            <div className="sub">View, verify, and manage platform users</div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['', 'All'], ['tenant', 'Tenants'], ['caretaker', 'Caretakers']].map(([val, label]) => (
                <button key={val} className={`btn btn-sm ${userFilter === val ? 'btn-green' : 'btn-gray'}`}
                  onClick={() => setUserFilter(val)}>{label}</button>
              ))}
            </div>

            <div className="table-card">
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No users found</div>
              ) : filteredUsers.map(u => (
                <div key={u.id} className="row-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.role === 'caretaker' ? '#16a34a' : '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                      {u.name[0]}
                    </div>
                    <div>
                      <div className="row-title">{u.name}</div>
                      <div className="row-sub">{u.email} · {u.phone || 'No phone'} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`pill ${u.role === 'caretaker' ? 'pill-green' : 'pill-blue'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
                  {u.is_suspended ? <span className="pill pill-red">Suspended</span> : u.is_verified ? <span className="pill pill-green">Verified</span> : null}
                  <button className="btn btn-blue btn-sm" onClick={() => openUser(u.id)}>View Details</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- USER DETAIL ---- */}
        {tab === 'users' && selectedUser && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button className="btn btn-gray btn-sm" onClick={() => setSelectedUser(null)}>← Back</button>
              <h2 style={{ margin: 0 }}>Applicant Details</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="table-card">
                <h3>Profile</h3>
                {[
                  ['Full Name', selectedUser.name],
                  ['Email', selectedUser.email],
                  ['Phone', selectedUser.phone || '—'],
                  ['Role', selectedUser.role],
                  ['National ID', selectedUser.national_id || 'Not provided'],
                  ['Joined', new Date(selectedUser.created_at).toLocaleDateString()],
                  ['Status', selectedUser.is_suspended ? '🚫 Suspended' : selectedUser.is_verified ? '✓ Verified' : 'Unverified'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="table-card">
                <h3>{selectedUser.role === 'tenant' ? 'Booking History' : 'Listings'}</h3>
                {selectedUser.role === 'tenant' && (
                  selectedUser.bookings?.length === 0
                    ? <div style={{ color: '#6b7280', fontSize: 14 }}>No bookings yet</div>
                    : selectedUser.bookings?.map(b => (
                      <div key={b.id} className="row-item" style={{ fontSize: 13 }}>
                        <div><div style={{ fontWeight: 600 }}>{b.title}</div><div style={{ color: '#999' }}>{b.location} · {b.viewing_date}</div></div>
                        <span className={`pill ${b.status === 'confirmed' ? 'pill-green' : b.status === 'rejected' ? 'pill-red' : 'pill-yellow'}`}>{b.status}</span>
                      </div>
                    ))
                )}
                {selectedUser.role === 'caretaker' && (
                  selectedUser.listings?.length === 0
                    ? <div style={{ color: '#6b7280', fontSize: 14 }}>No listings yet</div>
                    : selectedUser.listings?.map(l => (
                      <div key={l.id} className="row-item" style={{ fontSize: 13 }}>
                        <div><div style={{ fontWeight: 600 }}>{l.title}</div><div style={{ color: '#999' }}>{l.location} · KES {Number(l.price).toLocaleString()}</div></div>
                        <span className={`pill ${l.status === 'available' ? 'pill-green' : 'pill-yellow'}`}>{l.status}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {!selectedUser.is_verified && selectedUser.role === 'caretaker' && (
                <button className="btn btn-green" onClick={() => verifyUser(selectedUser.id)}>✓ Verify Caretaker</button>
              )}
              {selectedUser.id !== user?.id && (
                <>
                  <button className="btn" style={{ background: selectedUser.is_suspended ? '#f0fdf4' : '#fff7ed', color: selectedUser.is_suspended ? '#15803d' : '#c2410c' }}
                    onClick={() => toggleSuspend(selectedUser)}>
                    {selectedUser.is_suspended ? 'Unsuspend Account' : 'Suspend Account'}
                  </button>
                  <button className="btn" style={{ background: '#fef2f2', color: '#dc2626' }} onClick={() => deleteUser(selectedUser.id)}>
                    Delete Account
                  </button>
                </>
              )}
            </div>
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
                  setMsg('❌ Passwords do not match');
                  return;
                }
                if (pwdForm.newPassword.length < 6) {
                  setMsg('❌ Password must be at least 6 characters');
                  return;
                }
                setPwdLoading(true);
                try {
                  await axios.post('/api/auth/change-password', {
                    currentPassword: pwdForm.currentPassword,
                    newPassword: pwdForm.newPassword
                  });
                  setMsg('✅ Password changed successfully!');
                  setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } catch (e) {
                  setMsg('❌ ' + (e.response?.data?.error || 'Failed to change password'));
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
