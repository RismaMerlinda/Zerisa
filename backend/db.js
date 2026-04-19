const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'zerisa'
};

const pool = mysql.createPool(dbConfig);

// Initialize database tables if not exist
async function initDB() {
    try {
        const connection = await pool.getConnection();
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'siswa',
                kebutuhan VARCHAR(100) DEFAULT 'lainnya'
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS materi (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                simple_content TEXT,
                audio_url VARCHAR(255),
                video_url VARCHAR(255)
            )
        `);

        // Migration step: Add columns if they do not exist
        try { await connection.query('ALTER TABLE materi ADD COLUMN audio_url VARCHAR(255)'); } catch (e) {}
        try { await connection.query('ALTER TABLE materi ADD COLUMN video_url VARCHAR(255)'); } catch (e) {}

        await connection.query(`
            CREATE TABLE IF NOT EXISTS quiz (
                id INT AUTO_INCREMENT PRIMARY KEY,
                materi_id INT,
                question TEXT,
                option_a VARCHAR(255),
                option_b VARCHAR(255),
                option_c VARCHAR(255),
                option_d VARCHAR(255),
                correct_option VARCHAR(1),
                explanation TEXT
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                materi_completed INT DEFAULT 0,
                quiz_score INT DEFAULT 0,
                UNIQUE KEY unique_user (user_id)
            )
        `);

        // Check if "Sistem Pernapasan Manusia" exists
        const [rows] = await connection.query('SELECT id FROM materi WHERE title = ?', ['Sistem Pernapasan Manusia']);
        
        if (rows.length === 0) {
            // Insert Materi
            const contentPernapasan = `
<h3>1. Pengertian Sistem Pernapasan</h3>
Sistem pernapasan adalah proses ketika makhluk hidup mengambil oksigen (O2) dari udara bebas dan membuang karbon dioksida (CO2) ke luar tubuh. Oksigen sangat penting agar tubuh punya energi untuk beraktivitas.

<h3>2. Organ-Organ Pernapasan</h3>
Udara yang kita hirup masuk melewati jalan yang disebut saluran pernapasan. Urutannya adalah:
- Hidung: Tempat masuk udara pertama kali. Di sini udara disaring oleh bulu hidung.
- Faring & Laring: Saluran persimpangan dan kotak suara.
- Trakea (Batang Tenggorokan): Pipa utama udara menuju paru-paru.
- Bronkus & Bronkiolus: Cabang kembar dari trakea yang menjalar masuk ke paru-paru.
- Paru-paru (Alveolus): Kantung udara super kecil. Di alveolus inilah oksigen ditukar dengan karbon dioksida!

<h3>3. Proses Pernapasan</h3>
Pernapasan terdiri dari dua fase:
- Inspirasi: Menghirup udara. Dada kita akan mengembang karena paru-paru terisi penuh dengan udara oksigen.
- Ekspirasi: Menghembuskan udara. Dada akan mengempis karena paru-paru sedang membuang racun berupa karbon dioksida.

<h3>4. Fungsi Sistem Pernapasan</h3>
Fungsi utamanya adalah membawa pasokan oksigen kepada sel-sel darah dalam tubuh sehingga seluruh tubuh terus bertenaga. Selain itu, sistem ini berfungsi sebagai jalur membuang zat sisa hasil pembakaran tubuh yang beracun (karbon dioksida).
            `;

            const [resultItem] = await connection.query(`
                INSERT INTO materi (title, content, simple_content, video_url) 
                VALUES (?, ?, ?, ?)
            `, [
                'Sistem Pernapasan Manusia',
                contentPernapasan,
                'Manusia bernapas butuh oksigen. Oksigen dihirup lewat hidung, lalu ke paru-paru.',
                'https://www.youtube.com/embed/lScgN1qnirY'
            ]);

            const newMateriId = resultItem.insertId;

            // Insert Quiz
            await connection.query(`
                INSERT INTO quiz (materi_id, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES 
                (?, 'Apa fungsi utama dari sistem pernapasan manusia?', 'Mencerna makanan di perut', 'Memompa darah dari jantung', 'Mengambil oksigen dan membuang karbon dioksida', 'Menggerakkan otot tangan', 'c', 'Fungsi utama pernapasan adalah mengambil O2 yang penting untuk energi dalam tubuh serta membuang CO2 zat sisa metabolisme.'),
                (?, 'Organ pernapasan pertama yang dilalui udara ketika masuk ke tubuh adalah?', 'Paru-paru', 'Hidung', 'Trakea', 'Tenggorokan', 'b', 'Udara bebas pertama kali dihirup melalui rongga hidung, di mana udara akan disaring oleh bulu hidung halus.'),
                (?, 'Di bagian organ mana terjadinya proses pertukaran gas oksigen (O2) dan karbon dioksida (CO2)?', 'Bronkus', 'Alveolus', 'Faring', 'Laring', 'b', 'Alveolus adalah gelembung/kantung udara super kecil di ujung paru-paru tepat di mana pembuluh darah saling bertukar gas.'),
                (?, 'Saluran pipa panjang yang menghubungkan lariang dengan bronkus/paru-paru disebut?', 'Trakea', 'Kerongkongan', 'Lambung', 'Alveolus', 'a', 'Trakea dikenal juga sebagai batang tenggorokan yang menjadi koridor utama masuknya oksigen.'),
                (?, 'Ketika kita menghembuskan napas kuat-kuat (ekspirasi), gas apa yang kita keluarkan?', 'Oksigen (O2)', 'Zat Besi', 'Nitrogen (N2)', 'Karbon dioksida (CO2)', 'd', 'Proses ekspirasi adalah pengeluaran karbon dioksida (CO2), yang merupakan limbah hasil proses di sel tubuh.')
            `, [newMateriId, newMateriId, newMateriId, newMateriId, newMateriId]);
            
            console.log('Materi Sistem Pernapasan Manusia added successfully!');
        }

        console.log('Database verification finished.');
        connection.release();
    } catch (error) {
        console.error('Error in DB:', error);
    }
}

initDB();

module.exports = pool;
