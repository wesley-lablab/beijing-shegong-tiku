// ===================== 北京社区工作者招聘考试刷题应用 =====================
// 完整JavaScript逻辑 - 包含用户系统、刷题、备考、复习、分析等全部功能

// goldenQuotes 通过 script 标签加载为全局变量
const goldenQuotes = window.goldenQuotes || null;

// ===================== 全局状态 =====================
let currentUser = null;          // 当前登录用户名，null表示未登录
let currentQuestions = [];        // 当前刷题的题目列表
let currentIndex = 0;            // 当前题目索引
let userAnswers = {};             // 本轮用户答案 {questionId: answer}
let quizMode = 'all';             // 刷题模式：all / subject / wrong / review
let selectedSubjects = ['社区工作专业知识', '社会建设知识', '党务知识', '公共管理', '时事政治', '法律基础', '西城区情'];
let questionCount = 20;          // 题目数量
let quizStartTime = 0;            // 刷题开始时间
let timerInterval = null;         // 计时器引用
let wrongFilter = 'all';         // 错题本筛选：all / high-freq
let reviewFilter = 'all';        // 复习阶段筛选：all / 1 / 2 / 4 / 7 / 15 / 30
let essayFilter = 'all';          // 主观题年份筛选：all / 2021-2025
let currentEssayId = null;        // 当前查看的主观题ID

// ===================== 专业术语词典 =====================
const glossary = {
  '接诉即办': '北京市党建引领基层治理的创新机制，指快速响应市民通过12345热线等渠道反映的诉求，及时办理和反馈，做到“民有所呼、我有所应”。',
  '12345市民服务热线': '北京市统一的政府服务热线，市民可通过电话、网络等渠道反映诉求。社区工作者需对接收的工单进行处理、核实、协调解决和反馈结果。',
  '未诉先办': '在居民提出诉求之前主动发现问题并解决，是“接诉即办”的深化延伸，强调源头治理。',
  '吹哨报到': '街道乡镇遇到自身无法解决的难题时，可“吹哨”召集相关职能部门前来“报到”共同解决，是北京基层治理的重要机制。',
  '网格化管理': '将社区划分为若干网格单元，配备网格员，实现精细化管理，及时发现和解决问题。',
  '居民委员会': '居民自我管理、自我教育、自我服务的基层群众性自治组织，不是政府机关。成员由居民直接选举产生，每届任期五年。',
  '四议两公开': '党支部会提议、“两委”会商议、党员大会审议、居民代表会议或居民会议决议；决议公开、实施结果公开。',
  '居民会议': '居民自治的最高决策机构，至少每季度召开一次，讨论决定涉及全体居民利益的重要事项。',
  '街道办事处': '不设区的市、市辖区人民政府的派出机关，与居委会之间是指与被指导的关系，不是领导关系。',
  '业主大会': '由物业管理区域内全体业主组成的自治组织，代表和维护全体业主在物业管理活动中的合法权益。',
  '业主委员会': '由业主大会选举产生，代表业主行使共同管理权的组织，负责签订物业服务合同、监督物业企业等。',
  '红墙意识': '西城区特有的政治概念，指以绝对忠诚、责任担当、首善标准为核心内涵的政治意识和行动自觉。“红墙”特指中南海红墙，寓意服务中央的政治责任。',
  '七有': '幼有所育、学有所教、劳有所得、病有所医、老有所养、住有所居、弱有所扶，是北京市“接诉即办”工作的重要评价标准。',
  '五性': '便利性、宜居性、多样性、公正性、安全性，是评价社区治理成效的重要维度。',
  '接纳': '社会工作者在服务过程中对服务对象采取非评判的态度，接受服务对象的独特性，尊重其个人尊严和权利。',
  '个别化': '认识到每位服务对象都是独特的个体，具有不同的需求、背景和特点，应根据其具体情况提供有针对性的服务。',
  '自决': '社会工作者尊重服务对象自己做决定的权利和需要，鼓励和协助服务对象参与决策过程。',
  '保密': '社会工作者对服务对象的信息予以保密，但涉及生命安全等例外情况时可突破保密原则。',
  '同理心': '社会工作者设身处地地体会服务对象的感受和处境，理解其内心世界，并将这种理解传达给服务对象。',
  '个案工作': '以个人或家庭为对象，通过一对一的直接互动，运用专业知识和技巧帮助服务对象解决问题的一种社会工作方法。',
  '小组工作': '通过组织和引导小组成员之间的互动，利用小组动力帮助成员解决问题、促进成长的社工方法，发展阶段包括形成期、风暴期、规范期、成熟期、结束期。',
  '社区工作': '以社区为对象的社会工作方法，包括地区发展模式、社会策划模式、社区照顾模式和社会行动模式四种主要模式。',
  '赋权': '帮助服务对象增强自身能力、提升自我意识，认识自身的权利和力量，掌握对自己生活的控制权。',
  '社区治理': '多元主体（政府、社区组织、社会组织、居民等）共同参与，通过协商合作实现共建共治共享的治理格局。',
  '党建引领': '发挥党组织的领导核心作用，通过政治引领、组织引领、机制引领，凝聚各方力量共同参与社区治理。',
  '地区发展模式': '促进社区居民的广泛参与和互助，挖掘社区内部资源，通过居民自身的努力实现社区的改善和发展。',
  '社区照顾模式': '在社区内为有需要的老年人、残疾人等提供照顾和支持，使其能在熟悉的社区环境中生活。',
  '大党委制': '社区党组织与辖区单位党组织共建，吸纳辖区单位党组织负责人担任兼职委员，形成区域化党建格局。',
  '三社联动': '社区、社会组织、社会工作专业人才联动，通过资源整合和优势互补提升社区服务专业化水平。',
  '五社联动': '社区、社会组织、社工、社区志愿者、社会慈善资源联动，是“三社联动”的拓展和深化。',
  '枫桥经验': '依靠群众，就地化解矛盾，实现小事不出村、大事不出镇、矛盾不上交。',
  '民法典': '2021年1月1日起施行的新中国第一部以法典命名的法律，包含物权、合同、人格权、婚姻家庭、继承、侵权责任等七编。',
  '社区党组织': '党在社区的基层组织，发挥领导核心作用，引领社区治理和服务方向，不直接管理社区日常事务。',
  '党群服务中心': '党组织联系服务群众的重要阵地，为党员和群众提供党务、政务、便民、文化等综合服务。',
  '社区营造': '居民参与、共同创造社区生活，发掘社区特色，增强认同感和凝聚力。',
  '智慧社区': '利用物联网、云计算、大数据等信息技术提升社区治理和服务水平的新型社区形态。',
  '驿站式养老': '北京市推行的社区养老服务模式，在社区设立服务驿站，提供日间照料、助餐、助浴、健康指导等服务。',
  '事实无人抚养儿童': '父母双方不能或不能完全履行抚养职责的儿童，如父母重病、服刑、失踪等情形的儿童。',
  '接诉即办条例': '《北京市接诉即办工作条例》，明确承办单位应在接到诉求后2小时内响应，考核重点是响应率、解决率、满意率。',
  '每月一题': '接诉即办创新举措，每月选取群众反映强烈的共性难点问题集中攻坚解决，推动从解决一件事到解决一类事。',
  '主动治理': '社区工作者主动排查辖区内问题隐患，从源头治理，减少问题产生和诉求数量。',
  '议事协商': '通过平等对话、理性沟通、协商共识的方式解决社区公共事务和矛盾纠纷。',
};
// 术语正则匹配列表（按长度降序排列，优先匹配长词）
const glossaryTerms = Object.keys(glossary).sort((a, b) => b.length - a.length);

