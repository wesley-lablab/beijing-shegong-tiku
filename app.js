// ===================== 全局状态 =====================
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let quizMode = 'all';
let selectedSubjects = ['社工专业知识', '社区工作知识', '行测', '公共基础知识'];
let questionCount = 20;
let quizStartTime = 0;
let timerInterval = null;

// ===================== 初始化 =====================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  document.getElementById('page-loading').classList.add('hidden');
  document.getElementById('page-home').classList.remove('hidden');
  updateStats();
  updateBottomNav();
}

// ===================== 首页交互 =====================
function selectMode(el) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  quizMode = el.dataset.mode;
  const subjectCard = document.getElementById('subject-select-card');
  if (quizMode === 'wrong') {
    subjectCard.classList.add('hidden');
  } else {
    subjectCard.classList.remove('hidden');
  }
}

function toggleSubject(el) {
  if (quizMode === 'wrong') return;
  el.classList.toggle('selected');
  const subject = el.dataset.subject;
  if (el.classList.contains('selected')) {
    if (!selectedSubjects.includes(subject)) selectedSubjects.push(subject);
  } else {
    selectedSubjects = selectedSubjects.filter(s => s !== subject);
  }
}

function selectCount(el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  questionCount = el.dataset.count;
}

function updateStats() {
  const history = getHistory();
  const done = Object.keys(history).length;
  const correct = Object.values(history).filter(a => a.correct).length;
  const wrong = done - correct;
  document.getElementById('stat-total').textContent = allQuestions.length;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent = wrong;
}

// ===================== 本地存储 =====================
function getHistory() {
  try { return JSON.parse(localStorage.getItem('sw_history') || '{}'); } catch(e) { return {}; }
}
function saveHistory(history) {
  localStorage.setItem('sw_history', JSON.stringify(history));
}
function getWrongIds() {
  try { return JSON.parse(localStorage.getItem('sw_wrong') || '[]'); } catch(e) { return []; }
}
function saveWrongIds(ids) {
  localStorage.setItem('sw_wrong', JSON.stringify(ids));
}

// ===================== 刷题逻辑 =====================
function startQuiz() {
  if (quizMode === 'wrong') {
    const wrongIds = getWrongIds();
    if (wrongIds.length === 0) { alert('暂无错题，先去刷题吧！'); return; }
    currentQuestions = allQuestions.filter(q => wrongIds.includes(q.id));
  } else {
    let pool = allQuestions.filter(q => selectedSubjects.includes(q.subject));
    if (pool.length === 0) { alert('请至少选择一个科目！'); return; }
    pool = pool.sort(() => Math.random() - 0.5);
    currentQuestions = questionCount === 'all' ? pool : pool.slice(0, Math.min(parseInt(questionCount), pool.length));
  }
  currentIndex = 0;
  userAnswers = {};
  quizStartTime = Date.now();
  startTimer();
  showPage('page-quiz');
  renderQuestion();
}

