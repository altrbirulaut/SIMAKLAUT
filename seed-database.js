// seed-database.js - Script untuk menambahkan user contoh ke database

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./simaklaut.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Sample users
const sampleUsers = [
    {
        username: 'peneliti1',
        email: 'peneliti1@simaklaut.id',
        password: 'password123',
        full_name: 'Dr. Budi Santoso, M.Si',
        institution: 'Universitas Padjadjaran',
        field_of_study: 'Oseanografi',
        phone: '+62 812 3456 7890',
        bio: 'Peneliti bidang oseanografi fisika dengan fokus pada dinamika arus laut dan pasang surut di perairan Indonesia.'
    },
    {
        username: 'mahasiswa1',
        email: 'mahasiswa1@unpad.ac.id',
        password: 'password123',
        full_name: 'Siti Nurhaliza',
        institution: 'Universitas Padjadjaran',
        field_of_study: 'Ilmu Kelautan',
        phone: '+62 813 9876 5432',
        bio: 'Mahasiswa S1 Ilmu Kelautan yang sedang meneliti dampak perubahan iklim terhadap ekosistem pesisir Banten.'
    },
    {
        username: 'bmkg_staff',
        email: 'staff@bmkg.go.id',
        password: 'password123',
        full_name: 'Ahmad Fauzi, S.Si',
        institution: 'BMKG Banten',
        field_of_study: 'Meteorologi dan Klimatologi',
        phone: '+62 21 1234 5678',
        bio: 'Staff BMKG yang bertanggung jawab atas monitoring cuaca dan iklim maritim di wilayah Banten.'
    }
];

async function seedDatabase() {
    console.log('Starting database seeding...\n');

    for (const user of sampleUsers) {
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Insert user
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO users (username, email, password, full_name, institution, field_of_study, phone, bio) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.username,
                        user.email,
                        hashedPassword,
                        user.full_name,
                        user.institution,
                        user.field_of_study,
                        user.phone,
                        user.bio
                    ],
                    function(err) {
                        if (err) {
                            if (err.message.includes('UNIQUE constraint failed')) {
                                console.log(`⚠️  User ${user.username} sudah ada, skip...`);
                                resolve();
                            } else {
                                reject(err);
                            }
                        } else {
                            console.log(`✅ User ${user.username} berhasil ditambahkan (ID: ${this.lastID})`);
                            resolve();
                        }
                    }
                );
            });
        } catch (error) {
            console.error(`❌ Error adding user ${user.username}:`, error.message);
        }
    }

    console.log('\n📊 Database seeding completed!');
    console.log('\nSample credentials untuk testing:');
    console.log('================================');
    sampleUsers.forEach(user => {
        console.log(`Username: ${user.username}`);
        console.log(`Password: ${user.password}`);
        console.log('---');
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('\nDatabase connection closed');
        }
        process.exit(0);
    });
}

// Run seeding
seedDatabase().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
});