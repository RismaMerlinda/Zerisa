const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const userData = localStorage.getItem('zerisa_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userData);
    document.getElementById('userNameDisplay').textContent = `Halo, ${user.name}!`;

    const urlParams = new URLSearchParams(window.location.search);
    const materiId = urlParams.get('id');

    if (!materiId) {
        document.getElementById('materiTitle').textContent = 'Materi tidak ditemukan';
        document.getElementById('tab-full').textContent = 'Silakan kembali ke dashboard.';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/materi`);
        const materis = await response.json();
        
        const materi = materis.find(m => m.id == materiId);
        if (materi) {
            document.getElementById('materiTitle').textContent = materi.title;
            
            // 1 & 2. Teks Lengkap dan Sederhana
            document.getElementById('tab-full').innerHTML = materi.content || 'Data teks akademik belum tersedia.';
            document.getElementById('tab-simple').innerHTML = materi.simple_content || 'Data ringkasan belum tersedia.';
            
            // 3. Render Audio
            if (materi.audio_url) {
                const audioSection = document.getElementById('audioSection');
                const materiAudio = document.getElementById('materiAudio');
                materiAudio.src = materi.audio_url;
                audioSection.style.display = 'block';
            }

            // 4. Render YouTube Video
            if (materi.video_url) {
                const videoSection = document.getElementById('videoSection');
                const materiVideo = document.getElementById('materiVideo');
                materiVideo.src = materi.video_url;
                videoSection.style.display = 'block';
            }

            // 5 & 6. Tampilkan Diagram dan Step-by-Step Timeline
            // Khusus ditunjukkan aktif apabila materi berkaitan dengan pernapasan
            if (materi.title.toLowerCase().includes('pernapasan')) {
                document.getElementById('diagramSection').style.display = 'block';
                document.getElementById('timelineSection').style.display = 'block';
            }

            // Bind tombol Quiz
            document.getElementById('btnGoToQuiz').addEventListener('click', () => {
                window.location.href = `quiz.html?materiId=${materi.id}`;
            });

            // Update Progress di backend
            await fetch(`${API_URL}/update-materi-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

        } else {
            document.getElementById('materiTitle').textContent = 'Materi tidak ditemukan';
            document.getElementById('tab-full').textContent = 'Materi tidak tersedia dalam database.';
        }
    } catch (error) {
        console.error('Error fetching materi details:', error);
        document.getElementById('materiTitle').textContent = 'Gagal memuat materi';
    }
});