function startQuizFromNav() {
  quizMode = 'all';
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('.mode-btn[data-mode="all"]').classList.add('selected');
  startQuiz();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('quiz-timer').textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function renderQuestion() {
  const q = currentQuestions[currentIndex];
  const container = document.getElementById('quiz-question-container');
  const total = currentQuestions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  document.getElementById('quiz-progress-text').textContent = `第 ${currentIndex + 1} / ${total} 题`;
  document.getElementById('quiz-progress-bar').style.width = `${progress}%`;

  const userAnswer = userAnswers[q.id];
  const hasAnswered = userAnswer !== undefined;

  let optionsHtml = '';
  q.options.forEach(opt => {
    const letter = opt.charAt(0);
    let cls = 'option';
    if (hasAnswered) {
      if (letter === q.answer) cls += ' correct';
      else if (letter === userAnswer.answer) cls += ' wrong';
    } else if (userAnswer && userAnswer.answer === letter) {
      cls += ' selected';
    }
    const onclick = hasAnswered ? '' : `onclick="selectOption('${letter}')"`;
    optionsHtml += `<div class="${cls}" ${onclick} data-letter="${letter}">
      <div class="option-letter">${letter}</div>
      <div class="option-text">${opt.substring(3)}</div>
    </div>`;
  });

  container.innerHTML = `
    <div class="question-card">
      <div class="question-header">
        <span class="question-num">#${q.id}</span>
        <span class="question-subject">${q.subject} · ${q.category}</span>
      </div>
      <div class="question-text">${q.question}</div>
      <div class="options">${optionsHtml}</div>
      <div class="explanation ${hasAnswered ? 'show' : ''}">
        <div class="explanation-title">答案解析</div>
        <div class="explanation-text">正确答案：<b>${q.answer}</b><br>${q.explanation}</div>
      </div>
    </div>
  `;

  document.getElementById('btn-prev').disabled = currentIndex === 0;
  document.getElementById('btn-check').classList.toggle('hidden', hasAnswered);
  document.getElementById('btn-next').classList.toggle('hidden', !hasAnswered);
}

function selectOption(letter) {
  const q = currentQuestions[currentIndex];
  const correct = letter === q.answer;
  userAnswers[q.id] = { answer: letter, correct: correct };

  // 保存到全局历史
  const history = getHistory();
  history[q.id] = { answer: letter, correct: correct, time: Date.now() };
  saveHistory(history);

  // 保存错题
  if (!correct) {
    let wrongIds = getWrongIds();
    if (!wrongIds.includes(q.id)) wrongIds.push(q.id);
    saveWrongIds(wrongIds);
  }

  renderQuestion();
  updateStats();
}

function checkAnswer() {
  const q = currentQuestions[currentIndex];
  if (!userAnswers[q.id]) { alert('请先选择一个答案！'); return; }
  renderQuestion();
}

function prevQuestion() {
  if (currentIndex > 0) { currentIndex--; renderQuestion(); }
}

function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++; renderQuestion();
  } else { endQuiz(); }
}

function endQuiz() {
  stopTimer();
  const total = currentQuestions.length;
  const correct = Object.values(userAnswers).filter(a => a.correct).length;
  const wrong = Object.keys(userAnswers).length - correct;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');

  document.getElementById('result-score').textContent = `${score}%`;
  document.getElementById('result-detail').textContent = `答对 ${correct} / ${total} 题`;
  document.getElementById('res-total').textContent = total;
  document.getElementById('res-correct').textContent = correct;
  document.getElementById('res-wrong').textContent = wrong;
  document.getElementById('res-time').textContent = `${m}:${s}`;

  showPage('page-result');
}

