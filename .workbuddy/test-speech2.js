/* 语音方案 v5 模拟测试：用假 DOM/假 Audio/假时钟验证故障转移全链路 */
"use strict";
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'speech.js'), 'utf8');

/* ---------- 假时钟 ---------- */
let clock = 0, seq = 1;
const pending = new Map();
function fakeSetTimeout(fn, ms) { const id = seq++; pending.set(id, { fn, at: clock + (ms || 0) }); return id; }
function fakeClearTimeout(id) { pending.delete(id); }
function advance(ms) {
  clock += ms;
  const due = [...pending.entries()].filter(([, t]) => t.at <= clock).sort((a, b) => a[1].at - b[1].at);
  for (const [id, t] of due) { pending.delete(id); t.fn(); }
}

/* ---------- 假 DOM ---------- */
function fakeEl() {
  return {
    innerHTML: '', className: '', id: '', textContent: '', dataset: {},
    classList: { add() {}, remove() {}, toggle() { return true; } },
    addEventListener() {}, contains() { return false; },
    querySelectorAll() { return []; }, querySelector() { return null; },
    appendChild() {}
  };
}
const toastEl = fakeEl();
const createdEls = [];
const fakeDocument = {
  getElementById: (id) => (id === 'toast' ? toastEl : null),
  createElement: () => { const e = fakeEl(); createdEls.push(e); return e; },
  addEventListener() {},
  body: { appendChild() {} }
};

/* ---------- 假 localStorage ---------- */
const store = {};
const fakeLS = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};

/* ---------- 假语音合成 ---------- */
class FakeUtterance { constructor(t) { this.text = t; } }
const synth = {
  _voices: [], _lastSpeak: null, _speakCount: 0,
  speaking: false, pending: false, paused: false,
  getVoices() { return synth._voices; },
  speak(u) { synth._speakCount++; synth._lastSpeak = u; synth.speaking = true; },
  cancel() { synth.speaking = false; },
  resume() {}
};

/* ---------- 假 Audio ---------- */
class FakeAudio {
  constructor(s) { this._src = s || null; this.handlers = {}; this.playCount = 0; }
  get src() { return this._src; }
  set src(v) { this._src = v; }
  play() { this.playCount++; return Promise.resolve(); }
  pause() {}
  load() {}
  removeAttribute() { this._src = null; }
}

/* ---------- 组装沙箱 ---------- */
const sandbox = {
  console, Promise,
  window: { speechSynthesis: synth },
  SpeechSynthesisUtterance: FakeUtterance,
  document: fakeDocument, localStorage: fakeLS,
  Audio: FakeAudio,
  setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
  setInterval() { return 0; }, clearInterval() {}
};
vm.createContext(sandbox);
vm.runInContext(src + '\n;globalThis.__x = { Speech, ONLINE_PROVIDERS };', sandbox);
const { Speech, ONLINE_PROVIDERS } = sandbox.__x;

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  [' + extra + ']' : '')); }
}

/* ============ T1: 无英文音色 → 直接走在线 ============ */
console.log('\n[T1] 无英文音色时 speak 直接使用在线发音');
Speech.init();
sandbox.Audio = FakeAudio; // 保持默认
Speech.speak('apple');
advance(10);
let audio = Speech._audio;
check('共享 Audio 元素已创建', !!audio);
check('使用了在线线路 URL', audio && /youdao|baidu|sogou/.test(audio.src || ''), audio && audio.src);
audio.onplaying(); // 模拟出声
check('成功线路被记住', Speech.probe.youdao === true);
check('线路偏好已持久化', store.happyEnglishVoiceProvider === 'youdao');
check('本次未调用系统语音', synth._speakCount === 0);
audio.onended();

/* ============ T2: 系统语音卡死（onstart 永不触发）→ 看门狗切换 ============ */
console.log('\n[T2] 系统语音卡死，1.3 秒看门狗切换到在线');
synth._voices = [
  { name: 'Microsoft Zira - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Huihui - Chinese', lang: 'zh-CN' }
];
Speech.voice = Speech.pickVoice(synth._voices);
Speech.webFailed = false; Speech.webOk = false;
Speech._webFailNotified = false;
Speech.mode = 'auto';
const srcBefore = Speech._audio ? Speech._audio.src : null;
const playsBefore = Speech._audio ? Speech._audio.playCount : 0;
Speech.speak('banana');
advance(100); // 越过 60ms 延迟
check('系统语音被调用', synth._speakCount === 1);
check('此时尚未切在线（音频未动）', (Speech._audio.src || null) === srcBefore && Speech._audio.playCount === playsBefore);
advance(1400); // 看门狗触发
check('看门狗触发后已切在线', Speech._audio && /youdao|baidu|sogou/.test(Speech._audio.src || ''));
check('webFailed 已标记', Speech.webFailed === true);
check('toast 提示过系统语音不可用', /系统语音不可用/.test(toastEl.textContent));
Speech._audio.onplaying(); Speech._audio.onended();
// 再说一个词：应直接走在线，不再碰系统语音
const speakCountBefore = synth._speakCount;
Speech.speak('orange');
advance(10);
check('后续 speak 直接走在线（不再调系统语音）', synth._speakCount === speakCountBefore && /youdao|baidu|sogou/.test(Speech._audio.src || ''));
Speech._audio.onplaying(); Speech._audio.onended();

