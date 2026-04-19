const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const userDataStr = localStorage.getItem('zerisa_user');
    if (!userDataStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userDataStr);
    if (user.role !== 'guru') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('userNameDisplay').textContent = `Ibu/Bapak ${user.name}`;

    // Live Preview Video YouTube 
    const videoInput = document.getElementById('m_video');
    const previewBox = document.getElementById('videoPreviewBox');
    const previewIFrame = document.getElementById('videoPreview');

    videoInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && url.includes('youtube.com/embed')) {
            previewIFrame.src = url;
            previewBox.style.display = 'block';
        } else {
            previewBox.style.display = 'none';
            previewIFrame.src = '';
        }
    });

    // Form Submit
    document.getElementById('addMateriForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            title: document.getElementById('m_title').value,
            content: document.getElementById('m_content').value,
            simple_content: document.getElementById('m_simple').value,
            audio_url: document.getElementById('m_audio').value,
            video_url: document.getElementById('m_video').value
        };

        try {
            const btn = document.getElementById('submitBtn');
            btn.textContent = 'Menyimpan...';
            btn.disabled = true;

            const res = await fetch(`${API_URL}/materi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Materi Inklusif berhasil diterbitkan ke database!');
                window.location.href = 'teacher-dashboard.html';
            } else {
                alert('Gagal menerbitkan materi.');
            }
        } catch (error) {
            console.error(error);
            alert('Kesalahan server');
        } finally {
            const btn = document.getElementById('submitBtn');
            btn.textContent = 'Publikasikan Materi';
            btn.disabled = false;
        }
    });
});
