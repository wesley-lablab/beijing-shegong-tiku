// ===================== 北京社区工作者招聘考试刷题应用 =====================
// 完整JavaScript逻辑 - 包含用户系统、刷题、备考、复习、分析等全部功能

// ===================== 全局状态 =====================
let currentUser = null;          // 当前登录用户名，null表示未登录
let currentQuestions = [];        // 当前刷题的题目列表
let currentIndex = 0;            // 当前题目索引
let userAnswers = {};             // 本轮用户答案 {questionId: answer}
let quizMode = 'all';             // 刷题模式：all / subject / wrong / review
let selectedSubjects = ['社工专业知识', '社区工作知识', '行测', '公共基础知识'];
let questionCount = 20;          // 题目数量
let quizStartTime = 0;            // 刷题开始时间
let timerInterval = null;         // 计时器引用
let wrongFilter = 'all';         // 错题本筛选：all / high-freq
let reviewFilter = 'all';        // 复习阶段筛选：all / 1 / 2 / 4 / 7 / 15 / 30

// ===================== 初始化 =====================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 隐藏加载页面
  document.getElementById('page-loading').classList.add('hidden');

  // 检查登录状态
  const savedUser = localStorage.getItem('sw_current_user');
  if (savedUser) {
    currentUser = savedUser;
    showPage('page-home');
  } else {
    showPage('page-login');
  }

  // 绑定所有事件
  bindLoginEvents();
  bindHomeEvents();
  bindQuizEvents();
  bindResultEvents();
  bindAnalysisEvents();
  bindWrongEvents();
  bindPlanEvents();
  bindReviewEvents();
  bindBottomNavEvents();
}

// ===================== 页面路由 =====================
function showPage(pageId) {
  // 所有页面ID列表
  const allPages = [
    'page-loading', 'page-login', 'page-home', 'page-quiz',
    'page-result', 'page-analysis', 'page-wrong', 'page-plan', 'page-review'
  ];

  // 隐藏所有页面
  allPages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // 显示目标页面
  const target = document.getElementById(pageId);
  if (target) target.classList.remove('hidden');

  // 滚动到顶部
  window.scrollTo(0, 0);

  // 更新底部导航
  updateBottomNav(pageId);

  // 刷题和结果页面隐藏底部导航
  const nav = document.getElementById('bottom-nav');
  if (pageId === 'page-quiz' || pageId === 'page-result') {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
  }

  // 进入页面时触发对应更新
  if (pageId === 'page-home') updateHome();
  if (pageId === 'page-plan') updatePlan();
  if (pageId === 'page-review') updateReview();
  if (pageId === 'page-wrong') updateWrongPage();
  if (pageId === 'page-analysis') updateAnalysis();
}

// ===================== 底部导航 =====================
function updateBottomNav(activePage) {
  const nav = document.getElementById('bottom-nav');
  const items = nav.querySelectorAll('.bottom-nav-item');
  items.forEach(item => item.classList.remove('active'));

  // 页面与导航tab的映射
  const pageNavMap = {
    'page-home': 'nav-home',
    'page-quiz': 'nav-quiz',
    'page-plan': 'nav-plan',
    'page-analysis': 'nav-analysis',
    'page-wrong': 'nav-wrong'
  };

  const activeNavId = pageNavMap[activePage];
  if (activeNavId) {
    const activeItem = document.getElementById(activeNavId);
    if (activeItem) activeItem.classList.add('active');
  }
}

function bindBottomNavEvents() {
  document.getElementById('nav-home').addEventListener('click', () => showPage('page-home'));
  document.getElementById('nav-quiz').addEventListener('click', () => startQuizFromNav());
  document.getElementById('nav-plan').addEventListener('click', () => showPage('page-plan'));
  document.getElementById('nav-analysis').addEventListener('click', () => showPage('page-analysis'));
  document.getElementById('nav-wrong').addEventListener('click', () => showPage('page-wrong'));
}

// ===================== 用户系统 =====================
function bindLoginEvents() {
  // 登录按钮
  document.getElementById('btn-login').addEventListener('click', handleLogin);
  // 登录密码回车
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // 注册按钮
  document.getElementById('btn-register').addEventListener('click', handleRegister);
  // 注册确认密码回车
  document.getElementById('reg-password2').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });

  // 切换到注册
  document.getElementById('link-to-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('login-switch').classList.add('hidden');
    document.getElementById('register-switch').classList.remove('hidden');
    hideLoginError();
  });

  // 切换到登录
  document.getElementById('link-to-login').addEventListener('click', () => {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-switch').classList.remove('hidden');
    document.getElementById('register-switch').classList.add('hidden');
    hideLoginError();
  });

  // 游客模式
  document.getElementById('btn-guest').addEventListener('click', handleGuestLogin);
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.add('show');
}

