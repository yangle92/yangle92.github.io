/* ============================================================
 * 应用主逻辑（app.js）
 * 单词学习 / 语法学习 / 趣味练习 / 学习成就 四大模块
 * 2026-08-30：取消年级筛选，全部内容合并展示；兼容旧版按年级
 * 存储的学习记录（自动去掉 "3:" 这类年级前缀，进度不丢失）
 * ============================================================ */
"use strict";

/* ============================================================
 * 一、状态管理
 * ============================================================ */
const STORE_KEY = 'happyEnglishDataV2';

/* 学习数据按账号隔离：登录后每个账号各自的进度（键名追加 ":用户名"） */
function dataKey() {
  return window.Auth ? STORE_KEY + window.Auth.dataSuffix() : STORE_KEY;
}

let currentCategory = null;
let learnedWords = new Set();
let totalStars = 0;
let quizCompleted = 0;
let lastStudyDate = null;
let streakDays = 0;

function loadData() {
  try {
    let saved = localStorage.getItem(dataKey());
    // 该账号首次登录：继承升级前的公共学习进度
    if (!saved && dataKey() !== STORE_KEY) saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // 旧版 key 形如 "3:animals:5"（年级:分类:序号），去掉年级前缀即可迁移
      learnedWords = new Set((data.learnedWords || []).map(k => {
        const m = k.match(/^\d:(.+)$/);
        return m ? m[1] : k;
      }));
      totalStars = data.totalStars || 0;
      quizCompleted = data.quizCompleted || 0;
      lastStudyDate = data.lastStudyDate || null;
      streakDays = data.streakDays || 0;
    }
  } catch (e) { /* 忽略损坏数据 */ }
  updateStarsDisplay();
}

function saveData() {
  const data = {
    learnedWords: Array.from(learnedWords),
    totalStars, quizCompleted, lastStudyDate, streakDays,
    updatedAt: Date.now()          // 多设备合并时用它判断谁的数据更新
  };
  try {
    localStorage.setItem(dataKey(), JSON.stringify(data));
  } catch (e) { /* 存储满时忽略 */ }
  // 同步到服务器磁盘：服务重启、换浏览器、换设备都不丢
  if (window.Remote && Remote.isAvailable()) {
    Remote.putProgress({ [dataKey()]: data });
  }
}

/* 启动时把服务器上的进度拉回来（有更新则重新载入并刷新界面） */
function syncProgressFromServer() {
  if (!window.Remote || !Remote.isAvailable()) return;
  Remote.syncProgressIntoLocal().then(changed => {
    if (changed) { loadData(); renderAll(); }
  }).catch(() => { /* 网络异常时忽略，继续用本地数据 */ });
}

function updateStarsDisplay() {
  document.getElementById('totalStars').textContent = totalStars;
}

function addStars(count) {
  totalStars += count;
  updateStarsDisplay();
  saveData();
  const starEl = document.querySelector('.stars-display .star');
  if (starEl) {
    starEl.style.animation = 'none';
    setTimeout(() => { starEl.style.animation = 'correctBounce 0.5s ease'; }, 10);
  }
}

function markStudied() {
  const today = new Date().toDateString();
  if (lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastStudyDate === yesterday.toDateString()) streakDays++;
    else streakDays = 1;
    lastStudyDate = today;
    saveData();
  }
}

/* ============================================================
 * 二、整体渲染
 * ============================================================ */
function renderAll() {
  const cats = Object.keys(wordDatabase);
  if (!cats.length) return;
  if (!cats.includes(currentCategory)) currentCategory = cats[0];
  const totalLabel = document.getElementById('wordTotalLabel');
  if (totalLabel) {
    const total = cats.reduce((n, k) => n + wordDatabase[k].words.length, 0);
    totalLabel.textContent = `共 ${cats.length} 个分类 · ${total} 个单词`;
  }
  renderCategories();
  renderWordCards();
  renderGrammar();
  renderPracticeMenu();
  updateProgressPage();
}