// ===================== 初始化 =====================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 隐藏加载页面
  document.getElementById('page-loading').classList.add('hidden');

  // 预设账号 111 和 222（密码与账号相同）
  const users = getUsers();
  if (!users['111']) {
    users['111'] = simpleHash('111');
    saveUsers(users);
  }
  if (!users['222']) {
    users['222'] = simpleHash('222');
    saveUsers(users);
  }

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
  bindEssayEvents();
}

// ===================== 页面路由 =====================
function showPage(pageId) {
  // 所有页面ID列表
  const allPages = [
    'page-loading', 'page-login', 'page-home', 'page-quiz',
    'page-result', 'page-analysis', 'page-wrong', 'page-plan', 'page-review', 'page-essay'
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
  if (pageId === 'page-essay') updateEssayList();
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

  // 跳转主观题页面
  document.getElementById('btn-go-essay').addEventListener('click', () => {
    showPage('page-essay');
  });

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

  // 退出刷题按钮
  document.getElementById('btn-quit-quiz').addEventListener('click', () => {
    if (confirm('确定要退出本次刷题吗？当前进度将不会保存。')) {
      stopTimer();
      showPage('page-home');
    }
  });
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
  const isTrueFalse = q.type === 'truefalse';

  // 更新进度
  document.getElementById('quiz-progress-text').textContent = `第 ${currentIndex + 1} / ${total} 题${isTrueFalse ? ' [判断题]' : ''}`;
  document.getElementById('quiz-progress-bar').style.width = `${progress}%`;

  // 检查当前题是否已作答
  const userAnswer = userAnswers[q.id];
  const hasAnswered = userAnswer !== undefined;

  // 为题干中的专有名词添加标注
  const highlightedQuestion = highlightTerms(q.question);

  // 生成选项HTML
  let optionsHtml = '';
  if (isTrueFalse) {
    // 判断题：只显示对/错
    ['对', '错'].forEach(letter => {
      let cls = 'option';
      if (hasAnswered && userAnswer === letter) cls += ' selected';
      optionsHtml += `<div class="${cls}" data-letter="${letter}">
        <div class="option-letter">${letter === '对' ? '✓' : '✗'}</div>
        <div class="option-text">${letter}</div>
      </div>`;
    });
  } else {
    q.options.forEach(opt => {
      const letter = opt.charAt(0);
      let cls = 'option';
      if (hasAnswered && userAnswer === letter) cls += ' selected';
      optionsHtml += `<div class="${cls}" data-letter="${letter}">
        <div class="option-letter">${letter}</div>
        <div class="option-text">${opt.substring(3)}</div>
      </div>`;
    });
  }

  container.innerHTML = `
    <div class="question-card">
      <div class="question-header">
        <span class="question-num">#${q.id}</span>
        <span class="question-subject">${q.subject} · ${q.category}${isTrueFalse ? ' · 判断题' : ''}</span>
      </div>
      <div class="question-text">${highlightedQuestion}</div>
      <div class="options">${optionsHtml}</div>
    </div>
  `;

  // 绑定术语点击事件
  container.querySelectorAll('.glossary-term').forEach(term => {
    term.addEventListener('click', (e) => {
      e.stopPropagation();
      showGlossaryPopup(term.dataset.term, term);
    });
  });

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
  document.getElementById('btn-check').classList.add('hidden');
  document.getElementById('btn-next').classList.remove('hidden');

  if (currentIndex === currentQuestions.length - 1) {
    document.getElementById('btn-next').textContent = '查看结果';
  } else {
    document.getElementById('btn-next').textContent = '下一题';
  }
}

// 高亮标注题干中的专业术语
function highlightTerms(text) {
  let result = text;
  glossaryTerms.forEach(term => {
    if (text.includes(term)) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'g');
      result = result.replace(regex, '<span class="glossary-term" data-term="$1">$1</span>');
    }
  });
  return result;
}

// 显示术语解释弹窗
function showGlossaryPopup(term, anchorEl) {
  // 移除已有弹窗
  const existing = document.querySelector('.glossary-popup');
  if (existing) existing.remove();

  const def = glossary[term];
  if (!def) return;

  const popup = document.createElement('div');
  popup.className = 'glossary-popup';
  popup.innerHTML = `<div class="glossary-popup-title">${term}</div><div class="glossary-popup-text">${def}</div>`;
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.remove();
  });
  document.body.appendChild(popup);

  // 定位弹窗
  const rect = anchorEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 290));
  const top = rect.bottom + 8;
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';

  // 点击其他地方关闭
  setTimeout(() => {
    document.addEventListener('click', function closeFn() {
      popup.remove();
      document.removeEventListener('click', closeFn);
    }, { once: true });
  }, 100);
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