function hideLoginError() {
  document.getElementById('login-error').classList.remove('show');
}

function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showLoginError('请输入账号和密码');
    return;
  }

  const users = getUsers();
  const hashedPwd = simpleHash(password);

  if (!users[username] || users[username] !== hashedPwd) {
    showLoginError('账号或密码错误');
    return;
  }

  currentUser = username;
  localStorage.setItem('sw_current_user', username);
  hideLoginError();
  showPage('page-home');
}

function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;

  if (!username || username.length < 3) {
    showLoginError('账号至少需要3个字符');
    return;
  }

  if (!password || password.length < 6) {
    showLoginError('密码至少需要6个字符');
    return;
  }

  if (password !== password2) {
    showLoginError('两次输入的密码不一致');
    return;
  }

  const users = getUsers();
  if (users[username]) {
    showLoginError('该账号已被注册');
    return;
  }

  users[username] = simpleHash(password);
  saveUsers(users);

  currentUser = username;
  localStorage.setItem('sw_current_user', username);
  hideLoginError();
  showPage('page-home');
}

function handleGuestLogin() {
  currentUser = 'guest';
  localStorage.setItem('sw_current_user', 'guest');
  showPage('page-home');
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('sw_current_user');
  showPage('page-login');
}

// 简单hash函数（使用btoa）
function simpleHash(str) {
  return btoa(encodeURIComponent(str));
}

// ===================== 数据存储（每个用户独立） =====================
function getUserPrefix() {
  return currentUser ? `sw_user_${currentUser}` : 'sw_guest';
}

// 所有注册用户列表 {username: password_hash}
function getUsers() {
  try { return JSON.parse(localStorage.getItem('sw_users') || '{}'); } catch (e) { return {}; }
}
function saveUsers(users) {
  localStorage.setItem('sw_users', JSON.stringify(users));
}

// 做题记录 {questionId: {answer, correct, time, count}}
function getHistory() {
  try { return JSON.parse(localStorage.getItem(`${getUserPrefix()}_history`) || '{}'); } catch (e) { return {}; }
}
function saveHistory(history) {
  localStorage.setItem(`${getUserPrefix()}_history`, JSON.stringify(history));
}

// 错题ID列表（含错误次数）{questionId: {count, firstWrongTime}}
function getWrongIds() {
  try { return JSON.parse(localStorage.getItem(`${getUserPrefix()}_wrong`) || '{}'); } catch (e) { return {}; }
}
function saveWrongIds(wrongMap) {
  localStorage.setItem(`${getUserPrefix()}_wrong`, JSON.stringify(wrongMap));
}

// 用户设置 {examDate, ...}
function getSettings() {
  try { return JSON.parse(localStorage.getItem(`${getUserPrefix()}_settings`) || '{}'); } catch (e) { return {}; }
}
function saveSettings(settings) {
  localStorage.setItem(`${getUserPrefix()}_settings`, JSON.stringify(settings));
}

// 艾宾浩斯复习计划 {questionId: {firstWrongTime, nextReviewTime, stage, reviewCount}}
function getReviewPlan() {
  try { return JSON.parse(localStorage.getItem(`${getUserPrefix()}_review`) || '{}'); } catch (e) { return {}; }
}
function saveReviewPlan(review) {
  localStorage.setItem(`${getUserPrefix()}_review`, JSON.stringify(review));
}

// ===================== 首页 =====================
function bindHomeEvents() {
  // 刷题模式选择
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      quizMode = btn.dataset.mode;
      const subjectCard = document.getElementById('subject-select-card');
      if (quizMode === 'wrong') {
        subjectCard.classList.add('hidden');
      } else {
        subjectCard.classList.remove('hidden');
      }
    });
  });

  // 科目选择
  document.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', () => {
      if (quizMode === 'wrong') return;
      card.classList.toggle('selected');
      const subject = card.dataset.subject;
      if (card.classList.contains('selected')) {
        if (!selectedSubjects.includes(subject)) selectedSubjects.push(subject);
      } else {
        selectedSubjects = selectedSubjects.filter(s => s !== subject);
      }
    });
  });

  // 题目数量选择
  document.querySelectorAll('.filter-btn[data-count]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-count]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      questionCount = btn.dataset.count;
    });
  });

  // 开始刷题
  document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);

  // 倒计时卡片点击跳转备考页面
  document.getElementById('home-countdown-card').addEventListener('click', () => {
    showPage('page-plan');
  });
}

