const express = require('express');
const cors = require('cors');
const db = require('./db'); 

const app = express();
const PORT = 3000;

const path = require('path');

app.use(cors());
app.use(express.json());

// Melayani file HTML/CSS/JS frontend secara langsung di port 3000
app.use(express.static(path.join(__dirname, '../frontend')));


// 1. Register & Login (Tetap)
app.post('/register', async (req, res) => {
    const { name, email, password, role, kebutuhan } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, kebutuhan) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role || 'siswa', kebutuhan || 'lainnya']
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register. Email might already exist.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (users.length > 0) {
            const user = users[0];
            delete user.password;
            res.json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// 2. Fetch All Materi (General)
app.get('/materi', async (req, res) => {
    try {
        const [materi] = await db.query('SELECT * FROM materi');
        res.json(materi);
    } catch (error) {
        console.error('Fetch materi error:', error);
        res.status(500).json({ error: 'Failed to fetch materi' });
    }
});

// Backward compatibility untuk siswa berkebutuhan (Multi Access Output)
app.get('/materi/:kebutuhan', async (req, res) => {
    const { kebutuhan } = req.params;
    try {
        const [materi] = await db.query('SELECT * FROM materi');
        
        const formattedMateri = materi.map(item => {
            if (kebutuhan.toLowerCase() === 'tunanetra') {
                return { id: item.id, title: item.title, type: 'audio', content: item.audio_url };
            } else if (kebutuhan.toLowerCase() === 'disleksia') {
                return { id: item.id, title: item.title, type: 'text', content: item.simple_content };
            } else {
                return { id: item.id, title: item.title, type: 'text', content: item.content, video_url: item.video_url };
            }
        });
        res.json(formattedMateri);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch materi' });
    }
});

// 3. GET /quiz - Ambil semua soal (atau berdasar materiId)
app.get('/quiz', async (req, res) => {
    const { materiId } = req.query;
    try {
        let query = 'SELECT id, materi_id, question, option_a, option_b, option_c, option_d FROM quiz';
        let params = [];
        if (materiId) {
            query += ' WHERE materi_id = ?';
            params.push(materiId);
        }
        const [quizzes] = await db.query(query, params); 
        // Sengaja tidak mengirim correct_option & explanation di awal agar siswa tidak curang.
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

// 4. POST /submit-quiz - Evaluasi Jawaban & Update Progress
app.post('/submit-quiz', async (req, res) => {
    const { userId, answers } = req.body; 
    // answers structure: { "1": "a", "2": "b" } where key is quiz_id
    try {
        const [allQuizzes] = await db.query('SELECT * FROM quiz');
        let score = 0;
        let results = [];

        // Evaluasi tiap jawaban
        for (let quiz of allQuizzes) {
            const userAnswer = answers[quiz.id.toString()];
            const isCorrect = userAnswer === quiz.correct_option;
            
            if (isCorrect) score += 10; // Setiap jawaban benar dapat 10 poin

            results.push({
                quizId: quiz.id,
                question: quiz.question,
                userAnswer: userAnswer || null,
                correctAnswer: quiz.correct_option,
                isCorrect: isCorrect,
                explanation: quiz.explanation
            });
        }

        // Update progress user di tabel user_progress
        if (userId) {
            await db.query(`
                INSERT INTO user_progress (user_id, quiz_score) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE quiz_score = ?
            `, [userId, score, score]);
        }

        res.json({ totalScore: score, details: results });
    } catch (error) {
        console.error('Submit quiz err:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// 5. GET /progress/:userId
app.get('/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [progress] = await db.query('SELECT materi_completed, quiz_score FROM user_progress WHERE user_id = ?', [userId]);
        if (progress.length > 0) {
            res.json(progress[0]);
        } else {
            // Default response jika belum ada histori
            res.json({ materi_completed: 0, quiz_score: 0 });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// 6. POST /update-materi-progress - Tandai materi sudah dibuka
app.post('/update-materi-progress', async (req, res) => {
    const { userId } = req.body;
    try {
        await db.query(`
            INSERT INTO user_progress (user_id, materi_completed) 
            VALUES (?, 1) 
            ON DUPLICATE KEY UPDATE materi_completed = materi_completed + 1
        `, [userId]);
        res.json({ message: 'Progress updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update materi progress' });
    }
});

// --- TEACHER APIS ---

// 1. GET /students
app.get('/students', async (req, res) => {
    try {
        const [students] = await db.query("SELECT id, name, email, kebutuhan FROM users WHERE role = 'siswa'");
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// 2. POST /materi
app.post('/materi', async (req, res) => {
    const { title, content, simple_content, audio_url, video_url } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO materi (title, content, simple_content, audio_url, video_url) VALUES (?, ?, ?, ?, ?)',
            [title, content, simple_content, audio_url || null, video_url || null]
        );
        res.json({ message: 'Materi added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add materi' });
    }
});

// 3. POST /quiz
app.post('/quiz', async (req, res) => {
    const { materi_id, question, option_a, option_b, option_c, option_d, correct_option, explanation } = req.body;
    try {
        await db.query(
            'INSERT INTO quiz (materi_id, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [materi_id, question, option_a, option_b, option_c, option_d, correct_option, explanation]
        );
        res.json({ message: 'Quiz added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add quiz' });
    }
});

// 4. GET /student-progress
app.get('/student-progress', async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email, u.kebutuhan, IFNULL(p.materi_completed, 0) as materi_completed, IFNULL(p.quiz_score, 0) as quiz_score
            FROM users u
            LEFT JOIN user_progress p ON u.id = p.user_id
            WHERE u.role = 'siswa'
        `;
        const [progress] = await db.query(query);
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch student progress' });
    }
});

// Admin Stats for Dashboard
app.get('/admin-stats', async (req, res) => {
    try {
        const [[{total_siswa}]] = await db.query("SELECT COUNT(*) as total_siswa FROM users WHERE role = 'siswa'");
        const [[{total_materi}]] = await db.query("SELECT COUNT(*) as total_materi FROM materi");
        const [[{total_quiz}]] = await db.query("SELECT COUNT(*) as total_quiz FROM quiz");
        res.json({ total_siswa, total_materi, total_quiz });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// --- PARENT APIS ---

// 1. GET /search-student/:name
app.get('/search-student/:name', async (req, res) => {
    const { name } = req.params;
    try {
        const [students] = await db.query(
            "SELECT id, name, kebutuhan, role FROM users WHERE role = 'siswa' AND name LIKE ?", 
            [`%${name}%`]
        );
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mencari data anak' });
    }
});

// 2. GET /report/:userId
app.get('/report/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [progress] = await db.query('SELECT materi_completed, quiz_score FROM user_progress WHERE user_id = ?', [userId]);
        
        let reportData = progress.length > 0 ? progress[0] : { materi_completed: 0, quiz_score: 0 };
        
        let report = {
            materi_completed: reportData.materi_completed,
            quiz_score: reportData.quiz_score,
            aktivitas_hari_ini: reportData.materi_completed > 0 ? "Membaca modul pembelajaran interaktif dan mengasah materi." : "Belum ada rekaman aktivitas belajar pada hari ini.",
            materi_terakhir: reportData.materi_completed > 0 ? "Modul Terpublikasi Edukasi Zerisa" : "-",
            waktu_belajar: reportData.materi_completed > 0 ? "Baru Saja (Dalam hari yang sama)" : "-"
        };
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat rapor' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