// ===================== 结果页面 - 逐题折叠展示（含完整选项） =====================
function renderResultAnswers() {
  const listEl = document.getElementById('result-answers-list');
  let html = '';

  currentQuestions.forEach((q, idx) => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer === q.answer;
    const statusClass = isCorrect ? 'correct' : 'wrong';
    const statusText = isCorrect ? '正确' : '错误';
    const isTrueFalse = q.type === 'truefalse';

    // 生成选项展示HTML
    let optionsDisplayHtml = '';
    if (isTrueFalse) {
      // 判断题：显示"对"和"错"
      ['对', '错'].forEach(letter => {
        let cls = 'result-option-mini';
        if (userAnswer === letter && isCorrect) {
          cls += ' user-correct';
        } else if (userAnswer === letter && !isCorrect) {
          cls += ' user-wrong';
        } else if (q.answer === letter && !isCorrect) {
          cls += ' correct-answer';
        }
        const icon = letter === '对' ? '✓' : '✗';
        optionsDisplayHtml += `<div class="${cls}">
          <div class="result-option-letter-mini">${icon}</div>
          <div class="result-option-text-mini">${letter}</div>
        </div>`;
      });
    } else {
      // 单选题：显示所有选项
      q.options.forEach(opt => {
        const letter = opt.charAt(0);
        let cls = 'result-option-mini';
        if (userAnswer === letter && isCorrect) {
          cls += ' user-correct';
        } else if (userAnswer === letter && !isCorrect) {
          cls += ' user-wrong';
        } else if (q.answer === letter && !isCorrect) {
          cls += ' correct-answer';
        }
        optionsDisplayHtml += `<div class="${cls}">
          <div class="result-option-letter-mini">${letter}</div>
          <div class="result-option-text-mini">${opt.substring(3)}</div>
        </div>`;
      });
    }

    // 用户答案显示
    let answerInfoHtml = '';
    if (userAnswer === undefined) {
      answerInfoHtml = '<div class="answer-result-wrong">未作答</div>';
    } else if (isCorrect) {
      answerInfoHtml = '<div class="answer-result-correct">✓ 回答正确！</div>';
    } else {
      answerInfoHtml = `
        <div class="answer-result-wrong">✗ 你的选择：${userAnswer}</div>
        <div class="answer-correct-answer">✓ 正确答案：${q.answer}</div>
      `;
    }

    html += `
      <div class="answer-collapse" data-idx="${idx}">
        <div class="answer-collapse-header">
          <span>
            <span class="result-question-status ${statusClass}">${statusText}</span>
            第${idx + 1}题 · ${q.subject} · ${q.category}${isTrueFalse ? ' · 判断' : ''}
          </span>
          <span class="answer-collapse-icon">&#9660;</span>
        </div>
        <div class="answer-collapse-body">
          <div class="result-question-text">${q.question}</div>
          <div class="result-options-display">${optionsDisplayHtml}</div>
          ${answerInfoHtml}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
            <div class="answer-explanation" style="flex:1;margin-top:0;">${q.explanation}</div>
            <button class="tts-btn tts-explanation-btn" data-idx="${idx}" data-type="explanation" style="margin-left:8px;flex-shrink:0;">
              <span class="tts-icon">🔊</span>
              <span class="tts-text">朗读解析</span>
            </button>
          </div>
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

  // 绑定客观题解析语音按钮事件
  listEl.querySelectorAll('.tts-explanation-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const q = currentQuestions[idx];
      if (q && q.explanation) {
        // 为按钮生成临时唯一ID
        const tmpId = 'tts-exp-btn-' + idx;
        btn.id = tmpId;
        playTTS(q.explanation, tmpId);
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
  const weakSubjectCount = Object.entries(subjectStats).sort((a, b) => b[1] - a[1])[0]?.[1] || 0;

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
      const hasOutline = !!reviewOutlines[cate];
      return `<div class="weak-item-clickable" data-category="${cate}">
        <div class="weak-item-info">
          <div class="weak-item-name">「${cate}」错了 ${count} 题（${sub}）</div>
        </div>
        ${hasOutline
          ? '<div class="weak-item-action">📖 查看提纲</div>'
          : '<div class="weak-item-action" style="color:#999;background:#f1f3f4;">暂无提纲</div>'
        }
      </div>`;
    }).join('');
    document.getElementById('weak-card').classList.remove('hidden');

    // 绑定点击事件 - 弹出复习提纲
    weakList.querySelectorAll('.weak-item-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const cat = el.dataset.category;
        if (reviewOutlines[cat]) {
          showReviewOutline(cat);
        }
      });
    });

    // 生成建议
    const tipsHtml = `
      <div style="margin-bottom:10px;">
        <strong>📊 薄弱分析：</strong>您在「${weakSubject}」科目错题最多（${weakSubjectCount}题），建议优先复习该科目的基础概念和核心知识点。
      </div>
      <div style="margin-bottom:10px;">
        <strong>🔄 复习策略：</strong>
        <ol style="margin:6px 0 0 18px;line-height:1.8;">
          <li>先看下方知识提纲，快速梳理知识脉络</li>
          <li>点击"朗读提纲"听语音加深记忆</li>
          <li>观看推荐视频，系统学习薄弱章节</li>
          <li>重新刷相关分类的题目，巩固理解</li>
          <li>反复出错的题目收藏到错题本，定期回顾</li>
        </ol>
      </div>
      <div>
        <strong>💡 学习技巧：</strong>建议使用"费曼学习法"——学完一个知识点后，尝试用自己的话给别人讲一遍。如果讲不清楚，说明还没真正掌握，需要再复习。
      </div>
    `;
    document.getElementById('tip-text').innerHTML = tipsHtml;

    // 渲染复习资源（语音+视频）
    const resourceSection = document.getElementById('review-resource-section');
    const resourceList = document.getElementById('review-resources-list');
    if (weakItems.length > 0) {
      resourceSection.style.display = 'block';
      
      // 为每个薄弱知识点生成资源
      let resourceHtml = '';
      weakItems.forEach(([cat, count]) => {
        const [sub, cate] = cat.split('-');
        const outline = reviewOutlines[cate];
        const outlineText = outline ? outline.sections.map(s => s.title + '：' + s.items.join('、')).join('；') : '';
        
        // 知识提纲语音
        if (outlineText) {
          const safeText = outlineText.substring(0, 900);
          resourceHtml += `
            <div class="review-resource-item">
              <div class="review-resource-icon">📖</div>
              <div class="review-resource-info">
                <div class="review-resource-title">「${cate}」知识提纲</div>
                <div class="review-resource-desc">${sub} · 错${count}题 · 点击朗读提纲加深记忆</div>
              </div>
              <button type="button" class="review-resource-action audio tts-review-btn" data-tts-text="${encodeURIComponent(safeText)}">
                🔊 朗读
              </button>
            </div>`;
        }
        
        // 视频学习资源（B站搜索链接）
        const searchQuery = encodeURIComponent(`社区工作者考试 ${cate} 知识点讲解`);
        resourceHtml += `
          <div class="review-resource-item">
            <div class="review-resource-icon">🎬</div>
            <div class="review-resource-info">
              <div class="review-resource-title">「${cate}」视频讲解</div>
              <div class="review-resource-desc">在B站搜索相关教学视频，系统学习</div>
            </div>
            <a class="review-resource-action video" href="https://search.bilibili.com/all?keyword=${searchQuery}" target="_blank" rel="noopener">
              ▶ 视频
            </a>
          </div>`;
      });
      
      resourceList.innerHTML = resourceHtml;

      // 绑定语音朗读按钮事件
      resourceList.querySelectorAll('.tts-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const text = decodeURIComponent(btn.dataset.ttsText);
          playTTS(text, null);
        });
      });
    } else {
      resourceSection.style.display = 'none';
    }
  } else {
    document.getElementById('weak-card').classList.add('hidden');
  }

// 显示复习提纲弹窗
function showReviewOutline(categoryName) {
  const outline = reviewOutlines[categoryName];
  if (!outline) return;

  // 移除已有弹窗
  const existing = document.querySelector('.outline-popup-overlay');
  if (existing) existing.remove();

  let sectionsHtml = outline.sections.map(sec => {
    const itemsHtml = sec.items.map(item => `<li>${item}</li>`).join('');
    return `<div class="outline-section">
      <div class="outline-section-title">${sec.title}</div>
      <ul class="outline-section-items">${itemsHtml}</ul>
    </div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'outline-popup-overlay';
  overlay.innerHTML = `
    <div class="outline-popup">
      <div class="outline-popup-header">
        <span class="outline-popup-title">${outline.title}</span>
        <button class="outline-popup-close">✕</button>
      </div>
      <div class="outline-popup-body">${sectionsHtml}</div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('outline-popup-close')) {
      overlay.remove();
    }
  });

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // 关闭时恢复滚动
  const observer = new MutationObserver(() => {
    if (!document.querySelector('.outline-popup-overlay')) {
      document.body.style.overflow = '';
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: false });
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
  const history = getHistory();
  const wrongList = document.getElementById('wrong-list');

  // 获取错题ID列表
  let wrongIds = Object.keys(wrongMap).map(id => parseInt(id));

  // 高频错题筛选（做错3次以上）
  if (wrongFilter === 'high-freq') {
    wrongIds = wrongIds.filter(id => wrongMap[id] && wrongMap[id].count >= 3);
  }

  const studySection = document.getElementById('wrong-study-section');

  if (wrongIds.length === 0) {
    wrongList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">暂无错题</p>';
    if (studySection) studySection.style.display = 'none';
    return;
  }

  if (studySection) studySection.style.display = 'block';

  // 按错误次数降序排列
  wrongIds.sort((a, b) => (wrongMap[b]?.count || 0) - (wrongMap[a]?.count || 0));

  let html = '';
  wrongIds.forEach(id => {
    const q = allQuestions.find(q => q.id === id);
    if (!q) return;

    const isHighFreq = wrongMap[id] && wrongMap[id].count >= 3;
    const freqClass = isHighFreq ? ' high-freq' : '';
    const wrongCount = wrongMap[id] ? wrongMap[id].count : 1;
    const isTrueFalse = q.type === 'truefalse';
    const lastRecord = history[id];

    // 用户上次选的答案
    const userLastAnswer = lastRecord ? lastRecord.answer : '?';

    // 生成选项展示
    let optionsHtml = '';
    if (isTrueFalse) {
      ['对', '错'].forEach(letter => {
        let cls = 'wrong-book-full-option';
        if (letter === userLastAnswer) cls += ' user-wrong';
        if (letter === q.answer) cls += ' correct-ans';
        optionsHtml += `<div class="${cls}">${letter === '对' ? '✓' : '✗'} ${letter}</div>`;
      });
    } else if (q.options) {
      q.options.forEach(opt => {
        const letter = opt.charAt(0);
        let cls = 'wrong-book-full-option';
        if (letter === userLastAnswer) cls += ' user-wrong';
        if (letter === q.answer) cls += ' correct-ans';
        optionsHtml += `<div class="${cls}">${letter}. ${opt.substring(3)}</div>`;
      });
    }

    html += `<div class="wrong-book-item${freqClass}" data-qid="${id}">
      <div class="wrong-book-full-q">${q.question}</div>
      <div class="wrong-book-full-options">${optionsHtml}</div>
      <div class="wrong-book-full-a">
        你的选择：${userLastAnswer} &nbsp;|&nbsp; 正确答案：${q.answer} &nbsp;|&nbsp; 错误 ${wrongCount} 次
      </div>
      <div class="wrong-book-full-exp">${q.explanation.substring(0, 80)}${q.explanation.length > 80 ? '...' : ''}</div>
    </div>`;
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

// ===================== 复习提纲数据 =====================
const reviewOutlines = {
  '社区概论': {
    title: '社区概论知识提纲',
    sections: [
      { title: '一、社区的定义与特征', items: ['社区是聚居在一定地域范围内的人们所组成的社会生活共同体', '基本要素：人口、地域、组织结构、文化、心理认同', '特征：地域性、社会性、共同性、互动性'] },
      { title: '二、社区的功能', items: ['经济功能、社会化功能、社会控制功能、社会参与功能、社会支持功能'] },
      { title: '三、社区的类型', items: ['按空间：农村社区、城市社区', '按功能：居住型、商业型、工业型、文化型', '我国城市社区范围：经过体制改革后作了规模调整的居民委员会辖区'] },
      { title: '四、社区发展', items: ['社区发展目标：提高居民生活质量、促进社区参与', '社区发展原则：民主参与、互助合作、以人为本', '滕尼斯最早提出"社区"概念（1887年《社区与社会》）'] }
    ]
  },
  '社区建设': {
    title: '社区建设知识提纲',
    sections: [
      { title: '一、社区建设内涵', items: ['在党和政府领导下，依靠社区力量，利用社区资源，强化社区功能', '解决社区问题，促进社区政治、经济、文化、环境协调健康发展', '不断提高社区成员生活水平和生活质量的过程'] },
      { title: '二、社区建设原则', items: ['以人为本、服务居民', '资源共享、共驻共建', '责权统一、管理有序', '扩大民主、居民自治', '因地制宜、循序渐进'] },
      { title: '三、社区建设内容', items: ['社区服务、社区卫生、社区文化、社区环境、社区治安、社区保障'] },
      { title: '四、社区治理体系', items: ['党委领导、政府负责、社会协同、公众参与、法治保障', '构建共建共治共享的社会治理格局'] }
    ]
  },
  '社区治理': {
    title: '社区治理知识提纲',
    sections: [
      { title: '一、社区治理概念', items: ['多元主体共同参与社区公共事务的过程', '主体包括：政府、社区组织、社会组织、居民等', '核心：协商合作、共建共治共享'] },
      { title: '二、社区治理模式', items: ['行政主导型、社区自治型、混合型', '网格化管理：将社区划分为网格单元，配备网格员', '吹哨报到：街道召集职能部门共同解决问题'] },
      { title: '三、三社联动/五社联动', items: ['三社联动：社区、社会组织、社工专业人才', '五社联动：社区、社会组织、社工、志愿者、慈善资源', '目标：资源整合、优势互补、提升服务专业化'] },
      { title: '四、社区协商', items: ['议事协商：平等对话、理性沟通、协商共识', '四议两公开：党支部会提议、两委商议、党员审议、居民决议；决议公开、结果公开'] }
    ]
  },
  '接诉即办': {
    title: '接诉即办知识提纲',
    sections: [
      { title: '一、基本概念', items: ['北京市党建引领基层治理的创新机制', '核心："民有所呼、我有所应"', '承办单位接到诉求后2小时内响应', '考核重点：响应率、解决率、满意率（三率）'] },
      { title: '二、工作机制', items: ['12345市民服务热线统一受理', '街乡吹哨、部门报到', '未诉先办：主动发现问题并解决', '每月一题：每月选取共性难点问题集中攻坚'] },
      { title: '三、接诉即办条例', items: ['《北京市接诉即办工作条例》正式立法', '明确各级承办单位职责', '建立考评机制和监督机制'] },
      { title: '四、七有五性', items: ['七有：幼有所育、学有所教、劳有所得、病有所医、老有所养、住有所居、弱有所扶', '五性：便利性、宜居性、多样性、公正性、安全性', '是评价接诉即办工作成效的重要标准'] }
    ]
  },
  '居民自治': {
    title: '居民自治知识提纲',
    sections: [
      { title: '一、居民委员会', items: ['基层群众性自治组织，不是政府机关', '与街道办事处是指导与被指导关系，不是领导关系', '成员由居民直接选举产生，每届任期五年'] },
      { title: '二、居民会议', items: ['居民自治的最高决策机构', '至少每季度召开一次', '讨论决定涉及全体居民利益的重要事项'] },
      { title: '三、自治内容', items: ['办理本居住地区公益事业', '调解民间纠纷', '协助维护社会治安', '协助政府做好与居民利益相关的公共事务'] },
      { title: '四、民主决策机制', items: ['四议两公开制度', '居民议事协商制度', '业主大会与业委会制度'] }
    ]
  },
  '社区服务': {
    title: '社区服务知识提纲',
    sections: [
      { title: '一、社区服务体系', items: ['社区养老服务：驿站式养老、日间照料、助餐助浴', '社区儿童服务：儿童之家、四点半课堂', '社区助残服务、社区就业服务'] },
      { title: '二、社区服务站', items: ['执行党组织决定和居民会议决定', '办理本社区居民公共和公益事务', '维护居民合法权益'] },
      { title: '三、党群服务中心', items: ['党组织联系服务群众的重要阵地', '提供党务、政务、便民、文化等综合服务', '推动"一站式"服务和"最多跑一次"'] },
      { title: '四、智慧社区', items: ['利用物联网、云计算、大数据等信息技术', '提升社区治理和服务水平', '社区营造：发掘社区特色，增强认同感和凝聚力'] }
    ]
  },
  '党建引领': {
    title: '党建引领知识提纲',
    sections: [
      { title: '一、核心内涵', items: ['发挥党组织领导核心作用', '政治引领、组织引领、机制引领', '凝聚各方力量共同参与社区治理'] },
      { title: '二、社区党组织', items: ['党在社区的基层组织', '引领社区治理和服务方向', '不直接管理社区日常事务'] },
      { title: '三、大党委制', items: ['社区党组织与辖区单位党组织共建', '吸纳辖区单位党组织负责人担任兼职委员', '形成区域化党建格局'] },
      { title: '四、红墙意识', items: ['西城区特有的政治概念', '核心内涵：绝对忠诚、责任担当、首善标准', '"红墙"特指中南海红墙，寓意服务中央的政治责任'] }
    ]
  },
  '社会建设': {
    title: '社会建设知识提纲',
    sections: [
      { title: '一、社会建设概述', items: ['社会建设的核心：保障和改善民生', '推进社会体制改革，扩大公共服务', '完善社会管理，促进社会公平正义'] },
      { title: '二、社会治理现代化', items: ['完善党委领导、政府负责、社会协同、公众参与、法治保障的社会治理体制', '构建共建共治共享的社会治理格局', '提高社会治理社会化、法治化、智能化、专业化水平'] },
      { title: '三、民生保障体系', items: ['教育、就业、收入分配、社会保障、医疗卫生', '住有所居、老有所养、弱有所扶'] }
    ]
  },
  '社会工作价值观': {
    title: '社会工作价值观知识提纲',
    sections: [
      { title: '一、核心价值观', items: ['接纳：非评判态度，接受服务对象的独特性', '个别化：根据具体情况提供有针对性的服务', '自决：尊重服务对象自己做决定的权利', '保密：对服务对象信息予以保密（生命安全例外）', '同理心：设身处地体会服务对象的感受'] },
      { title: '二、社工伦理原则', items: ['尊重服务对象的人格尊严和权利', '促进社会公正', '诚实守信', '专业能力'] }
    ]
  },
  '个案工作': {
    title: '个案工作知识提纲',
    sections: [
      { title: '一、个案工作定义', items: ['以个人或家庭为对象的社会工作方法', '通过一对一的直接互动帮助服务对象', '运用专业知识和技巧解决问题'] },
      { title: '二、主要模式', items: ['心理社会治疗模式：关注心理因素和社会环境的交互影响', '危机介入模式：针对突发危机事件的紧急干预', '行为修正模式：通过奖励和惩罚改变不良行为'] },
      { title: '三、工作流程（五步）', items: ['接案：建立专业关系，了解基本需求', '预估：收集资料，分析问题', '计划：制定服务目标和干预方案', '介入：执行计划，提供服务', '评估与结案：评价效果，总结结案'] },
      { title: '四、会谈技巧（核心考点）', items: ['同理心回应、积极倾听、开放式提问', '澄清、反映、摘要、面质', '注意非语言沟通'] }
    ]
  },
  '小组工作': {
    title: '小组工作知识提纲',
    sections: [
      { title: '一、小组工作定义', items: ['针对有相似问题或需求的人群', '通过小组互动和小组动力帮助成员', '促进成长、解决问题、提升能力'] },
      { title: '二、小组类型（必考）', items: ['教育小组：传授知识和技能', '成长小组：促进个人成长和自我认知', '支持小组：提供情感支持和互助', '治疗小组：解决心理和行为问题'] },
      { title: '三、发展阶段（四阶段）', items: ['形成期：成员相互了解，建立信任', '风暴期：可能出现冲突和权力竞争', '规范期：建立规则，形成凝聚力', '成熟期（结束期）：完成任务，处理分离情绪'] },
      { title: '四、小组工作技巧', items: ['破冰技巧、引导技巧、调解技巧', '鼓励参与、处理沉默成员', '总结归纳、引导反思'] }
    ]
  },
  '社区工作方法': {
    title: '社区工作方法知识提纲',
    sections: [
      { title: '一、社区工作定义', items: ['以社区为服务对象的社会工作方法', '目标：解决问题、带动参与、推动治理创新、促进文明'] },
      { title: '二、社区工作模式', items: ['地区发展模式：促进居民广泛参与和互助', '社会策划模式：理性分析问题，制定解决方案', '社区照顾模式：在社区内为有需要者提供照顾', '社区行动模式：动员居民争取权益和资源'] },
      { title: '三、社区工作技巧', items: ['社区调查、社区分析', '动员居民参与、建立社区组织', '资源链接、协调合作'] }
    ]
  },
  '党章': {
    title: '党章知识提纲',
    sections: [
      { title: '一、党的性质和宗旨', items: ['中国共产党是中国工人阶级的先锋队', '同时是中国人民和中华民族的先锋队', '宗旨：全心全意为人民服务'] },
      { title: '二、党员义务', items: ['学习党的理论和知识', '贯彻执行党的路线方针政策', '坚持党和人民的利益高于一切', '自觉遵守党的纪律'] },
      { title: '三、基层党组织', items: ['党的基层组织是党在社会基层组织中的战斗堡垒', '发挥领导核心和政治核心作用', '街道社区党组织：领导本地区的工作和基层社会治理'] }
    ]
  },
  '基层党组织': {
    title: '基层党组织知识提纲',
    sections: [
      { title: '一、组织设置', items: ['社区党组织：党支部或党总支', '党员100人以上的，设立党的基层委员会', '正式党员3人以上的，成立党支部'] },
      { title: '二、主要职责', items: ['宣传和执行党的路线方针政策', '领导本地区基层社会治理', '组织党员和群众参与社区建设', '做好党员教育、管理和监督'] },
      { title: '三、三会一课', items: ['支部党员大会、支部委员会会议、党小组会', '按时上好党课'] }
    ]
  },
  '民法典': {
    title: '民法典知识提纲',
    sections: [
      { title: '一、概述', items: ['2021年1月1日起施行', '新中国第一部以法典命名的法律', '共7编：总则、物权、合同、人格权、婚姻家庭、继承、侵权责任'] },
      { title: '二、与社区相关的内容', items: ['业主的建筑物区分所有权', '物业服务合同', '相邻关系', '高空抛物责任'] },
      { title: '三、婚姻家庭编要点', items: ['结婚法定年龄：男22周岁，女20周岁', '离婚冷静期：30天', '夫妻共同财产制度'] }
    ]
  },
  '居委会组织法': {
    title: '居委会组织法知识提纲',
    sections: [
      { title: '一、居委会性质', items: ['基层群众性自治组织', '不是政府机关，不是事业单位', '与政府之间是协助与被协助的关系'] },
      { title: '二、居委会组成', items: ['由主任、副主任和委员共5-9人组成', '成员由居民选举产生，每届任期五年', '可以设下属委员会（人民调解、治安保卫等）'] },
      { title: '三、居委会任务', items: ['宣传宪法、法律、法规和国家政策', '办理本居住地区公益事业', '调解民间纠纷', '协助维护社会治安'] }
    ]
  },
  '物业管理条例': {
    title: '物业管理条例知识提纲',
    sections: [
      { title: '一、业主与业委会', items: ['业主大会：物业管理区域内全体业主组成', '业委会：由业主大会选举产生', '业委会职责：签订物业服务合同、监督物业企业'] },
      { title: '二、物业服务', items: ['物业服务合同是民事合同', '物业企业应按照合同约定提供服务', '业主应按时交纳物业服务费用'] },
      { title: '三、社区与物业关系', items: ['居委会指导和监督业委会工作', '社区党组织引领物业治理', '三方联动：居委会、业委会、物业企业'] }
    ]
  },
  '行政管理': {
    title: '行政管理知识提纲',
    sections: [
      { title: '一、政府职能', items: ['经济调节、市场监管、社会管理、公共服务、生态环境保护', '街道办事处：市辖区人民政府的派出机关', '与居委会之间是指导与被指导关系'] },
      { title: '二、行政行为', items: ['行政许可、行政处罚、行政强制、行政给付', '依法行政原则', '程序正当原则'] },
      { title: '三、政务服务', items: ['放管服改革：简政放权、放管结合、优化服务', '最多跑一次、一网通办', '12345市民服务热线'] }
    ]
  },
  '公共政策': {
    title: '公共政策知识提纲',
    sections: [
      { title: '一、公共政策过程', items: ['政策制定：发现问题→议程设置→方案设计→方案抉择', '政策执行：将政策方案付诸实施', '政策评估：检验政策效果'] },
      { title: '二、社区相关政策', items: ['社区建设政策、养老服务政策', '住房保障政策、就业促进政策', '社会救助政策'] }
    ]
  },
  '重大时政': {
    title: '重大时政知识提纲',
    sections: [
      { title: '一、党的二十大要点', items: ['以中国式现代化全面推进中华民族伟大复兴', '高质量发展是首要任务', '完善社会治理体系'] },
      { title: '二、二十届三中全会', items: ['进一步全面深化改革', '推进中国式现代化', '健全社会治理体系'] },
      { title: '三、社区治理相关', items: ['加强社区工作者队伍建设', '党建引领基层治理', '新时代"枫桥经验"'] }
    ]
  },
  '北京时政': {
    title: '北京时政知识提纲',
    sections: [
      { title: '一、接诉即办改革', items: ['2019年开始推行接诉即办改革', '2021年颁布《北京市接诉即办工作条例》', '深化主动治理、未诉先办'] },
      { title: '二、首都治理', items: ['四个中心：政治中心、文化中心、国际交往中心、科技创新中心', '超大城市治理', '京津冀协同发展'] }
    ]
  },
  '西城区概况': {
    title: '西城区概况知识提纲',
    sections: [
      { title: '一、基本区情', items: ['北京市核心城区之一', '面积50.7平方公里', '辖区15个街道', '是党中央、国务院所在地'] },
      { title: '二、重点区域', items: ['金融街：国家金融管理中心', '什刹海：历史文化旅游区', '大栅栏：传统商业文化区', '琉璃厂：文化艺术街区', '西单：商业中心'] },
      { title: '三、西城区重点工作', items: ['红墙意识教育实践', '接诉即办改革', '街区更新', '养老服务体系建设'] }
    ]
  },
  '历史文化': {
    title: '西城历史文化知识提纲',
    sections: [
      { title: '一、文化遗产', items: ['什刹海历史文化风景区', '大栅栏历史文化街区', '琉璃厂文化街', '阜成门内大街'] },
      { title: '二、红色文化', items: ['红墙意识：绝对忠诚、责任担当、首善标准', '中南海周边区域', '新文化运动相关旧址'] }
    ]
  },
  '重点政策': {
    title: '西城重点政策知识提纲',
    sections: [
      { title: '一、接诉即办', items: ['西城区接诉即办工作走在全市前列', '建立"接诉即办"快速响应机制', '深化主动治理、未诉先办'] },
      { title: '二、街区更新', items: ['老旧小区综合整治', '背街小巷环境精细化整治提升', '院落修缮'] },
      { title: '三、养老服务', items: ['驿站式养老全覆盖', '居家养老服务', '适老化改造'] }
    ]
  },
  '党建带社建': {
    title: '党建带社建知识提纲',
    sections: [
      { title: '一、基本内涵', items: ['以党建带动社区建设', '发挥党组织在社区治理中的领导核心作用', '推动党建工作与社区工作深度融合'] },
      { title: '二、实践路径', items: ['区域化党建：整合辖区资源', '党员双报到：在职党员到社区报到服务', '党建引领物业服务'] }
    ]
  },
  '党员义务': {
    title: '党员义务知识提纲',
    sections: [
      { title: '一、基本义务', items: ['认真学习党的理论和知识', '贯彻执行党的路线方针政策', '坚持党和人民的利益高于一切', '自觉遵守党的纪律，模范遵守法律法规'] },
      { title: '二、社区党员', items: ['在职党员到社区报到', '参与社区志愿服务', '发挥先锋模范作用'] }
    ]
  },
  '政府职能': {
    title: '政府职能知识提纲',
    sections: [
      { title: '一、政府职能分类', items: ['政治职能、经济职能、文化职能、社会职能、生态职能', '街道办事处：区政府的派出机关'] },
      { title: '二、服务型政府', items: ['以人民为中心', '简政放权、放管结合、优化服务', '一网通办、最多跑一次'] }
    ]
  },
  '社区工作方法': {
    title: '社区工作方法知识提纲',
    sections: [
      { title: '一、三大方法', items: ['个案工作：以个人或家庭为对象', '小组工作：以有相似需求的人群为对象', '社区工作：以社区为对象'] },
      { title: '二、社区工作模式', items: ['地区发展模式、社会策划模式', '社区照顾模式、社区行动模式'] }
    ]
  }
};

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

// ===================== 主观题/作文练习 =====================
function bindEssayEvents() {
  // 年份筛选
  document.querySelectorAll('#essay-filter-bar .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#essay-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      essayFilter = btn.dataset.year;
      updateEssayList();
    });
  });

  // 返回列表
  document.getElementById('btn-essay-back').addEventListener('click', () => {
    document.getElementById('essay-list-view').classList.remove('hidden');
    document.getElementById('essay-detail-view').classList.add('hidden');
    currentEssayId = null;
  });

  // 范文展开/收起
  document.getElementById('essay-sample-toggle').addEventListener('click', () => {
    const box = document.getElementById('essay-sample-box');
    const icon = document.querySelector('.essay-sample-toggle-icon');
    box.classList.toggle('show');
    icon.classList.toggle('open');
  });

  // 写作方法提纲展开/收起
  document.getElementById('writing-method-outline-toggle').addEventListener('click', () => {
    const box = document.getElementById('writing-method-outline-box');
    const icon = document.querySelector('.writing-method-outline-icon');
    box.classList.toggle('show');
    icon.classList.toggle('open');
  });

  // 保存草稿
  document.getElementById('btn-essay-save').addEventListener('click', () => {
    if (!currentEssayId) return;
    const text = document.getElementById('essay-write-area').value;
    const drafts = JSON.parse(localStorage.getItem(`${getUserPrefix()}_essay_drafts`) || '{}');
    drafts[currentEssayId] = { text, time: Date.now() };
    localStorage.setItem(`${getUserPrefix()}_essay_drafts`, JSON.stringify(drafts));
    alert('草稿已保存！');
  });

  // 清空
  document.getElementById('btn-essay-clear').addEventListener('click', () => {
    if (confirm('确定要清空已写的内容吗？')) {
      document.getElementById('essay-write-area').value = '';
      updateEssayWordCount();
    }
  });

  // 字数统计
  document.getElementById('essay-write-area').addEventListener('input', updateEssayWordCount);

  bindGoldenQuotesEvents();
}

function updateEssayWordCount() {
  const text = document.getElementById('essay-write-area').value;
  const count = text.replace(/\s/g, '').length;
  const el = document.getElementById('essay-word-count');
  el.textContent = `已写 ${count} 字`;
  el.classList.toggle('over', count > 1200);
}

function updateEssayList() {
  const listEl = document.getElementById('essay-list');
  let questions = essayQuestions;

  if (essayFilter !== 'all') {
    questions = questions.filter(q => q.year === essayFilter);
  }

  if (questions.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">暂无题目</p>';
    return;
  }

  let html = '';
  questions.forEach(q => {
    html += `<div class="essay-list-item" data-eid="${q.id}">
      <div class="essay-list-title">
        <span class="essay-list-year">${q.year}</span>
        ${q.title}
      </div>
      <span class="essay-list-theme">${q.theme}</span>
      <div class="essay-list-meta">${q.wordCount} · ${q.score}分</div>
    </div>`;
  });
  listEl.innerHTML = html;

  // 绑定点击事件
  listEl.querySelectorAll('.essay-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const eid = parseInt(item.dataset.eid);
      openEssayDetail(eid);
    });
  });
}

function openEssayDetail(eid) {
  const q = essayQuestions.find(e => e.id === eid);
  if (!q) return;

  currentEssayId = eid;

  // 切换视图
  document.getElementById('essay-list-view').classList.add('hidden');
  document.getElementById('essay-detail-view').classList.remove('hidden');

  // 填充内容
  document.getElementById('essay-detail-year-tag').textContent = q.year;
  document.getElementById('essay-detail-title').textContent = q.title;
  document.getElementById('essay-detail-material').textContent = q.material;
  document.getElementById('essay-detail-requirement').innerHTML = `<strong>作答要求：</strong>${q.requirement}`;

  // 范文
  document.getElementById('essay-sample-title').textContent = q.sampleEssay.title;
  // 将范文分段
  const paragraphs = q.sampleEssay.content.split('\n').filter(p => p.trim());
  document.getElementById('essay-sample-content').innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');

  // 收起范文
  document.getElementById('essay-sample-box').classList.remove('show');
  document.querySelector('.essay-sample-toggle-icon').classList.remove('open');

  // 写作要点
  document.getElementById('essay-tips-list').innerHTML = q.writingTips.map(t => `<li>${t}</li>`).join('');

  // 金句
  document.getElementById('essay-quotes-list').innerHTML = q.keyQuotes.map(q => `<li>${q}</li>`).join('');

  // 语音播放按钮事件绑定
  const sampleBtn = document.getElementById('tts-sample-btn');
  if (sampleBtn) {
    sampleBtn.onclick = () => {
      const sampleText = q.sampleEssay.title + '。' + q.sampleEssay.content;
      playTTS(sampleText, 'tts-sample-btn');
    };
  }

  const outlineBtn = document.getElementById('tts-outline-btn');
  if (outlineBtn && q.writingMethod) {
    outlineBtn.onclick = () => {
      const outlineText = q.writingMethod.outline;
      playTTS(outlineText, 'tts-outline-btn');
    };
  }

  // 写作方法与提纲
  if (q.writingMethod) {
    const stepsHtml = q.writingMethod.steps.map(s => `
      <div class="writing-method-step">
        <div class="writing-method-step-num">${s.step}</div>
        <span class="writing-method-step-name">${s.name}</span>
        <span class="writing-method-step-desc">${s.desc}</span>
      </div>
    `).join('');
    document.getElementById('writing-method-steps').innerHTML = stepsHtml;
    document.getElementById('writing-method-outline-content').textContent = q.writingMethod.outline;
    // 收起提纲
    document.getElementById('writing-method-outline-box').classList.remove('show');
    document.querySelector('.writing-method-outline-icon').classList.remove('open');
  }

  // 渲染万能金句库
  renderGoldenQuotes('openings');

  // 恢复草稿
  const drafts = JSON.parse(localStorage.getItem(`${getUserPrefix()}_essay_drafts`) || '{}');
  const draft = drafts[eid];
  document.getElementById('essay-write-area').value = draft ? draft.text : '';
  updateEssayWordCount();

  // 滚动到顶部
  window.scrollTo(0, 0);
}

// ===================== 语音播放功能 (TTS) =====================
let currentTTS = null;
let ttsAudio = null;
let currentTTSBtnId = null;

async function playTTS(text, btnId) {
  // 如果当前正在播放
  if (ttsAudio && !ttsAudio.paused) {
    ttsAudio.pause();
    ttsAudio.currentTime = 0;
    // 重置之前播放的按钮状态
    if (currentTTSBtnId) updateTTSButton(currentTTSBtnId, false);
    // 如果点击的是同一个按钮，只停止不重新播放
    if (currentTTSBtnId === btnId) {
      currentTTSBtnId = null;
      return;
    }
  }

  currentTTSBtnId = btnId;

  // 截取文本（FreeTTS免费版限制1000字符）
  const ttsText = text.length > 900 ? text.substring(0, 900) + '...' : text;

  if (btnId) updateTTSButton(btnId, true);

  try {
    const res = await fetch('https://freetts.org/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ttsText,
        voice: 'zh-CN-XiaoxiaoNeural',
        rate: '+10%',
        pitch: '+0Hz'
      })
    });

    if (!res.ok) throw new Error('TTS请求失败');

    const data = await res.json();
    const fileId = data.file_id;

    // 下载音频
    const audioRes = await fetch(`https://freetts.org/api/audio/${fileId}`);
    if (!audioRes.ok) throw new Error('音频下载失败');

    // 释放旧的音频资源
    if (ttsAudio && ttsAudio.src) {
      URL.revokeObjectURL(ttsAudio.src);
      ttsAudio.onended = null;
      ttsAudio.onerror = null;
    }

    const blob = await audioRes.blob();
    const url = URL.createObjectURL(blob);

    ttsAudio = new Audio(url);
    ttsAudio.onended = () => {
      updateTTSButton(btnId, false);
      if (currentTTSBtnId === btnId) currentTTSBtnId = null;
      URL.revokeObjectURL(url);
    };
    ttsAudio.onerror = () => {
      updateTTSButton(btnId, false);
      if (currentTTSBtnId === btnId) currentTTSBtnId = null;
      URL.revokeObjectURL(url);
      showToast('语音播放失败，请重试');
    };

    ttsAudio.play();

  } catch (err) {
    console.error('TTS错误:', err);
    updateTTSButton(btnId, false);
    if (currentTTSBtnId === btnId) currentTTSBtnId = null;
    // 降级到浏览器内置语音
    fallbackTTS(ttsText, btnId);
  }
}

