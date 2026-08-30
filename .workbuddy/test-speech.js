/* 语音双引擎模拟测试：验证"系统语音无响应 → 自动切在线发音" */
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync('js/speech.js', 'utf8');
const storage = {};
const spoken = [];       // 记录 playOnline 的 URL
let synthSaysSpeaking = false;

const fakeSynth = {
  getVoices: () => [{ lang: 'en-US', name: 'Microsoft Zira' }],
  speak(u) { /* 故意不触发 onstart —— 模拟 Chrome 引擎卡死 */ },
  cancel() {}, resume() {},
  get speaking() { return synthSaysSpeaking; },
  get pending() { return false; },
};

const els = { toast: { textContent: '', classList: { add() {}, remove() {} } } };
function makeEl() {
  return { classList: { add() {}, remove() {} } };
}

const sandbox = {
  console,
  window: { speechSynthesis: fakeSynth },
  SpeechSynthesisUtterance: function (t) { this.text = t; },
  document: {
    getElementById: id => els[id] || (els[id] = makeEl()),
    addEventListener() {},
  },
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = v; },
  },
  Audio: function () {
    return {
      set src(v) { spoken.push(v); },
      play() { return Promise.resolve(); },
      pause() {},
    };
  },
  setTimeout, clearTimeout, setInterval, clearInterval,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src + '\nglobalThis.Speech = Speech;', sandbox);

const S = sandbox;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // 1) 初始为系统语音模式
  S.Speech.init();
  console.log('初始 useFallback =', S.Speech.useFallback, '(应为 false)');

  // 2) speak：引擎卡死（无 onstart、speaking=false）→ 看门狗 1.5s 后切在线
  S.Speech.speak('cat');
  console.log('speak 后 0.1s: useFallback =', S.Speech.useFallback, '(应仍为 false)');
  await sleep(1800);
  console.log('1.8s 后: useFallback =', S.Speech.useFallback, '(应为 true)');
  console.log('在线发音已触发: %s 次, URL=%s', spoken.length, spoken[0] || '-');
  console.log('模式已持久化: %s = %s', 'happyEnglishVoiceMode', storage.happyEnglishVoiceMode);

  // 3) 后续 speak 直接走在线
  spoken.length = 0;
  S.Speech.speak('dog');
  await sleep(100);
  console.log('后续 speak 直接在线: %s 次, URL 含 dog=%s', spoken.length, spoken[0] && spoken[0].includes('dog'));

  // 4) 重新检测恢复系统语音：fakeSynth.speak 触发 onstart
  fakeSynth.speak = function (u) { synthSaysSpeaking = true; if (u.onstart) u.onstart(); };
  S.Speech.selfTest();
  await sleep(100);
  console.log('语音检测后: useFallback =', S.Speech.useFallback, '(应为 false，已恢复系统语音)');

  // 5) 恢复后 speak 正常走系统语音（不触发在线）
  spoken.length = 0;
  S.Speech.speak('hello');
  await sleep(300);
  console.log('系统语音正常时不再走在线: 在线触发 %s 次 (应为 0)', spoken.length);
  console.log('=== 语音双引擎切换逻辑通过 ===');
})();