function updateHome() {
  updateStats();
  updateCountdown();
  updateReviewRemind();
  updateHighFreqWrong();
}

function updateStats() {
  const history = getHistory();
  const done = Object.keys(history).length;
  const correct = Object.values(history).filter(a => a.correct).length;
  const wrongMap = getWrongIds();
  const wrongCount = Object.keys(wrongMap).length;

  document.getElementById('stat-total').textContent = allQuestions.length;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent = wrongCount;
}

// ===================== 考试倒计时 =====================
function updateCountdown() {
  const settings = getSettings();
  const examDate = settings.examDate;

  if (!examDate) {
    document.getElementById('home-countdown-days').textContent = '--';
    document.getElementById('home-countdown-label').textContent = '距离考试还有';
    document.getElementById('home-countdown-date').textContent = '点击设置考试日期';
    return;
  }

  const now = new Date();
  const target = new Date(examDate + 'T00:00:00');
  const diff = target - now;

  if (diff <= 0) {
    document.getElementById('home-countdown-days').textContent = '0';
    document.getElementById('home-countdown-label').textContent = '考试日已到！';
    document.getElementById('home-countdown-date').textContent = '祝你考试顺利！';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  document.getElementById('home-countdown-days').textContent = days;
  document.getElementById('home-countdown-label').textContent = '天';
  document.getElementById('home-countdown-date').textContent =
    `距离 ${examDate} 还有 ${days}天 ${hours}时 ${minutes}分`;
}

// ===================== 复习提醒（首页） =====================
function updateReviewRemind() {
  const review = getReviewPlan();
  const now = Date.now();
  const remindList = document.getElementById('home-review-remind-list');

  // 找出需要复习的题目，按阶段分组
  const stages = [1, 2, 4, 7, 15, 30];
  let totalRemind = 0;
  let html = '';

  stages.forEach(stage => {
    const stageQuestions = Object.entries(review).filter(([_, info]) => {
      return info.stage === stage && info.nextReviewTime <= now;
    });
    if (stageQuestions.length > 0) {
      totalRemind += stageQuestions.length;
      html += `<li class="review-remind-item">
        <span>第${stage}天复习阶段</span>
        <span class="review-remind-count">${stageQuestions.length}题</span>
      </li>`;
    }
  });

  if (totalRemind === 0) {
    remindList.innerHTML = '<li class="review-remind-empty">暂无需要复习的题目</li>';
  } else {
    remindList.innerHTML = html;
  }
}

// ===================== 高频错题（首页） =====================
function updateHighFreqWrong() {
  const wrongMap = getWrongIds();
  const highFreqList = document.getElementById('home-high-freq-list');

  // 找出错3次以上的题目
  const highFreqIds = Object.entries(wrongMap)
    .filter(([_, info]) => info.count >= 3)
    .map(([id, _]) => parseInt(id))
    .sort((a, b) => wrongMap[b].count - wrongMap[a].count)
    .slice(0, 5);

  if (highFreqIds.length === 0) {
    highFreqList.innerHTML = '<div class="high-freq-wrong-empty">暂无高频错题，继续保持！</div>';
    return;
  }

  let html = '';
  highFreqIds.forEach(id => {
    const q = allQuestions.find(q => q.id === id);
    if (q) {
      html += `<div class="high-freq-wrong-item" data-qid="${id}">
        ${q.question.substring(0, 40)}...
        <span class="high-freq-wrong-count">错${wrongMap[id].count}次</span>
      </div>`;
    }
  });
  highFreqList.innerHTML = html;

  // 绑定点击事件 - 点击跳转到该题
  highFreqList.querySelectorAll('.high-freq-wrong-item').forEach(item => {
    item.addEventListener('click', () => {
      const qid = parseInt(item.dataset.qid);
      goToQuestion(qid);
    });
  });
}

// ===================== 刷题逻辑 =====================
function bindQuizEvents() {
  document.getElementById('btn-prev').addEventListener('click', prevQuestion);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);
  document.getElementById('btn-end-quiz').addEventListener('click', endQuiz);
}