/* ============================================================
 * 三、标签切换
 * ============================================================ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tab).classList.add('active');
    if (tab === 'progress') updateProgressPage();
  });
});

/* ============================================================
 * 四、单词模块
 * ============================================================ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderCategories() {
  const container = document.getElementById('wordCategories');
  container.innerHTML = '';
  Object.entries(wordDatabase).forEach(([key, cat]) => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (key === currentCategory ? ' active' : '');
    if (key === currentCategory) btn.style.background = cat.color;
    const parts = cat.name.split(' ');
    btn.innerHTML = `<span>${parts[0]}</span><span>${parts.slice(1).join(' ') || ''}</span><span class="cat-count">${cat.words.length}</span>`;
    btn.addEventListener('click', () => {
      currentCategory = key;
      renderCategories();
      renderWordCards();
    });
    container.appendChild(btn);
  });
}

function renderWordCards() {
  const container = document.getElementById('wordGrid');
  container.innerHTML = '';
  const cat = wordDatabase[currentCategory];
  if (!cat) return;

  cat.words.forEach((word, index) => {
    const card = document.createElement('div');
    card.className = 'word-card';

    const front = document.createElement('div');
    front.className = 'word-card-front';

    const btn1 = document.createElement('button');
    btn1.className = 'speak-btn';
    btn1.title = '点击听发音';
    btn1.textContent = '🔊';
    btn1.onclick = function(e) { playWord(e, word.en); };

    const emoji1 = document.createElement('div');
    emoji1.className = 'word-emoji';
    emoji1.textContent = word.emoji;

    const en1 = document.createElement('div');
    en1.className = 'word-en';
    en1.textContent = word.en;

    const ph1 = document.createElement('div');
    ph1.className = 'word-phonetic';
    ph1.textContent = word.ph;

    front.appendChild(btn1);
    front.appendChild(emoji1);
    front.appendChild(en1);
    front.appendChild(ph1);

    const back = document.createElement('div');
    back.className = 'word-card-back';

    const btn2 = document.createElement('button');
    btn2.className = 'speak-btn';
    btn2.title = '点击听发音';
    btn2.textContent = '🔊';
    btn2.onclick = function(e) { playWord(e, word.en); };

    const en2 = document.createElement('div');
    en2.className = 'word-en';
    en2.textContent = word.en;

    const cn2 = document.createElement('div');
    cn2.className = 'word-cn';
    cn2.textContent = word.cn;

    const s2 = document.createElement('div');
    s2.className = 'word-sentence';
    s2.textContent = word.s;

    const sBtn = document.createElement('button');
    sBtn.className = 'example-speak';
    sBtn.style.marginTop = '8px';
    sBtn.title = '听例句';
    sBtn.textContent = '🔈';
    sBtn.onclick = function(e) { playWord(e, word.s); };

    back.appendChild(btn2);
    back.appendChild(en2);
    back.appendChild(cn2);
    back.appendChild(s2);
    back.appendChild(sBtn);

    const inner = document.createElement('div');
    inner.className = 'word-card-inner';
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener('click', (e) => {
      if (e.target.closest('.speak-btn') || e.target.closest('.example-speak')) return;
      card.classList.toggle('flipped');
      const wordKey = `${currentCategory}:${index}`;
      if (card.classList.contains('flipped') && !learnedWords.has(wordKey)) {
        learnedWords.add(wordKey);
        addStars(1);
        markStudied();
      }
    });

    container.appendChild(card);
  });
}

/* ============================================================
 * 五、语法模块（动态渲染）
 * ============================================================ */
function renderGrammar() {
  const container = document.getElementById('grammarList');
  container.innerHTML = '';
  grammarData.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'grammar-card';
    card.id = 'grammar-' + topic.id;

    let html = `<h3><span class="emoji">${topic.emoji}</span>${topic.title}</h3>`;
    html += `<div class="grammar-intro">${topic.intro}</div>`;

    if (topic.table) {
      html += `<table class="g-table"><caption>${topic.table.caption}</caption><thead><tr>`;
      topic.table.headers.forEach(h => { html += `<th>${h}</th>`; });
      html += `</tr></thead><tbody>`;
      topic.table.rows.forEach(row => {
        html += `<tr>`;
        row.forEach(cell => { html += `<td>${cell}</td>`; });
        html += `</tr>`;
      });
      html += `</tbody></table>`;
    }

    if (topic.tips && topic.tips.length) {
      html += `<div class="memory-tip"><h4>🎵 记忆口诀</h4><ul>`;
      topic.tips.forEach(t => { html += `<li>${t}</li>`; });
      html += `</ul></div>`;
    }

    if (topic.examples && topic.examples.length) {
      html += `<h4 style="font-size:17px; margin: 16px 0 10px;">📝 例句读一读（点喇叭跟读）</h4><div class="example-list">`;
      topic.examples.forEach(ex => {
        const safe = ex.en.replace(/"/g, '&quot;');
        html += `<div class="example-item"><div class="example-text"><div class="en">${ex.en}</div><div class="cn">${ex.cn}</div></div><button class="example-speak" data-say="${safe}" title="朗读例句">🔊</button></div>`;
      });
      html += `</div>`;
    }

    html += `<div style="text-align:right; margin-top:14px;"><button class="result-btn primary" style="padding:10px 24px; font-size:14px;" data-quiz="${topic.id}">🎯 做本节练习</button></div>`;

    card.innerHTML = html;
    container.appendChild(card);
  });

  // 例句朗读（事件委托）
  container.querySelectorAll('.example-speak[data-say]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      Speech.speak(btn.dataset.say, btn);
    });
  });
  // 跳到对应练习
  container.querySelectorAll('button[data-quiz]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.tab-btn[data-tab="practice"]').click();
      startQuiz(btn.dataset.quiz);
    });
  });
}

