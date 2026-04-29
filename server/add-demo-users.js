const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'nyumba_link.db'), (err) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
});

const users = [
  // Admins/Landlords
  { name: 'Kipchoge Koech', email: 'landlord1@nyumbalink.com', phone: '0712345678', password: 'password123', role: 'admin', national_id: '12345678' },
  
  // Caretakers
  { name: 'David Kimani', email: 'caretaker1@nyumbalink.com', phone: '0733445566', password: 'password123', role: 'caretaker', national_id: '87654321' },
  { name: 'Mary Wanjiru', email: 'caretaker2@nyumbalink.com', phone: '0722556677', password: 'password123', role: 'caretaker', national_id: '11223344' },
  
  // Tenants
  { name: 'John Mwangi', email: 'tenant1@nyumbalink.com', phone: '0701234567', password: 'password123', role: 'tenant', national_id: '99887766' },
  { name: 'Sarah Njeri', email: 'tenant2@nyumbalink.com', phone: '0702345678', password: 'password123', role: 'tenant', national_id: '55443322' },
  { name: 'Peter Kamau', email: 'tenant3@nyumbalink.com', phone: '0703456789', password: 'password123', role: 'tenant', national_id: '33221155' },
];

let added = 0;
let skipped = 0;

users.forEach((user) => {
  const hash = bcrypt.hashSync(user.password, 10);
  const sql = 'INSERT OR IGNORE INTO users (name, email, phone, password, role, national_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)';
  db.run(sql, [user.name, user.email, user.phone, hash, user.role, user.national_id], function(err) {
    if (err) {
      console.error('Error adding', user.name, ':', err.message);
    } else if (this.changes > 0) {
      console.log('✓ Added:', user.name, '-', user.email);
      added++;
    } else {
      console.log('- Skipped (already exists):', user.email);
      skipped++;
    }
  });
});

setTimeout(() => {
  db.close(() => {
    console.log('\n✓ Done! Added:', added, 'users, Skipped:', skipped);
    process.exit(0);
  });
}, 2000);