function startQuiz() {
  if (quizMode === 'wrong') {
    // 错题模式
    const wrongMap = getWrongIds();
    const wrongIds = Object.keys(wrongMap).map(id => parseInt(id));
    if (wrongIds.length === 0) {
      alert('暂无错题，先去刷题吧！');
      return;
    }
    currentQuestions = allQuestions.filter(q => wrongIds.includes(q.id));
  } else if (quizMode === 'review') {
    // 复习模式由 startReviewQuiz 处理，不会走到这里
    return;
  } else {
    // 全部/分科模式
    let pool = allQuestions.filter(q => selectedSubjects.includes(q.subject));
    if (pool.length === 0) {
      alert('请至少选择一个科目！');
      return;
    }
    pool = pool.sort(() => Math.random() - 0.5);
    currentQuestions = questionCount === 'all'
      ? pool
      : pool.slice(0, Math.min(parseInt(questionCount), pool.length));
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
  const allModeBtn = document.querySelector('.mode-btn[data-mode="all"]');
  if (allModeBtn) allModeBtn.classList.add('selected');
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function renderQuestion() {
  const q = currentQuestions[currentIndex];
  const container = document.getElementById('quiz-question-container');
  const total = currentQuestions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  // 更新进度
  document.getElementById('quiz-progress-text').textContent = `第 ${currentIndex + 1} / ${total} 题`;
  document.getElementById('quiz-progress-bar').style.width = `${progress}%`;

  // 检查当前题是否已作答
  const userAnswer = userAnswers[q.id];
  const hasAnswered = userAnswer !== undefined;

  // 生成选项HTML（统一看答案模式：做题过程中不显示对错）
  let optionsHtml = '';
  q.options.forEach(opt => {
    const letter = opt.charAt(0);
    let cls = 'option';
    if (hasAnswered && userAnswer === letter) {
      cls += ' selected';
    }
    optionsHtml += `<div class="${cls}" data-letter="${letter}">
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
    </div>
  `;

  // 绑定选项点击事件（未作答时才可点击）
  if (!hasAnswered) {
    container.querySelectorAll('.option').forEach(optEl => {
      optEl.addEventListener('click', () => {
        selectOption(optEl.dataset.letter);
      });
    });
  }

  // 更新按钮状态
  document.getElementById('btn-prev').disabled = currentIndex === 0;
  // 统一看答案模式：隐藏查看答案按钮，只显示下一题
  document.getElementById('btn-check').classList.add('hidden');
  document.getElementById('btn-next').classList.remove('hidden');

  // 最后一题时改变按钮文字
  if (currentIndex === currentQuestions.length - 1) {
    document.getElementById('btn-next').textContent = '查看结果';
  } else {
    document.getElementById('btn-next').textContent = '下一题';
  }
}

function selectOption(letter) {
  const q = currentQuestions[currentIndex];

  // 记录答案（不立即判断对错，统一看答案模式）
  userAnswers[q.id] = letter;

  // 短暂延迟后自动跳下一题
  setTimeout(() => {
    if (currentIndex < currentQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      // 最后一题，显示查看结果按钮
      document.getElementById('btn-next').textContent = '查看结果';
      document.getElementById('btn-next').classList.remove('hidden');
    }
  }, 300);
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  stopTimer();

  const total = currentQuestions.length;
  let correctCount = 0;
  let wrongCount = 0;

  // 逐题判断对错并保存
  const history = getHistory();
  const wrongMap = getWrongIds();
  const review = getReviewPlan();

  currentQuestions.forEach(q => {
    const userAnswer = userAnswers[q.id];
    if (userAnswer === undefined) return; // 未作答的跳过

    const isCorrect = userAnswer === q.answer;

    if (isCorrect) {
      correctCount++;

      // 复习模式：答对了，进入下一复习阶段
      if (quizMode === 'review' && review[q.id]) {
        const stageIntervals = [1, 2, 4, 7, 15, 30];
        const currentIdx = stageIntervals.indexOf(review[q.id].stage);

        if (currentIdx < stageIntervals.length - 1) {
          // 进入下一阶段
          const nextStage = stageIntervals[currentIdx + 1];
          review[q.id].stage = nextStage;
          review[q.id].nextReviewTime = Date.now() + nextStage * 24 * 60 * 60 * 1000;
          review[q.id].reviewCount++;
        } else {
          // 已完成所有阶段，标记为已掌握
          delete review[q.id];
          if (wrongMap[q.id]) {
            delete wrongMap[q.id];
          }
        }
      }
    } else {
      wrongCount++;

      // 更新错题记录（含错误次数）
      if (!wrongMap[q.id]) {
        wrongMap[q.id] = { count: 1, firstWrongTime: Date.now() };
      } else {
        wrongMap[q.id].count++;
      }

      // 添加到艾宾浩斯复习计划（仅非复习模式时新增）
      if (quizMode !== 'review' && !review[q.id]) {
        review[q.id] = {
          firstWrongTime: Date.now(),
          nextReviewTime: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1天后
          stage: 1,
          reviewCount: 0
        };
      }

      // 复习模式：答错了，重新开始记忆周期
      if (quizMode === 'review' && review[q.id]) {
        review[q.id].stage = 1;
        review[q.id].nextReviewTime = Date.now() + 1 * 24 * 60 * 60 * 1000;
        review[q.id].reviewCount = 0;
      }
    }

    // 更新做题历史
    const prevRecord = history[q.id];
    history[q.id] = {
      answer: userAnswer,
      correct: isCorrect,
      time: Date.now(),
      count: (prevRecord ? prevRecord.count : 0) + 1
    };
  });

  saveHistory(history);
  saveWrongIds(wrongMap);
  saveReviewPlan(review);

  // 重置刷题模式
  const wasReview = quizMode === 'review';
  quizMode = 'all';

  // 计算统计
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');

  // 更新结果页面
  document.getElementById('result-score').textContent = `${score}%`;
  document.getElementById('result-detail').textContent = `答对 ${correctCount} / ${total} 题`;
  document.getElementById('res-total').textContent = total;
  document.getElementById('res-correct').textContent = correctCount;
  document.getElementById('res-wrong').textContent = wrongCount;
  document.getElementById('res-time').textContent = `${m}:${s}`;

  // 生成逐题答案列表（折叠模式）
  renderResultAnswers();

  showPage('page-result');
}

// ===================== 结果页面 - 逐题折叠展示 =====================
function renderResultAnswers() {
  const listEl = document.getElementById('result-answers-list');
  let html = '';

  currentQuestions.forEach((q, idx) => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer === q.answer;
    const statusClass = isCorrect ? 'correct' : 'wrong';
    const statusText = isCorrect ? '正确' : '错误';

    html += `
      <div class="answer-collapse" data-idx="${idx}">
        <div class="answer-collapse-header">
          <span>
            <span class="result-question-status ${statusClass}">${statusText}</span>
            第${idx + 1}题 · ${q.subject}
          </span>
          <span class="answer-collapse-icon">&#9660;</span>
        </div>
        <div class="answer-collapse-body">
          <div class="result-question-text">${q.question}</div>
          ${isCorrect
            ? `<div class="answer-result-correct">回答正确！</div>`
            : `<div class="answer-result-wrong">你的答案：${userAnswer || '未作答'}</div>
               <div class="answer-correct-answer">正确答案：${q.answer}</div>`
          }
          <div class="answer-explanation">${q.explanation}</div>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;

  // 绑定折叠/展开事件
  listEl.querySelectorAll('.answer-collapse-header').forEach(header => {
    header.addEventListener('click', () => {
      const collapse = header.parentElement;
      const body = collapse.querySelector('.answer-collapse-body');
      const icon = collapse.querySelector('.answer-collapse-icon');

      if (body.classList.contains('show')) {
        body.classList.remove('show');
        icon.classList.remove('open');
      } else {
        body.classList.add('show');
        icon.classList.add('open');
      }
    });
  });
}

// ===================== 结果页面事件 =====================
function bindResultEvents() {
  document.getElementById('btn-show-analysis').addEventListener('click', () => {
    showPage('page-analysis');
  });
  document.getElementById('btn-restart-quiz').addEventListener('click', () => {
    startQuiz();
  });
  document.getElementById('btn-go-home-result').addEventListener('click', () => {
    stopTimer();
    showPage('page-home');
  });
}

// ===================== 错题分析 =====================
function bindAnalysisEvents() {
  document.getElementById('btn-review-wrong-ana').addEventListener('click', () => {
    showPage('page-wrong');
  });
  document.getElementById('btn-restart-quiz-ana').addEventListener('click', () => {
    startQuiz();
  });
  document.getElementById('btn-go-home-ana').addEventListener('click', () => {
    showPage('page-home');
  });
}

function updateAnalysis() {
  const wrongMap = getWrongIds();
  const history = getHistory();
  const wrongIds = Object.keys(wrongMap).map(id => parseInt(id));

  if (wrongIds.length === 0) {
    document.getElementById('ana-total').textContent = Object.keys(history).length;
    document.getElementById('ana-wrong').textContent = 0;
    document.getElementById('ana-rate').textContent = '0%';
    document.getElementById('ana-weak').textContent = '-';
    document.getElementById('subject-chart').innerHTML =
      '<p style="text-align:center;color:#999;padding:20px;">暂无错题数据</p>';
    document.getElementById('category-chart').innerHTML =
      '<p style="text-align:center;color:#999;padding:20px;">暂无错题数据</p>';
    document.getElementById('weak-card').classList.add('hidden');
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
}

// ===================== 错题本 =====================
function bindWrongEvents() {
  // 筛选按钮
  document.querySelectorAll('#wrong-filter-bar .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#wrong-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wrongFilter = btn.dataset.filter;
      updateWrongPage();
    });
  });

  document.getElementById('btn-go-home-wrong').addEventListener('click', () => {
    showPage('page-home');
  });
}

function updateWrongPage() {
  const wrongMap = getWrongIds();
  const wrongList = document.getElementById('wrong-list');

  // 获取错题ID列表
  let wrongIds = Object.keys(wrongMap).map(id => parseInt(id));

  // 高频错题筛选（做错3次以上）
  if (wrongFilter === 'high-freq') {
    wrongIds = wrongIds.filter(id => wrongMap[id] && wrongMap[id].count >= 3);
  }

  if (wrongIds.length === 0) {
    wrongList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">暂无错题</p>';
    return;
  }

  // 按错误次数降序排列
  wrongIds.sort((a, b) => (wrongMap[b]?.count || 0) - (wrongMap[a]?.count || 0));

  let html = '';
  wrongIds.forEach(id => {
    const q = allQuestions.find(q => q.id === id);
    if (q) {
      const isHighFreq = wrongMap[id] && wrongMap[id].count >= 3;
      const freqClass = isHighFreq ? ' high-freq' : '';
      const wrongCount = wrongMap[id] ? wrongMap[id].count : 1;
      html += `<div class="wrong-book-item${freqClass}" data-qid="${id}">
        <div class="wrong-book-q">[${q.subject}] ${q.question.substring(0, 45)}...</div>
        <div class="wrong-book-a">正确答案：${q.answer} · ${q.category}</div>
        <div class="wrong-book-meta">错误 ${wrongCount} 次</div>
      </div>`;
    }
  });
  wrongList.innerHTML = html;

  // 绑定点击事件 - 点击跳转到该题
  wrongList.querySelectorAll('.wrong-book-item').forEach(item => {
    item.addEventListener('click', () => {
      const qid = parseInt(item.dataset.qid);
      goToQuestion(qid);
    });
  });
}

function goToQuestion(id) {
  const q = allQuestions.find(q => q.id === id);
  if (!q) return;
  currentQuestions = [q];
  currentIndex = 0;
  userAnswers = {};
  quizStartTime = Date.now();
  startTimer();
  showPage('page-quiz');
  renderQuestion();
}

// ===================== 备考冲刺 =====================
function bindPlanEvents() {
  document.getElementById('btn-set-exam-date').addEventListener('click', () => {
    const dateInput = document.getElementById('exam-date-input');
    const examDate = dateInput.value;
    if (!examDate) {
      alert('请选择考试日期');
      return;
    }
    const settings = getSettings();
    settings.examDate = examDate;
    saveSettings(settings);
    updatePlan();
  });
}

function updatePlan() {
  const settings = getSettings();
  const examDate = settings.examDate;

  // 设置日期输入框的值
  if (examDate) {
    document.getElementById('exam-date-input').value = examDate;
  }

  if (!examDate) {
    document.getElementById('plan-countdown-days').textContent = '--';
    document.getElementById('plan-countdown-date').textContent = '请设置考试日期';
    document.getElementById('plan-daily-tip').textContent =
      '设置考试日期后，系统将根据剩余天数生成个性化学习建议。';
    return;
  }

  const now = new Date();
  const target = new Date(examDate + 'T00:00:00');
  const diff = target - now;
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

  // 更新倒计时
  document.getElementById('plan-countdown-days').textContent = days;
  document.getElementById('plan-countdown-date').textContent = `考试日期：${examDate}`;

  // 更新时间轴
  updateTimeline(days);

  // 更新每日学习建议
  updateDailyTip(days);

  // 更新复习提醒
  updatePlanReviewRemind();
}

function updateTimeline(days) {
  const timeline = document.getElementById('plan-timeline');
  const items = timeline.querySelectorAll('.plan-timeline-item');

  // 确定当前阶段索引
  let currentPhaseIdx = 0;
  if (days >= 60) currentPhaseIdx = 0;       // 基础夯实
  else if (days >= 30) currentPhaseIdx = 1;  // 专项突破
  else if (days >= 7) currentPhaseIdx = 2;   // 模拟冲刺
  else currentPhaseIdx = 3;                  // 考前冲刺

  // 更新每个阶段的状态和日期
  items.forEach((item, idx) => {
    item.classList.remove('current', 'completed');

    if (idx < currentPhaseIdx) {
      item.classList.add('completed');
    } else if (idx === currentPhaseIdx) {
      item.classList.add('current');
    }

    // 更新日期描述
    const dateEl = item.querySelector('.plan-timeline-date');
    if (dateEl) {
      if (idx === 0) dateEl.textContent = `剩余 ${days} 天（60天以上）`;
      else if (idx === 1) dateEl.textContent = `考前 30-60 天`;
      else if (idx === 2) dateEl.textContent = `考前 7-30 天`;
      else dateEl.textContent = `考前 0-7 天`;
    }
  });
}

function updateDailyTip(days) {
  const tipEl = document.getElementById('plan-daily-tip');
  let tip = '';

  if (days >= 60) {
    tip = `距离考试还有 ${days} 天，目前处于<b>基础夯实阶段</b>。<br><br>` +
      `建议每天完成 30 道题，全面覆盖各科目知识点。` +
      `先从社工专业知识和社区工作知识开始，打好基础。` +
      `行测和公基可以穿插练习，保持每天的学习节奏。` +
      `重点关注错题，及时整理到错题本中。`;
  } else if (days >= 30) {
    tip = `距离考试还有 ${days} 天，目前处于<b>专项突破阶段</b>。<br><br>` +
      `建议每天完成 50 道题，重点攻克薄弱科目。` +
      `分析错题本中的高频错题，针对性练习。` +
      `每天花 30 分钟复习艾宾浩斯提醒的题目。` +
      `开始做整套练习，培养答题节奏。`;
  } else if (days >= 7) {
    tip = `距离考试还有 ${days} 天，目前处于<b>模拟冲刺阶段</b>。<br><br>` +
      `建议每天完成 100 道题，以整套练习为主。` +
      `严格计时，模拟真实考试环境。` +
      `每天复习错题本和艾宾浩斯提醒的题目。` +
      `重点关注高频错题，确保不再犯同样的错误。`;
  } else {
    tip = `距离考试只有 ${days} 天，目前处于<b>考前冲刺阶段</b>。<br><br>` +
      `建议以复习错题和高频题为主，不再大量做新题。` +
      `每天完成艾宾浩斯复习提醒的所有题目。` +
      `重点背诵易混淆的知识点和法规条文。` +
      `保持良好作息，调整心态，自信应考！`;
  }

  tipEl.innerHTML = tip;
}

function updatePlanReviewRemind() {
  const review = getReviewPlan();
  const now = Date.now();
  const container = document.getElementById('plan-review-remind');

  const stages = [1, 2, 4, 7, 15, 30];
  let totalCount = 0;
  let html = '';

  stages.forEach(stage => {
    const stageQuestions = Object.entries(review).filter(([_, info]) => {
      return info.stage === stage && info.nextReviewTime <= now;
    });
    if (stageQuestions.length > 0) {
      totalCount += stageQuestions.length;
      html += `<div class="review-remind-item">
        <span>第${stage}天复习阶段</span>
        <span class="review-remind-count">${stageQuestions.length}题</span>
      </div>`;
    }
  });

  if (totalCount === 0) {
    container.innerHTML = `<div class="review-empty">
      <div class="review-empty-icon">&#128276;</div>
      <div class="review-empty-text">开始刷题后，系统将自动安排复习提醒</div>
    </div>`;
  } else {
    container.innerHTML =
      `<div style="margin-bottom:8px;font-size:0.9em;color:#ea4335;font-weight:600;">共 ${totalCount} 题需要复习</div>${html}`;
  }
}

// ===================== 艾宾浩斯记忆复习 =====================
function bindReviewEvents() {
  // 复习阶段筛选
  document.querySelectorAll('#review-filter-bar .review-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#review-filter-bar .review-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reviewFilter = btn.dataset.stage;
      updateReview();
    });
  });

  // 开始今日复习
  document.getElementById('btn-start-review').addEventListener('click', () => {
    startReviewQuiz('today');
  });

  // 复习全部
  document.getElementById('btn-review-all').addEventListener('click', () => {
    startReviewQuiz('all');
  });
}

function updateReview() {
  const review = getReviewPlan();
  const now = Date.now();
  const stages = [1, 2, 4, 7, 15, 30];

  let totalPending = 0;
  let totalDone = 0;
  let todayPending = 0;
  let overdueCount = 0;

  // 统计数据
  stages.forEach(stage => {
    Object.entries(review).forEach(([id, info]) => {
      if (info.stage === stage) {
        if (info.nextReviewTime <= now) {
          totalPending++;
          const daysDiff = Math.floor((now - info.nextReviewTime) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 0) {
            todayPending++;
          } else {
            overdueCount++;
          }
        } else {
          totalDone++;
        }
      }
    });
  });

  // 更新统计
  document.getElementById('review-total').textContent = totalPending;
  document.getElementById('review-done').textContent = totalDone;
  document.getElementById('review-today').textContent = todayPending;
  document.getElementById('review-overdue').textContent = overdueCount;

  // 渲染各阶段列表
  const hasQuestions = totalPending > 0;
  document.getElementById('review-list-container').classList.toggle('hidden', !hasQuestions);
  document.getElementById('review-empty-card').classList.toggle('hidden', hasQuestions);
  document.getElementById('review-action-card').classList.toggle('hidden', !hasQuestions);

  stages.forEach(stage => {
    const stageContainer = document.getElementById(`review-stage${stage}-list`);
    const stageCount = document.getElementById(`review-stage${stage}-count`);
    const stageSection = document.querySelector(`.review-stage-section[data-stage="${stage}"]`);

    if (!stageContainer || !stageCount || !stageSection) return;

    // 获取该阶段待复习的题目
    const stageQuestions = Object.entries(review)
      .filter(([_, info]) => {
        return info.stage === stage && info.nextReviewTime <= now;
      })
      .map(([id, info]) => ({
        id: parseInt(id),
        ...info
      }))
      .sort((a, b) => a.nextReviewTime - b.nextReviewTime);

    // 阶段筛选
    if (reviewFilter !== 'all') {
      const filterStage = parseInt(reviewFilter);
      if (filterStage !== stage) {
        stageSection.classList.add('hidden');
        return;
      } else {
        stageSection.classList.remove('hidden');
      }
    } else {
      stageSection.classList.remove('hidden');
    }

    stageCount.textContent = `${stageQuestions.length} 题`;

    if (stageQuestions.length === 0) {
      stageContainer.innerHTML = '';
      return;
    }

    const wrongMap = getWrongIds();
    let html = '';
    stageQuestions.forEach(item => {
      const q = allQuestions.find(q => q.id === item.id);
      if (!q) return;

      const wrongCount = wrongMap[item.id] ? wrongMap[item.id].count : 1;
      const isHighFreq = wrongCount >= 3;

      html += `
        <div class="review-card stage-${stage}" data-qid="${item.id}">
          <div class="review-card-question">${q.question.substring(0, 50)}...</div>
          <div class="review-card-meta">
            <span class="review-card-subject">${q.subject} · ${q.category}</span>
            <span class="review-card-date">错误${wrongCount}次${isHighFreq ? ' · 高频' : ''}</span>
          </div>
          <div class="review-card-actions">
            <button class="btn btn-primary btn-review-single" data-qid="${item.id}">复习此题</button>
            <button class="btn btn-success btn-review-mastered" data-qid="${item.id}">已掌握</button>
          </div>
        </div>
      `;
    });

    stageContainer.innerHTML = html;

    // 绑定"复习此题"事件
    stageContainer.querySelectorAll('.btn-review-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = parseInt(btn.dataset.qid);
        goToQuestion(qid);
      });
    });

    // 绑定"已掌握"事件
    stageContainer.querySelectorAll('.btn-review-mastered').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = parseInt(btn.dataset.qid);
        markAsMastered(qid);
        updateReview();
      });
    });
  });
}

// 标记题目为已掌握，从复习计划和错题本中移除
function markAsMastered(qid) {
  const review = getReviewPlan();
  if (review[qid]) {
    delete review[qid];
    saveReviewPlan(review);
  }

  // 同时从错题本移除
  const wrongMap = getWrongIds();
  if (wrongMap[qid]) {
    delete wrongMap[qid];
    saveWrongIds(wrongMap);
  }
}

// 开始复习刷题
function startReviewQuiz(mode) {
  const review = getReviewPlan();
  const now = Date.now();
  const stages = [1, 2, 4, 7, 15, 30];

  let reviewIds = [];

  stages.forEach(stage => {
    Object.entries(review).forEach(([id, info]) => {
      if (info.stage === stage && info.nextReviewTime <= now) {
        reviewIds.push(parseInt(id));
      }
    });
  });

  if (reviewIds.length === 0) {
    alert('暂无需要复习的题目');
    return;
  }

  // 如果是今日复习，只取今天到期的
  if (mode === 'today') {
    const todayIds = [];
    stages.forEach(stage => {
      Object.entries(review).forEach(([id, info]) => {
        if (info.stage === stage && info.nextReviewTime <= now) {
          const daysDiff = Math.floor((now - info.nextReviewTime) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 0) {
            todayIds.push(parseInt(id));
          }
        }
      });
    });
    if (todayIds.length > 0) {
      reviewIds = todayIds;
    }
  }

  currentQuestions = allQuestions.filter(q => reviewIds.includes(q.id));
  currentIndex = 0;
  userAnswers = {};
  quizMode = 'review'; // 标记为复习模式
  quizStartTime = Date.now();
  startTimer();
  showPage('page-quiz');
  renderQuestion();
}

// ===================== 工具函数 =====================
// 格式化时间
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 格式化日期
function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
