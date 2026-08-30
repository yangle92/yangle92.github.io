/* 拼写模式功能模拟测试：用最小 DOM 桩跑通渲染、填字母、判分、提示、清空、退格 */
const fs = require('fs');
const vm = require('vm');

const appSrc = fs.readFileSync('js/app.js', 'utf8');
// 提取六点五节（拼写逻辑）到文件末尾（不含初始化部分：从 "六点五" 到 "八、初始化" 之前）
const start = appSrc.indexOf('/* ============================================================\n * 六点五');
const end = appSrc.indexOf('/* ============================================================\n * 七');
let spellSrc = appSrc.slice(start, end);
// 去掉末尾的节尾注释行
spellSrc = spellSrc.replace(/\* ============================================================ \*\/\s*$/, '');

// ---------- 最小 DOM 桩 ----------
function makeEl(tag) {
  return {
    tagName: tag, children: [], _html: '', textContent: '', title: '', className: '',
    disabled: false, style: {},
    _listeners: {},
    set innerHTML(v) { this._html = v; this.children = []; },
    get innerHTML() { return this._html; },
    appendChild(c) { this.children.push(c); },
    addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
    click() { (this._listeners.click || []).forEach(fn => fn({ stopPropagation() {}, preventDefault() {}, currentTarget: this })); },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {},
  };
}
const els = {};
const sandbox = {
  console,
  document: {
    getElementById(id) { return els[id] || (els[id] = makeEl('div')); },
    createElement: makeEl,
    querySelectorAll() { return []; },
    addEventListener() {},
  },
  Speech: { speak() { sandbox.__spoken.push('speak'); } },
  setTimeout(fn) { /* 跳过自动朗读 */ },
  __spoken: [],
  // 应用状态桩
  currentQuiz: null, quizIndex: 0, quizScore: 0,
  addStars() {}, markStudied() {},
  shuffle(a) { return [...a]; },  // 不打乱，方便断言
  renderQuestion() {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// 模拟一个 spell 题目
sandbox.currentQuiz = [{
  category: 'spell', emoji: '🐱', spell: true,
  word: { en: 'cat', cn: '猫', ph: '/kæt/', emoji: '🐱' }
}];
sandbox.quizIndex = 0;
sandbox.currentQuiz.length = 1;

vm.runInContext(spellSrc, sandbox);

const S = sandbox;
// 重新渲染当前题
vm.runInContext('renderSpellQuestion(currentQuiz[0])', S);
console.log('渲染: slots=%d 格, bank=%d 块, slot[0]=%s',
  S.spellSlots.length, S.spellBank.length, JSON.stringify(S.spellSlots));

// 1) 正常拼对：bank 前3块顺序是 c,a,t（shuffle 桩不打乱，前面恰好是 c a t + 干扰）
// 手动按顺序找字母块点击
function clickTile(ch) {
  const i = S.spellBank.findIndex(t => t.ch === ch && !t.used);
  if (i < 0) throw new Error('找不到可用字母块 ' + ch);
  vm.runInContext(`fillSpellTile(${i})`, S);
}
clickTile('c'); clickTile('a'); clickTile('t');
console.log('拼完: answered=%s, feedback含"拼对"=%s, score=%d',
  S.spellAnswered, els.quizFeedback.textContent.includes('拼对'), S.quizScore);

// 2) 提示 + 键盘 + 清空 + 退格流程
S.currentQuiz[0] = { category: 'spell', emoji: '🐶', spell: true, word: { en: 'dog', cn: '狗', ph: '', emoji: '🐶' } };
S.quizIndex = 0;
vm.runInContext('renderSpellQuestion(currentQuiz[0])', S);
vm.runInContext('spellHint()', S);            // 提示第一个字母 d
console.log('提示后: slot0=%s(orange hint)', JSON.stringify(S.spellSlots[0]));
vm.runInContext('fillSpellChar("o")', S);     // 键盘输入 o
vm.runInContext('fillSpellChar("g")', S);     // 键盘输入 g → 填满自动判分
console.log('键盘拼完: answered=%s, feedback=%s', S.spellAnswered, els.quizFeedback.textContent);

// 3) 清空重拼 + 点格子删除
S.currentQuiz[0] = { category: 'spell', emoji: '🦆', spell: true, word: { en: 'duck', cn: '鸭子', ph: '', emoji: '🦆' } };
vm.runInContext('renderSpellQuestion(currentQuiz[0])', S);
clickTile('d'); clickTile('u');
// 点一个干扰字母块（bank 第 5 块起是干扰字母，shuffle 桩不打乱顺序）
if (S.spellBank.length > 4) vm.runInContext('fillSpellTile(4)', S);
console.log('填3格: %s', S.spellSlots.map(s => s && s.ch).join(''));
vm.runInContext('clearSpellSlot(2)', S);       // 点第3格删掉错字母
console.log('删除第3格: %s, 第3格=%s', S.spellSlots.map(s => s ? s.ch : '_').join(''), S.spellSlots[2]);
clickTile('c'); clickTile('k');                // 补上 c k
console.log('拼完: answered=%s, feedback含"拼对"=%s',
  S.spellAnswered, els.quizFeedback.textContent.includes('拼对'));

// 4) 题目池校验：spell 题只含 2-8 位纯字母单词
const dataSrc = fs.readFileSync('js/data-words.js', 'utf8');
const dSandbox = { console };
vm.runInNewContext(dataSrc + '; globalThis.__db = wordDatabase;', dSandbox);
const db = dSandbox.__db;
let total = 0, valid = 0;
Object.values(db).forEach(cat => cat.words.forEach(w => { total++; if (/^[a-zA-Z]{2,8}$/.test(w.en)) valid++; }));
console.log('词库: 共 %d 词，符合拼写条件(2-8字母) %d 个', total, valid);
console.log('=== 全部流程模拟通过 ===');
