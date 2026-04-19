const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = localStorage.getItem('zerisa_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userData);
    
    document.getElementById('userNameDisplay').textContent = `Halo, ${user.name}!`;
    document.getElementById('welcomeGreeting').textContent = `Waktunya Belajar, ${user.name}!`;
    
    let kebutuhanTeks = 'Umum';
    if (user.kebutuhan === 'tunanetra') kebutuhanTeks = 'Audio (Tunanetra)';
    if (user.kebutuhan === 'disleksia') kebutuhanTeks = 'Sederhana (Disleksia)';
    document.getElementById('kebutuhanDisplay').textContent = `Mode Materi: ${kebutuhanTeks}`;

    // Load Progress
    try {
        const progRes = await fetch(`${API_URL}/progress/${user.id}`);
        const progress = await progRes.json();
        document.getElementById('materiProgress').textContent = progress.materi_completed;
        document.getElementById('quizScore').textContent = progress.quiz_score;
        
        // Asumsi total materi ada 5 untuk contoh progress bar. 
        const totalMateriAsums = 5; 
        const percent = Math.min((progress.materi_completed / totalMateriAsums) * 100, 100);
        document.getElementById('progressBar').style.width = `${percent}%`;
    } catch (e) {
        console.error('Failed to load progress', e);
    }

    // Load Materi List
    try {
        const response = await fetch(`${API_URL}/materi`);
        const materis = await response.json();
        
        const materiContainer = document.getElementById('materiContainer');
        materiContainer.innerHTML = ''; 

        if (materis.length === 0) {
            materiContainer.innerHTML = '<p>Belum ada materi yang tersedia.</p>';
        }

        materis.forEach(materi => {
            const card = document.createElement('div');
            card.className = 'materi-card';
            card.style.cursor = 'pointer';
            
            card.innerHTML = `
                <span class="badge">Pelajaran</span>
                <h3>${materi.title}</h3>
                <p style="margin-top:auto; font-weight:700; color:var(--btn-action);">Baca Materi</p>
            `;
            
            // Go to detail page on click
            card.addEventListener('click', () => {
                window.location.href = `materi.html?id=${materi.id}`;
            });
            
            materiContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching materi:', error);
        document.getElementById('materiContainer').innerHTML = '<p style="color:red;">Gagal memuat materi.</p>';
    }

    document.getElementById('goToQuizBtn').addEventListener('click', () => {
        window.location.href = 'quiz.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('zerisa_user');
        window.location.href = 'login.html';
    });
});