/* ============================================================
 * 六、练习模块
 * ============================================================ */
let currentQuiz = null;
let quizIndex = 0;
let quizScore = 0;
let quizType = '';

/* 单词拼写模式状态 */
let spellSlots = [];      // 每格：null 或 {ch, tile, hint}
let spellBank = [];       // 字母块：{ch, used}
let spellWord = '';       // 当前目标单词（小写）
let spellAnswered = false;

function getAllWords() {
  const all = [];
  Object.entries(wordDatabase).forEach(([catKey, cat]) => {
    cat.words.forEach((w) => {
      all.push({ ...w, key: `${catKey}` });
    });
  });
  return all;
}

function generateQuizQuestions(type) {
  const questions = [];
  const allWords = getAllWords();
  const bank = grammarQuiz;
  const topicMeta = {};
  grammarData.forEach(t => { topicMeta[t.id] = t; });

  // 单词拼写题：选 2-8 个字母的纯字母单词，共 10 个
  if (type === 'spell') {
    const pool = allWords.filter(w => /^[a-zA-Z]{2,8}$/.test(w.en));
    return shuffle(pool).slice(0, 10).map(word => ({
      category: 'spell',
      emoji: word.emoji,
      word: word,
      spell: true
    }));
  }

  // 单词题
  if (type === 'word' || type === 'mixed') {
    const shuffled = shuffle(allWords).slice(0, type === 'mixed' ? 4 : 10);
    shuffled.forEach(word => {
      const mode = Math.random() > 0.5 ? 'en2cn' : 'cn2en';
      const wrongOptions = shuffle(allWords.filter(w => w.en !== word.en)).slice(0, 3);
      const options = shuffle([word, ...wrongOptions]);
      questions.push({
        category: 'word',
        emoji: word.emoji,
        question: mode === 'en2cn' ? `"${word.en}" 的中文意思是？` : `"${word.cn}" 的英文是？`,
        options: options.map(o => mode === 'en2cn' ? o.cn : o.en),
        answer: mode === 'en2cn' ? word.cn : word.en,
        speak: word.en
      });
    });
  }

  // 语法题
  if (bank[type]) {
    questions.push(...shuffle(bank[type]).slice(0, 8).map(q => ({
      category: type,
      emoji: topicMeta[type] ? topicMeta[type].emoji : '📝',
      question: q.q,
      options: q.o,
      answer: q.a,
      long: q.long
    })));
  } else if (type === 'mixed') {
    // 综合：从全部语法题库随机抽
    const pool = [];
    Object.entries(bank).forEach(([tid, qs]) => {
      qs.forEach(q => pool.push({ ...q, tid }));
    });
    questions.push(...shuffle(pool).slice(0, 6).map(q => ({
      category: q.tid,
      emoji: topicMeta[q.tid] ? topicMeta[q.tid].emoji : '📝',
      question: q.q,
      options: q.o,
      answer: q.a,
      long: q.long
    })));
  }

  const result = shuffle(questions).slice(0, 10);
  return result.length ? result : generateQuizQuestions('word'); // 兜底，绝不出空题
}