// ===================== 错题分析 =====================
function showAnalysis() {
  const wrongIds = getWrongIds();
  const history = getHistory();

  if (wrongIds.length === 0) {
    alert('暂无错题记录，先去刷题吧！');
    return;
  }

  const wrongQs = allQuestions.filter(q => wrongIds.includes(q.id));
  const totalAnswered = Object.keys(history).length;
  const wrongCount = wrongIds.length;
  const errorRate = totalAnswered > 0 ? Math.round((wrongCount / totalAnswered) * 100) : 0;

  // 按科目统计
  const subjectStats = {};
  wrongQs.forEach(q => {
    subjectStats[q.subject] = (subjectStats[q.subject] || 0) + 1;
  });
  const weakSubject = Object.entries(subjectStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  // 按知识点统计
  const categoryStats = {};
  wrongQs.forEach(q => {
    const key = `${q.subject}-${q.category}`;
    categoryStats[key] = (categoryStats[key] || 0) + 1;
  });

  // 更新概览
  document.getElementById('ana-total').textContent = totalAnswered;
  document.getElementById('ana-wrong').textContent = wrongCount;
  document.getElementById('ana-rate').textContent = `${errorRate}%`;
  document.getElementById('ana-weak').textContent = weakSubject;

  // 科目柱状图
  const subjectChart = document.getElementById('subject-chart');
  const maxSubject = Math.max(...Object.values(subjectStats), 1);
  subjectChart.innerHTML = Object.entries(subjectStats)
    .sort((a, b) => b[1] - a[1])
    .map(([sub, count]) => {
      const pct = Math.round((count / maxSubject) * 100);
      const color = count >= 5 ? 'red' : count >= 3 ? 'orange' : 'green';
      return `<div class="bar-item">
        <div class="bar-label">${sub.replace('知识', '')}</div>
        <div class="bar-track"><div class="bar-fill ${color}" style="width:${pct}%"></div><span class="bar-value">${count}题</span></div>
      </div>`;
    }).join('');

  // 知识点柱状图
  const categoryChart = document.getElementById('category-chart');
  const sortedCats = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCat = Math.max(...sortedCats.map(x => x[1]), 1);
  categoryChart.innerHTML = sortedCats.map(([cat, count]) => {
    const pct = Math.round((count / maxCat) * 100);
    const color = count >= 4 ? 'red' : count >= 2 ? 'orange' : 'green';
    const shortCat = cat.split('-')[1] || cat;
    return `<div class="bar-item">
      <div class="bar-label">${shortCat.substring(0, 6)}</div>
      <div class="bar-track"><div class="bar-fill ${color}" style="width:${pct}%"></div><span class="bar-value">${count}题</span></div>
    </div>`;
  }).join('');

  // 薄弱知识点
  const weakList = document.getElementById('weak-list');
  const weakItems = sortedCats.filter(([_, c]) => c >= 2).slice(0, 5);
  if (weakItems.length > 0) {
    weakList.innerHTML = weakItems.map(([cat, count]) => {
      const [sub, cate] = cat.split('-');
      return `<li>「${cate}」错了 ${count} 题（${sub}）</li>`;
    }).join('');
    document.getElementById('weak-card').classList.remove('hidden');

    // 生成建议
    const tips = [
      `您在「${weakSubject}」科目错题最多，建议优先复习该科目的基础概念和核心知识点。`,
      '针对薄弱知识点，建议重新刷相关分类的题目，加深理解。',
      '对于反复出错的题目，可以收藏到错题本，定期回顾。',
      '建议结合教材或资料，系统性地学习薄弱章节的内容。'
    ];
    document.getElementById('tip-text').innerHTML = tips.join('<br><br>');
  } else {
    document.getElementById('weak-card').classList.add('hidden');
  }

  showPage('page-analysis');
}

function showAnalysisFromNav() {
  showAnalysis();
}

// ===================== 错题本 =====================
function reviewWrong() {
  const wrongIds = getWrongIds();
  const wrongList = document.getElementById('wrong-list');
  if (wrongIds.length === 0) {
    wrongList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">暂无错题</p>';
  } else {
    let html = '';
    wrongIds.forEach(id => {
      const q = allQuestions.find(q => q.id === id);
      if (q) {
        html += `<div class="wrong-book-item" onclick="goToQuestion(${q.id})">
          <div class="wrong-book-q">[${q.subject}] ${q.question.substring(0, 45)}...</div>
          <div class="wrong-book-a">正确答案：${q.answer} · ${q.category}</div>
        </div>`;
      }
    });
    wrongList.innerHTML = html;
  }
  showPage('page-wrong');
}

function goToQuestion(id) {
  const q = allQuestions.find(q => q.id === id);
  if (!q) return;
  currentQuestions = [q];
  currentIndex = 0;
  userAnswers = {};
  showPage('page-quiz');
  renderQuestion();
}

function restartQuiz() {
  startQuiz();
}

function goHome() {
  stopTimer();
  showPage('page-home');
  updateStats();
}

function showPage(pageId) {
  ['page-loading', 'page-home', 'page-quiz', 'page-result', 'page-analysis', 'page-wrong'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(pageId).classList.remove('hidden');
  window.scrollTo(0, 0);
  updateBottomNav(pageId);
}

function updateBottomNav(activePage) {
  const nav = document.getElementById('bottom-nav');
  const showNavPages = ['page-home', 'page-wrong', 'page-analysis'];
  if (showNavPages.includes(activePage) || !activePage) {
    nav.classList.remove('hidden');
  } else {
    nav.classList.add('hidden');
  }

  // 更新active状态
  const items = nav.querySelectorAll('.bottom-nav-item');
  items.forEach(item => item.classList.remove('active'));
  if (activePage === 'page-home') items[0].classList.add('active');
  else if (activePage === 'page-analysis') items[2].classList.add('active');
  else if (activePage === 'page-wrong') items[3].classList.add('active');
}
