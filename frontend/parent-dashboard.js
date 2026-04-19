const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const userDataStr = localStorage.getItem('zerisa_user');
    if (!userDataStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userDataStr);
    
    // Normalisasi check role
    if (user.role !== 'orang tua' && user.role !== 'orang_tua' && user.role !== 'orangtua') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('userNameDisplay').textContent = `Ortu: ${user.name}`;

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const reportView = document.getElementById('reportView');

    searchBtn.addEventListener('click', async () => {
        const name = searchInput.value.trim();
        if(!name) return;

        try {
            const res = await fetch(`${API_URL}/search-student/${encodeURIComponent(name)}`);
            if(!res.ok) throw new Error('API Error');
            const students = await res.json();
            
            searchResults.innerHTML = '';
            
            if (students.length === 0) {
                searchResults.innerHTML = '<div style="color:#e11d48; font-weight:bold; margin-top:15px;">Data anak tidak ditemukan. Pastikan ejaan nama benar.</div>';
                reportView.style.display = 'none';
                return;
            }

            // Langsung ambil anak pertama yang cocok dan tampilkan Rapornya (Tanpa list)
            const std = students[0];
            loadStudentReport(std);
            
        } catch (error) {
            console.error('Fetch search error', error);
            searchResults.innerHTML = '<div style="color:red; margin-top:15px; font-weight:bold;">Sistem gagal merespon. Pastikan sudah Restart Server Backend!</div>';
        }
    });

    async function loadStudentReport(studentData) {
        try {
            const res = await fetch(`${API_URL}/report/${studentData.id}`);
            const report = await res.json();

            // Render Header
            document.getElementById('r_nama').textContent = studentData.name;
            document.getElementById('r_kebutuhan').textContent = 'Siswa';

            // Render Metrik
            document.getElementById('r_materi').textContent = report.materi_completed;
            document.getElementById('r_score').textContent = report.quiz_score;

            // Render Progress Bar asumsi total materi adalah 5 tiap harinya
            const totalTarget = 5;
            let percent = Math.min((report.materi_completed / totalTarget) * 100, 100);
            if(report.materi_completed === 0) percent = 0;
            document.getElementById('r_materi_bar').style.width = `${percent}%`;

            // Render Aktivitas Detail
            document.getElementById('r_waktu').textContent = `Waktu Terakhir: ${report.waktu_belajar}`;
            document.getElementById('r_materi_terakhir').textContent = `Materi: ${report.materi_terakhir}`;
            document.getElementById('r_aktivitas').textContent = report.aktivitas_hari_ini;

            // Tampilkan View
            reportView.style.display = 'block';
            
        } catch(e) {
            console.error(e);
            alert('Gagal memuat rapor anak');
        }
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('zerisa_user');
        window.location.href = 'login.html';
    });
});