function renderPracticeMenu() {
  const grid = document.getElementById('practiceMenuGrid');
  grid.innerHTML = '';

  const wordCard = document.createElement('div');
  wordCard.className = 'practice-type-card';
  wordCard.innerHTML = `<div class="icon">📖</div><h4>单词小测验</h4><p>看中文选英文，看英文选中文，考验你的单词记忆力！</p><span class="difficulty">⭐ 简单</span>`;
  wordCard.addEventListener('click', () => startQuiz('word'));
  grid.appendChild(wordCard);

  const spellCard = document.createElement('div');
  spellCard.className = 'practice-type-card';
  spellCard.innerHTML = `<div class="icon">🔤</div><h4>单词拼写</h4><p>看图片和中文意思，把单词的字母一个个拼出来，还能练打字！</p><span class="difficulty">⭐⭐ 中等</span>`;
  spellCard.addEventListener('click', () => startQuiz('spell'));
  grid.appendChild(spellCard);

  grammarData.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'practice-type-card';
    card.innerHTML = `<div class="icon">${topic.emoji}</div><h4>${topic.title.split('（')[0]}</h4><p>${topic.intro.replace(/<[^>]+>/g, '').slice(0, 40)}…</p><span class="difficulty">${topic.diff}</span>`;
    card.addEventListener('click', () => startQuiz(topic.id));
    grid.appendChild(card);
  });

  const mixedCard = document.createElement('div');
  mixedCard.className = 'practice-type-card';
  mixedCard.innerHTML = `<div class="icon">🏆</div><h4>综合大挑战</h4><p>单词 + 全部语法混合题，敢不敢来挑战？</p><span class="difficulty">⭐⭐⭐⭐ 困难</span>`;
  mixedCard.addEventListener('click', () => startQuiz('mixed'));
  grid.appendChild(mixedCard);
}

function startQuiz(type) {
  quizType = type;
  currentQuiz = generateQuizQuestions(type);
  quizIndex = 0;
  quizScore = 0;

  document.getElementById('practiceMenu').style.display = 'none';
  document.getElementById('resultArea').style.display = 'none';
  document.getElementById('quizArea').style.display = 'block';
  document.getElementById('quizArea').scrollIntoView({ behavior: 'smooth', block: 'start' });

  renderQuestion();
}

function renderQuestion() {
  const q = currentQuiz[quizIndex];
  const content = document.getElementById('quizContent');

  document.getElementById('quizProgress').textContent = `第 ${quizIndex + 1} / ${currentQuiz.length} 题`;
  document.getElementById('quizScore').textContent = quizScore;
  document.getElementById('progressFill').style.width = `${(quizIndex / currentQuiz.length) * 100}%`;

  // 单词拼写模式走专属渲染
  if (q.spell) { renderSpellQuestion(q); return; }

  const speakBtnHtml = q.speak
    ? `<button class="example-speak" style="display:inline-flex; vertical-align:middle; margin-left:8px;" data-say="${q.speak.replace(/"/g, '&quot;')}" title="听发音">🔊</button>`
    : '';

  content.innerHTML = `
    <div class="quiz-question">${q.emoji || '❓'} ${q.question} ${speakBtnHtml}</div>
    <div class="quiz-hint">选择正确的答案</div>
    <div class="quiz-options" id="quizOptions"></div>
    <div class="quiz-feedback" id="quizFeedback"></div>
    <button class="quiz-next-btn" id="nextBtn" style="display:none;" onclick="nextQuestion()">${quizIndex === currentQuiz.length - 1 ? '查看结果 🎉' : '下一题 →'}</button>
  `;

  const speakInline = content.querySelector('.example-speak[data-say]');
  if (speakInline) {
    speakInline.addEventListener('click', (e) => {
      e.stopPropagation();
      Speech.speak(speakInline.dataset.say, speakInline);
    });
  }

  const optionsContainer = document.getElementById('quizOptions');
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option' + (q.long ? ' long-text' : '');
    btn.textContent = opt;
    btn.addEventListener('click', () => checkAnswer(btn, opt, q.answer));
    optionsContainer.appendChild(btn);
  });
}

function checkAnswer(btn, selected, correct) {
  const options = document.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('nextBtn');

  options.forEach(o => o.disabled = true);

  if (selected === correct) {
    btn.classList.add('correct');
    feedback.className = 'quiz-feedback show correct-fb';
    feedback.textContent = '🎉 答对了！太棒了！';
    quizScore++;
    addStars(1);
  } else {
    btn.classList.add('wrong');
    options.forEach(o => {
      if (o.textContent === correct) o.classList.add('correct');
    });
    feedback.className = 'quiz-feedback show wrong-fb';
    feedback.textContent = `💡 正确答案是：${correct}`;
  }

  nextBtn.style.display = 'block';
  markStudied();
}

