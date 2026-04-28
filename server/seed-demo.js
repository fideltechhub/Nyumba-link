const { run, get } = require('./db');
const bcrypt = require('bcryptjs');

const users = [
  // Admins/Landlords
  { name: 'Kipchoge Koech', email: 'landlord1@nyumbalink.com', phone: '+254712345678', password: 'password123', role: 'admin', national_id: '12345678' },
  
  // Caretakers
  { name: 'David Kimani', email: 'caretaker1@nyumbalink.com', phone: '+254733445566', password: 'password123', role: 'caretaker', national_id: '87654321' },
  { name: 'Mary Wanjiru', email: 'caretaker2@nyumbalink.com', phone: '+254722556677', password: 'password123', role: 'caretaker', national_id: '11223344' },
  
  // Tenants
  { name: 'John Mwangi', email: 'tenant1@nyumbalink.com', phone: '+254701234567', password: 'password123', role: 'tenant', national_id: '99887766' },
  { name: 'Sarah Njeri', email: 'tenant2@nyumbalink.com', phone: '+254702345678', password: 'password123', role: 'tenant', national_id: '55443322' },
  { name: 'Peter Kamau', email: 'tenant3@nyumbalink.com', phone: '+254703456789', password: 'password123', role: 'tenant', national_id: '33221155' },
];

async function seedUsers() {
  try {
    console.log('🌱 Seeding demo users...\n');
    
    let added = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        const existing = await get('SELECT id FROM users WHERE email = ?', [user.email]);
        
        if (existing) {
          console.log(`⚠️  Skipped: ${user.name} (${user.email}) - already exists`);
          skipped++;
        } else {
          const hash = bcrypt.hashSync(user.password, 10);
          await run(
            'INSERT INTO users (name, email, phone, password, role, national_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [user.name, user.email, user.phone, hash, user.role, user.national_id]
          );
          console.log(`✓ Added: ${user.name} (${user.email}) - ${user.role}`);
          added++;
        }
      } catch (err) {
        console.error(`✗ Error adding ${user.name}:`, err.message);
      }
    }

    console.log(`\n✓ Done! Added: ${added} users, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedUsers();
