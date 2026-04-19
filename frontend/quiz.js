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
    const materiId = urlParams.get('materiId');

    let allQuizzes = [];
    let currentIndex = 0;
    const userAnswers = {}; // ex: { "1": "a", "2": "b" }

    try {
        let fetchUrl = `${API_URL}/quiz`;
        if (materiId) {
            fetchUrl += `?materiId=${materiId}`;
        }
        
        const response = await fetch(fetchUrl);
        allQuizzes = await response.json();
        
        if (allQuizzes.length === 0) {
            document.getElementById('quizView').innerHTML = '<h3 style="text-align:center;">Kuis tidak tersedia untuk materi ini.</h3>';
            return;
        }

        document.getElementById('totalIndexTxt').textContent = allQuizzes.length;
        renderQuestion(0);

    } catch (error) {
        console.error('Error fetching quiz:', error);
        document.getElementById('questionText').textContent = 'Gagal memuat soal.';
    }

    function renderQuestion(index) {
        const quiz = allQuizzes[index];
        document.getElementById('currentIndexTxt').textContent = index + 1;
        document.getElementById('questionText').textContent = quiz.question;

        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        const optionsList = [
            { val: 'a', text: quiz.option_a },
            { val: 'b', text: quiz.option_b },
            { val: 'c', text: quiz.option_c },
            { val: 'd', text: quiz.option_d }
        ];

        optionsList.forEach(opt => {
            if(opt.text) { // if the option isn't empty in DB
                const li = document.createElement('li');
                li.className = 'option-item';
                
                // Cek jika user sebelumnya sudah memilih (jika bisa kembali, tp di sini hanya maju)
                const isChecked = userAnswers[quiz.id.toString()] === opt.val ? 'checked' : '';

                li.innerHTML = `
                    <label class="option-label">
                        <input type="radio" name="current_q" value="${opt.val}" ${isChecked}>
                        ${opt.val.toUpperCase()}. ${opt.text}
                    </label>
                `;
                optionsContainer.appendChild(li);
            }
        });

        const nextBtn = document.getElementById('nextBtn');
        if (index === allQuizzes.length - 1) {
            nextBtn.textContent = 'Kirim Jawaban';
            nextBtn.style.backgroundColor = '#22c55e'; // Green for submit
            nextBtn.style.boxShadow = '0 5px 0px #166534';
        } else {
            nextBtn.textContent = 'Lanjut';
            // Reset to default
            nextBtn.style.backgroundColor = 'var(--btn-action)';
            nextBtn.style.boxShadow = '0 5px 0px var(--btn-action-shadow)';
        }
    }

    document.getElementById('nextBtn').addEventListener('click', async () => {
        const selected = document.querySelector('input[name="current_q"]:checked');
        if (!selected) {
            alert('Ayo pilih salah satu jawaban terlebih dahulu sebelum lanjut!');
            return;
        }

        // Save answer
        const currentQuiz = allQuizzes[currentIndex];
        userAnswers[currentQuiz.id.toString()] = selected.value;

        // Next slide or submit
        if (currentIndex < allQuizzes.length - 1) {
            currentIndex++;
            renderQuestion(currentIndex);
        } else {
            document.getElementById('nextBtn').textContent = 'Memeriksa...';
            document.getElementById('nextBtn').disabled = true;
            await submitAllAnswers();
        }
    });

    async function submitAllAnswers() {
        try {
            const response = await fetch(`${API_URL}/submit-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, answers: userAnswers })
            });
            const resultData = await response.json();

            // Sembunyikan quiz view, tampilkan result view
            document.getElementById('quizView').style.display = 'none';
            document.getElementById('resultView').style.display = 'block';

            // Animasi nilai sederhana
            document.getElementById('finalScoreDisplay').textContent = resultData.totalScore;

            // Render pembahasan
            const expContainer = document.getElementById('explanationContainer');
            expContainer.innerHTML = '';

            resultData.details.forEach((res, i) => {
                const card = document.createElement('div');
                const isBenar = res.isCorrect;
                
                card.className = isBenar ? 'explanation-card correct-card' : 'explanation-card wrong-card';
                
                const titleStr = isBenar ? 'Tepat Sekali!' : 'Ops, Kurang Tepat!';
                const answerBadgeColor = isBenar ? 'background:#bbf7d0; color:#166534;' : 'background:#fecaca; color:#991b1b;';
                
                card.innerHTML = `
                    <h4 style="font-size:1.1rem; margin-bottom:8px;">Soal ${i + 1}: ${res.question}</h4>
                    <p style="font-weight:800;">${titleStr}</p>
                    <p style="margin-top: 10px;">Jawaban Kamu: <b>${res.userAnswer ? res.userAnswer.toUpperCase() : '-'}</b></p>
                    <p>Kunci Jawaban: <b>${res.correctAnswer.toUpperCase()}</b></p>
                    
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #cbd5e1;">
                        <span style="font-weight:700;">Penjelasan:</span><br>
                        ${res.explanation}
                    </div>
                `;
                expContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Submit error:', error);
            alert('Gagal mengirim jawaban.');
            document.getElementById('nextBtn').textContent = 'Kirim Jawaban';
            document.getElementById('nextBtn').disabled = false;
        }
    }
});
