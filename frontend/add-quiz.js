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

    // Load dropdown materi
    try {
        const res = await fetch(`${API_URL}/materi`);
        const materis = await res.json();
        
        const select = document.getElementById('q_materi_id');
        select.innerHTML = '<option value="" disabled selected>-- Pilih Modul Materi --</option>';
        
        materis.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.title;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error('Gagal fetch daftar materi', error);
    }

    // Handle Submit
    document.getElementById('addQuizForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            materi_id: document.getElementById('q_materi_id').value,
            question: document.getElementById('q_question').value,
            option_a: document.getElementById('q_a').value,
            option_b: document.getElementById('q_b').value,
            option_c: document.getElementById('q_c').value,
            option_d: document.getElementById('q_d').value,
            correct_option: document.getElementById('q_correct').value,
            explanation: document.getElementById('q_explanation').value
        };

        try {
            const btn = document.getElementById('submitBtn');
            btn.textContent = 'Menyimpan...';
            btn.disabled = true;

            const res = await fetch(`${API_URL}/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Pertanyaan Kuis berhasil ditambahkan!');
                // Reset form tp biarkan materi terpilih (untuk tambah berkelanjutan)
                document.getElementById('q_question').value = '';
                document.getElementById('q_a').value = '';
                document.getElementById('q_b').value = '';
                document.getElementById('q_c').value = '';
                document.getElementById('q_d').value = '';
                document.getElementById('q_explanation').value = '';
            } else {
                alert('Gagal menambahkan soal.');
            }
        } catch (error) {
            console.error(error);
            alert('Kesalahan jaringan server.');
        } finally {
            const btn = document.getElementById('submitBtn');
            btn.textContent = 'Tambahkan Pertanyaan';
            btn.disabled = false;
        }
    });

});