function fallbackTTS(text, btnId) {
  if (!window.speechSynthesis) {
    showToast('您的浏览器不支持语音播放');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.1;
  utterance.pitch = 1;

  // 处理语音列表异步加载
  function setVoiceAndSpeak() {
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang && (v.lang.includes('zh') || v.lang.includes('cmn')));
    if (zhVoice) utterance.voice = zhVoice;
    window.speechSynthesis.speak(utterance);
  }

  let voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    // 等待语音列表加载
    window.speechSynthesis.onvoiceschanged = () => {
      setVoiceAndSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
  } else {
    setVoiceAndSpeak();
  }

  utterance.onend = () => {
    updateTTSButton(btnId, false);
    if (currentTTSBtnId === btnId) currentTTSBtnId = null;
  };
  utterance.onerror = () => {
    updateTTSButton(btnId, false);
    if (currentTTSBtnId === btnId) currentTTSBtnId = null;
    showToast('语音播放失败');
  };
}

function updateTTSButton(btnId, isPlaying) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const icon = btn.querySelector('.tts-icon');
  const text = btn.querySelector('.tts-text');

  if (isPlaying) {
    btn.classList.add('playing');
    if (icon) icon.textContent = '⏹';
    if (text) text.textContent = '停止';
  } else {
    btn.classList.remove('playing');
    if (icon) icon.textContent = '🔊';
    if (text) text.textContent = btn.dataset.type === 'sample' ? '朗读范文' :
                                btn.dataset.type === 'outline' ? '朗读提纲' : '朗读解析';
  }
}

