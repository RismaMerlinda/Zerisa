const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
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

    try {
        // Fetch Admin Stats
        const statsRes = await fetch(`${API_URL}/admin-stats`);
        const stats = await statsRes.json();
        document.getElementById('statSiswa').textContent = stats.total_siswa;
        document.getElementById('statMateri').textContent = stats.total_materi;
        document.getElementById('statQuiz').textContent = stats.total_quiz;

        // Fetch Student Progress List
        const studentsRes = await fetch(`${API_URL}/student-progress`);
        const students = await studentsRes.json();
        
        const tbody = document.getElementById('studentTableBody');
        tbody.innerHTML = '';
        
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada siswa terdaftar.</td></tr>';
        }

        students.forEach(std => {
            let badgeClass = 'umum';
            let badgeText = 'UMUM';
            
            if (std.kebutuhan === 'tunanetra') { badgeClass = 'tunanetra'; badgeText = 'TUNANETRA (Audio)'; }
            if (std.kebutuhan === 'disleksia') { badgeClass = 'disleksia'; badgeText = 'DISLEKSIA (Simple)'; }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${std.name}</td>
                <td>${std.email}</td>
                <td><span class="type-badge ${badgeClass}">${badgeText}</span></td>
                <td><b>${std.materi_completed}</b> Modul Terbaca</td>
                <td><b style="color:var(--btn-action);">${std.quiz_score}</b> Poin</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('zerisa_user');
        window.location.href = 'login.html';
    });
});