function nextQuestion() {
  quizIndex++;
  if (quizIndex >= currentQuiz.length) showResult();
  else renderQuestion();
}

function showResult() {
  document.getElementById('quizArea').style.display = 'none';
  document.getElementById('resultArea').style.display = 'block';

  const percent = Math.round((quizScore / currentQuiz.length) * 100);
  let emoji, title, message, stars;
  if (percent === 100) {
    emoji = '🏆'; title = '满分通关！'; stars = '⭐⭐⭐⭐⭐';
    message = '太厉害了！全部答对！你是英语小天才！';
    addStars(5);
  } else if (percent >= 80) {
    emoji = '🌟'; title = '非常棒！'; stars = '⭐⭐⭐⭐';
    message = '成绩很优秀！继续保持，争取下次满分！';
    addStars(3);
  } else if (percent >= 60) {
    emoji = '😊'; title = '还不错哦！'; stars = '⭐⭐⭐';
    message = '已经掌握得不错啦，再练习一下就更好了！';
    addStars(1);
  } else {
    emoji = '💪'; title = '继续加油！'; stars = '⭐⭐';
    message = '没关系，多练习几次就会越来越棒的！';
  }

  document.getElementById('resultScreen').innerHTML = `
    <div class="result-emoji">${emoji}</div>
    <div class="result-title">${title}</div>
    <div class="result-score-text">答对 <strong>${quizScore}</strong> / ${currentQuiz.length} 题</div>
    <div class="result-stars">${stars}</div>
    <div class="result-message">${message}</div>
    <div class="result-actions">
      <button class="result-btn primary" onclick="startQuiz('${quizType}')">🔄 再来一次</button>
      <button class="result-btn secondary" onclick="backToMenu()">📋 选择其他练习</button>
    </div>
  `;
  document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth', block: 'start' });

  quizCompleted++;
  saveData();
}

function backToMenu() {
  document.getElementById('practiceMenu').style.display = 'block';
  document.getElementById('quizArea').style.display = 'none';
  document.getElementById('resultArea').style.display = 'none';
}

/* ============================================================
 * 六点五、单词拼写模式
 *   看图片 + 中文意思，点字母块（或敲键盘）拼出单词
 * ============================================================ */
function renderSpellQuestion(q) {
  const content = document.getElementById('quizContent');
  spellWord = q.word.en.toLowerCase();
  spellSlots = new Array(spellWord.length).fill(null);
  spellAnswered = false;

  // 字母块 = 单词字母 + 2~4 个干扰字母，打乱
  const letters = spellWord.split('');
  const abc = 'abcdefghijklmnopqrstuvwxyz';
  const extraCount = Math.max(0, Math.min(4, 12 - letters.length));
  const extras = [];
  while (extras.length < extraCount) {
    extras.push(abc[Math.floor(Math.random() * 26)]);
  }
  spellBank = shuffle(letters.concat(extras)).map(ch => ({ ch, used: false }));

  content.innerHTML = `
    <div class="quiz-question">${q.emoji} 这个单词怎么拼？</div>
    <div class="quiz-hint">听发音，按顺序点字母拼出来（也可以直接用键盘打字，退格键删除）</div>
    <div class="spell-stage">
      <button class="example-speak spell-hear" id="spellHearBtn" title="听单词发音">🔊 听发音</button>
      <div class="spell-cn">${q.word.cn}${q.word.ph ? ` <span class="spell-ph">${q.word.ph}</span>` : ''}</div>
    </div>
    <div class="spell-slots" id="spellSlots"></div>
    <div class="spell-bank" id="spellBank"></div>
    <div class="quiz-feedback" id="quizFeedback"></div>
    <div class="spell-actions">
      <button class="result-btn secondary" id="spellHintBtn">💡 提示一个字母</button>
      <button class="result-btn secondary" id="spellClearBtn">🧹 清空重拼</button>
    </div>
    <button class="quiz-next-btn" id="nextBtn" style="display:none;" onclick="nextQuestion()">${quizIndex === currentQuiz.length - 1 ? '查看结果 🎉' : '下一题 →'}</button>
  `;

  document.getElementById('spellHearBtn').addEventListener('click', () => {
    Speech.speak(q.word.en, document.getElementById('spellHearBtn'));
  });
  document.getElementById('spellHintBtn').addEventListener('click', spellHint);
  document.getElementById('spellClearBtn').addEventListener('click', clearSpell);

  renderSpellSlots();
  renderSpellBank();

  // 出题后自动读一遍单词，方便孩子边听边拼
  setTimeout(() => Speech.speak(q.word.en), 350);
}