// ===================== 万能金句库 =====================
let currentGQTab = 'openings';

function renderGoldenQuotes(tab) {
  currentGQTab = tab;
  const container = document.getElementById('golden-quotes-content');
  if (!container || !goldenQuotes) return;
  
  // 更新tab样式
  document.querySelectorAll('.gq-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  
  const data = goldenQuotes[tab];
  if (!data) return;
  
  let html = '';
  
  if (tab === 'singleQuotes') {
    // 单句金句
    data.forEach(item => {
      html += `<div class="golden-single-quote">
        <div class="golden-single-quote-text">"${item.quote}"</div>
        <div class="golden-single-quote-source">—— ${item.source}</div>
      </div>`;
    });
  } else {
    // 段落模板
    data.forEach(item => {
      html += `<div class="golden-quote-item">
        <div class="golden-quote-item-title">
          <span>${item.title}</span>
          <button type="button" class="golden-quote-item-copy" data-copy-id="${item.id}">📋 复制</button>
        </div>
        <div class="golden-quote-item-content">${item.content}</div>
        <div class="golden-quote-item-usage">📌 适用：${item.usage}</div>
      </div>`;
    });
  }
  
  container.innerHTML = html;
  
  // 绑定复制按钮事件
  container.querySelectorAll('.golden-quote-item-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const copyId = btn.dataset.copyId;
      const allData = [...goldenQuotes.openings, ...goldenQuotes.bodyParagraphs, ...goldenQuotes.endings];
      const item = allData.find(d => d.id === copyId);
      if (item) {
        navigator.clipboard.writeText(item.content).then(() => {
          btn.textContent = '✅ 已复制';
          setTimeout(() => { btn.textContent = '📋 复制'; }, 1500);
        }).catch(() => {
          // 降级方案
          const textarea = document.createElement('textarea');
          textarea.value = item.content;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          btn.textContent = '✅ 已复制';
          setTimeout(() => { btn.textContent = '📋 复制'; }, 1500);
        });
      }
    });
  });
}

// 金句库tab切换事件（在bindEssayEvents中调用或直接绑定）
function bindGoldenQuotesEvents() {
  document.querySelectorAll('.gq-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      renderGoldenQuotes(tab.dataset.tab);
    });
  });
}

// ===================== Toast提示 =====================
function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:8px;font-size:0.85em;z-index:9999;transition:opacity 0.3s;opacity:0;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