/* ============ T3: 线路1失败 → 自动换线路2重试同一单词 ============ */
console.log('\n[T3] 有道词典线路失败，自动换备用线路重试');
delete store.happyEnglishVoiceProvider;
Speech.probe = {};
Speech.speak('cat');
advance(10);
check('第一条线路是有道词典', /dict\.youdao\.com/.test(Speech._audio.src), Speech._audio.src);
Speech._audio.onerror(); // 模拟线路 1 播放失败
check('自动切换到下一条线路', /fanyi\.baidu\.com\/gettts/.test(Speech._audio.src), Speech._audio.src);
const line2 = Speech._audio.src;
Speech._audio.onplaying(); // 线路 2 成功
check('失败的线路被标记不可用', Speech.probe.youdao === false);
check('成功的线路被标记可用并持久化', store.happyEnglishVoiceProvider === ONLINE_PROVIDERS.find(p => line2 && p.url('cat') === line2).id);
Speech._audio.onended();

/* ============ T4: 全部线路失败 → 明确提示检查网络 ============ */
console.log('\n[T4] 所有在线线路都失败时的兜底提示');
Speech.probe = { youdao: false, baidu: false, youdao1: false };
Speech.speak('dog');
advance(10);
for (let i = 0; i < 3; i++) Speech._audio.onerror();
check('3 条线路都试过了', Speech._audio.playCount >= 3);
check('给出网络检查提示', /所有在线发音线路都不可用/.test(toastEl.textContent), toastEl.textContent);

/* ============ T5: 线路连通性探测 ============ */
console.log('\n[T5] probeProviders 连通性探测');
class ProbeAudio extends FakeAudio {
  load() { fakeSetTimeout(() => { if (this.onloadeddata) this.onloadeddata(); }, 30); }
}
sandbox.Audio = ProbeAudio;
delete store.happyEnglishVoiceProvider;
Speech.probe = {};
const probeResult = Speech.probeProviders();
advance(60); // 让探测的 loadeddata 触发
return probeResult.then(r => {
  check('3 条线路全部探测完成', Object.keys(r).length === 3);
  check('有道词典探测为可用', r.youdao === true);
  sandbox.Audio = FakeAudio;

  /* ============ T6: 语音设置面板渲染 ============ */
  console.log('\n[T6] 语音设置面板');
  Speech.togglePanel();
  const panel = Speech._panel;
  check('面板已创建并打开', !!panel && panel.classList.toggle() === true);
  check('面板包含引擎状态', /当前引擎/.test(panel.innerHTML));
  check('面板包含 4 条线路', (panel.innerHTML.match(/vp-row/g) || []).length >= 6);
  check('面板包含操作按钮', /试听在线发音|自动模式|仅在线发音/.test(panel.innerHTML));

  /* ============ T7: CSP 拦截识别（内置预览环境） ============ */
  console.log('\n[T7] CSP 拦截识别（预览环境特征）');
  sandbox.window.location = { protocol: 'http:', hostname: '127.0.0.1' };
  Speech.probe = { youdao: false, baidu: false, youdao1: false };
  check('_looksCSP 识别预览环境', Speech._looksCSP() === true);
  Speech.speak('egg');
  advance(10);
  for (let i = 0; i < 3; i++) Speech._audio.onerror();
  check('全失败时提示 CSP 拦截（而非网络）', /预览环境/.test(toastEl.textContent), toastEl.textContent);
  Speech._renderPanel();
  check('面板显示 CSP 警告横幅', /安全策略/.test(Speech._panel.innerHTML));
  // file:// 打开时不应误报
  sandbox.window.location = { protocol: 'file:', hostname: '' };
  check('file:// 打开时不误报 CSP', Speech._looksCSP() === false);

  console.log('\n========== 结果: ' + pass + ' 通过 / ' + fail + ' 失败 ==========');
  process.exit(fail ? 1 : 0);
});