function renderSpellSlots() {
  const box = document.getElementById('spellSlots');
  if (!box) return;
  box.innerHTML = '';
  spellSlots.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'spell-slot' + (s ? ' filled' : '') + (s && s.hint ? ' hint' : '');
    d.textContent = s ? s.ch.toUpperCase() : '';
    d.title = s ? '点一下删掉这个字母' : '';
    d.addEventListener('click', () => clearSpellSlot(i));
    box.appendChild(d);
  });
}

function renderSpellBank() {
  const box = document.getElementById('spellBank');
  if (!box) return;
  box.innerHTML = '';
  spellBank.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'spell-tile' + (t.used ? ' used' : '');
    b.textContent = t.ch.toUpperCase();
    b.disabled = !!t.used || spellAnswered;
    b.addEventListener('click', () => fillSpellTile(i));
    box.appendChild(b);
  });
}

/* 点字母块：填入第一个空格 */
function fillSpellTile(tileIdx) {
  if (spellAnswered) return;
  const t = spellBank[tileIdx];
  if (!t || t.used) return;
  const idx = spellSlots.indexOf(null);
  if (idx === -1) return;
  spellSlots[idx] = { ch: t.ch, tile: tileIdx, hint: false };
  t.used = true;
  renderSpellSlots();
  renderSpellBank();
  if (!spellSlots.includes(null)) checkSpell();
}

/* 键盘输入 / 提示：直接填入字母（不消耗字母块） */
function fillSpellChar(ch) {
  if (spellAnswered) return;
  const idx = spellSlots.indexOf(null);
  if (idx === -1) return;
  spellSlots[idx] = { ch: ch.toLowerCase(), tile: -1, hint: false };
  renderSpellSlots();
  if (!spellSlots.includes(null)) checkSpell();
}

/* 点已填的格子：退回这个字母 */
function clearSpellSlot(i) {
  if (spellAnswered) return;
  const s = spellSlots[i];
  if (!s) return;
  if (s.tile >= 0 && spellBank[s.tile]) spellBank[s.tile].used = false;
  spellSlots[i] = null;
  renderSpellSlots();
  renderSpellBank();
}

/* 提示：在下一个空格填入正确字母（橙色标出） */
function spellHint() {
  if (spellAnswered) return;
  const idx = spellSlots.indexOf(null);
  if (idx === -1) return;
  spellSlots[idx] = { ch: spellWord[idx], tile: -1, hint: true };
  renderSpellSlots();
  if (!spellSlots.includes(null)) checkSpell();
}

/* 清空重拼 */
function clearSpell() {
  if (spellAnswered) return;
  spellSlots = spellSlots.map(() => null);
  spellBank.forEach(t => { t.used = false; });
  renderSpellSlots();
  renderSpellBank();
}

/* 填满后自动判分 */
function checkSpell() {
  spellAnswered = true;
  const q = currentQuiz[quizIndex];
  const feedback = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('nextBtn');
  const guess = spellSlots.map(s => s.ch).join('');
  const slotEls = document.querySelectorAll('.spell-slot');

  if (guess === spellWord) {
    slotEls.forEach(el => el.classList.add('correct'));
    feedback.className = 'quiz-feedback show correct-fb';
    feedback.textContent = `🎉 拼对了！${q.word.en} — ${q.word.cn}`;
    quizScore++;
    addStars(1);
    Speech.speak(q.word.en);
  } else {
    slotEls.forEach((el, i) => {
      if (spellSlots[i] && spellSlots[i].ch === spellWord[i]) el.classList.add('correct');
      else el.classList.add('wrong');
    });
    feedback.className = 'quiz-feedback show wrong-fb';
    feedback.textContent = `💡 正确拼写是：${q.word.en}`;
  }

  document.getElementById('spellHintBtn').disabled = true;
  document.getElementById('spellClearBtn').disabled = true;
  renderSpellBank();
  nextBtn.style.display = 'block';
  markStudied();
}

/* 键盘支持：拼写模式下可直接打字，退格删除 */
document.addEventListener('keydown', (e) => {
  if (!currentQuiz || spellAnswered) return;
  if (document.getElementById('quizArea').style.display === 'none') return;
  const q = currentQuiz[quizIndex];
  if (!q || !q.spell) return;
  if (/^[a-zA-Z]$/.test(e.key)) {
    fillSpellChar(e.key);
  } else if (e.key === 'Backspace') {
    for (let i = spellSlots.length - 1; i >= 0; i--) {
      if (spellSlots[i]) { clearSpellSlot(i); break; }
    }
  }
});

/* ============================================================
 * 七、进度模块
 * ============================================================ */
function totalWordCount() {
  let n = 0;
  Object.values(wordDatabase).forEach(cat => { n += cat.words.length; });
  return n;
}

function updateProgressPage() {
  document.getElementById('statStars').textContent = totalStars;
  document.getElementById('statWords').textContent = learnedWords.size;
  document.getElementById('statQuizzes').textContent = quizCompleted;
  document.getElementById('statStreak').textContent = streakDays;

  const total = Math.max(totalWordCount(), 1);
  document.getElementById('barStars').style.width = `${Math.min(totalStars / 300 * 100, 100)}%`;
  document.getElementById('barWords').style.width = `${Math.min(learnedWords.size / total * 100, 100)}%`;
  document.getElementById('barQuizzes').style.width = `${Math.min(quizCompleted / 20 * 100, 100)}%`;
  document.getElementById('barStreak').style.width = `${Math.min(streakDays / 30 * 100, 100)}%`;

  renderCalendar();
  renderLearnedWords();
}

function renderCalendar() {
  const container = document.getElementById('streakCalendar');
  container.innerHTML = '';

  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  const dayOfWeek = today.getDay();

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    weekDates.push(d);
  }

  weekDates.forEach((date) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    const dateStr = date.toDateString();
    const isToday = dateStr === today.toDateString();
    const isPast = date < today && !isToday;

    let studied = false;
    if (dateStr === lastStudyDate) studied = true;
    if (isPast && dateStr !== lastStudyDate && streakDays > 0) {
      const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      if (daysDiff < streakDays) studied = true;
    }

    dayEl.classList.add(studied ? 'active' : 'inactive');
    if (isToday) dayEl.classList.add('today');
    dayEl.textContent = days[date.getDay()];
    dayEl.title = `${date.getMonth() + 1}月${date.getDate()}日`;
    container.appendChild(dayEl);
  });
}

function renderLearnedWords() {
  const container = document.getElementById('learnedWordsGrid');
  const items = [];
  learnedWords.forEach(key => {
    const [catKey, idx] = key.split(':');
    const word = wordDatabase[catKey] && wordDatabase[catKey].words[Number(idx)];
    if (word) items.push(`${word.emoji} ${word.en}`);
  });

  if (!items.length) {
    container.innerHTML = '<span style="color:#BBB;">还没有学习记录，快去单词板块学习吧！</span>';
    return;
  }
  container.innerHTML = items.map(t => `<span class="learned-tag">${t}</span>`).join('');
}

/* ============================================================
 * 八、初始化
 * ============================================================ */
let appBooted = false;

function bootApp() {
  if (appBooted) return;
  appBooted = true;
  Speech.init();
  // 应用后台管理保存的内容修改（覆盖为 localStorage 中自定义的数据）
  if (window.Admin && typeof window.Admin.applyOverrides === 'function') {
    try { window.Admin.applyOverrides(); } catch (e) { /* 覆盖数据损坏时忽略，仍用内置内容 */ }
  }
  loadData();
  renderAll();
  syncProgressFromServer();   // 异步拉取服务器进度，有更新会自动刷新
}

/* 已登录（或未加载认证模块）直接启动；未登录等 auth.js 登录成功后调用 bootApp */
if (!window.Auth || window.Auth.isLoggedIn()) bootApp();

// 右上角"语音检测"按钮
const voiceTestBtn = document.getElementById('voiceTestBtn');
if (voiceTestBtn) {
  voiceTestBtn.addEventListener('click', () => Speech.selfTest(voiceTestBtn));
}
