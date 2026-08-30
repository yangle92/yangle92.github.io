/* ============================================================
 * 语音朗读模块（speech.js）—— 可靠语音方案 v5
 *
 * 设计目标：只要电脑能上网，点喇叭就一定有声音。
 *
 * 三层保障：
 *   1.【引擎选择】自动 / 系统语音 / 在线发音，可在"语音设置"面板手动切换
 *   2.【多线路池】在线发音不是单一接口，而是 4 条线路：
 *        有道词典 → 有道备用 → 百度语音 → 搜狗语音
 *      某条线路播放失败（被网络环境挡掉/超时/报错）自动换下一条，
 *      并把成功的线路记住，后续优先使用
 *   3.【连通性探测】面板里可一键检测 4 条线路是否可达，
 *      结果用红绿圆点直观展示，出问题一眼就能看出卡在哪
 *
 * 系统语音使用条件：找到了英文音色 且 没有失败记录。
 * 任何时候系统语音失败（无英文音色 / 1.3 秒未启动 / 报错），
 * 立即自动改走在线线路，本次照常出声。
 * ============================================================ */
"use strict";

const VOICE_MODE_KEY = 'happyEnglishVoiceMode';       // auto | web | online
const VOICE_PROVIDER_KEY = 'happyEnglishVoiceProvider';

/* 在线发音线路池（按默认优先级排列，会根据实测结果动态调整）
 * 全部经过 curl 实测可用（2026-08-30），勿添加未验证的线路 */
const ONLINE_PROVIDERS = [
  { id: 'youdao',  name: '有道词典·美音', url: t => 'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(t) },
  { id: 'baidu',   name: '百度语音',       url: t => 'https://fanyi.baidu.com/gettts?lan=en&text=' + encodeURIComponent(t) + '&spd=3&source=web' },
  { id: 'youdao1', name: '有道词典·英音', url: t => 'https://dict.youdao.com/dictvoice?type=1&audio=' + encodeURIComponent(t) }
];

/* 一段 0 字节的静音 wav，用来在首次点击时解锁 <audio> 自动播放 */
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

const Speech = {
  supported: ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined'),
  mode: 'auto',        // auto | web | online
  voice: null,
  webOk: false,        // 系统语音验证成功过
  webFailed: false,    // 系统语音本次会话内失败过
  current: null,       // 持有 utterance 引用防 GC（Chrome 已知 bug）
  probe: {},           // { 线路id: true|false } 连通性探测结果
  _audio: null,
  _unlockAudio: null,
  _watchdog: null,
  _audioTimer: null,
  _onlineToken: 0,
  _probed: false,
  _webFailNotified: false,
  _panel: null,
  cspBlocked: false,   // 检测到宿主环境的 CSP 拦截了外部音频（如内置预览面板）

  init() {
    try {
      const m = localStorage.getItem(VOICE_MODE_KEY);
      if (m === 'online' || m === 'web' || m === 'auto') this.mode = m;
    } catch (e) { /* ignore */ }
    if (!this.supported) this.mode = 'online';

    if (this.supported) {
      const synth = window.speechSynthesis;
      const loadVoices = () => {
        const voices = synth.getVoices() || [];
        const v = voices.length ? this.pickVoice(voices) : null;
        if (v) this.voice = v;
      };
      loadVoices();
      synth.onvoiceschanged = loadVoices;   // Chrome 异步加载
      let tries = 0;
      const timer = setInterval(() => {     // 加载慢的浏览器轮询重试
        loadVoices();
        if (++tries > 20 || this.voice) clearInterval(timer);
      }, 400);

      // iOS Safari：手势先解锁系统语音
      const unlock = () => {
        try {
          const u = new SpeechSynthesisUtterance(' ');
          u.volume = 0;
          synth.speak(u);
        } catch (e) { /* ignore */ }
      };
      document.addEventListener('touchstart', unlock, { once: true, passive: true });
    }

    // 首次任意点击：用静音 wav 解锁 <audio>（Safari/部分浏览器需要）
    const unlockAudio = () => {
      try {
        this._unlockAudio = new Audio(SILENT_WAV);
        this._unlockAudio.volume = 0;
        const p = this._unlockAudio.play();
        if (p && p.catch) p.catch(() => { /* ignore */ });
      } catch (e) { /* ignore */ }
    };
    document.addEventListener('click', unlockAudio, { once: true, passive: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

    // 监听 CSP 违规：内置预览面板等宿主环境会拦截外部音频，
    // 捕获到 media-src 违规即可断定"不是网络问题，是当前环境不允许播放在线音频"
    document.addEventListener('securitypolicyviolation', (e) => {
      if (e && (e.violatedDirective || '').indexOf('media') === 0) {
        this.cspBlocked = true;
        this._renderPanel();
      }
    });
  },

  setMode(m) {
    this.mode = m;
    try { localStorage.setItem(VOICE_MODE_KEY, m); } catch (e) { /* ignore */ }
    toast(m === 'online' ? '已切换为在线发音（需要联网）' :
          m === 'web'     ? '已切换为系统语音（若无声会自动回退在线发音）' :
                            '已切换为自动模式（优先系统语音，失败自动走在线）');
    this._renderPanel();
  },

  pickVoice(voices) {
    const en = voices.filter(v => /^en/i.test(v.lang || ''));
    if (!en.length) return null;
    return en.find(v => /en[-_]us/i.test(v.lang))
        || en.find(v => /google|natural|online|samantha|aria|jenny|guy|david|zira|libby|ryan/i.test(v.name))
        || en.find(v => /en[-_]gb/i.test(v.lang))
        || en[0];
  },

  /* ================= 统一入口 ================= */
  speak(text, btn) {
    if (!text) return;
    this._stopAll();
    if (this.mode === 'online' || !this.supported) return this.playOnline(text, btn);
    const webUsable = this.voice && !this.webFailed;
    if (this.mode === 'web' || (this.mode === 'auto' && webUsable)) return this.tryWeb(text, btn);
    return this.playOnline(text, btn);
  },

  /* ================= 引擎 A：系统语音 ================= */
  tryWeb(text, btn) {
    if (!this.supported || !this.voice) {
      this._webFail('未检测到英文语音包');
      return this.playOnline(text, btn);
    }
    const synth = window.speechSynthesis;
    try { if (synth.speaking || synth.pending) synth.cancel(); if (synth.paused) synth.resume(); } catch (e) { /* ignore */ }

    const u = new SpeechSynthesisUtterance(text);
    u.voice = this.voice;
    u.lang = this.voice.lang || 'en-US';
    u.rate = 0.85;
    u.pitch = 1.05;
    u.volume = 1;
    this.current = u;

    const done = () => { if (btn) btn.classList.remove('speaking'); };
    if (btn) btn.classList.add('speaking');
    let started = false;
    u.onstart = () => { started = true; this.webOk = true; this.webFailed = false; };
    u.onend = () => { done(); this._clearWatchdog(); this.current = null; };
    u.onerror = (e) => {
      done(); this._clearWatchdog(); this.current = null;
      const err = e && e.error;
      if (err === 'interrupted' || err === 'canceled') return; // 主动切换单词，不算失败
      this._webFail('系统语音报错');
      this.playOnline(text, btn);
    };

    setTimeout(() => {
      try { synth.speak(u); } catch (err) {
        this._webFail('系统语音异常');
        return this.playOnline(text, btn);
      }
      // 看门狗：1.3 秒内 onstart 没触发就放弃系统语音。
      // 注意：不参考 synth.speaking —— 引擎卡死时它会一直保持 true，会误判
      this._watchdog = setTimeout(() => {
        if (started) return;
        this._webFail('系统语音无响应');
        this.playOnline(text, btn);
      }, 1300);
    }, 60);
  },

  _webFail(reason) {
    this.webFailed = true;
    this.webOk = false;
    if (this.supported) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    if (!this._webFailNotified) {
      this._webFailNotified = true;
      toast('系统语音不可用（' + reason + '），已自动改用在线发音', 3600);
    }
    this._renderPanel();
  },

  /* ================= 引擎 B：在线发音（多线路池） ================= */
  playOnline(text, btn) {
    const token = ++this._onlineToken;
    const ordered = this._orderedProviders();
    if (btn) btn.classList.add('speaking');
    let i = 0;
    const next = () => {
      if (token !== this._onlineToken) return;   // 已经开始播下一个词了，放弃本次
      if (i >= ordered.length) {
        if (btn) btn.classList.remove('speaking');
        toast(this.cspBlocked || this._looksCSP()
          ? '当前预览环境的安全策略拦截了在线音频 🔒 请关闭预览，双击 HTML 文件用 Chrome 打开即可正常发音'
          : '所有在线发音线路都不可用：请检查电脑是否联网 🌐（可点右上角"语音设置"逐条检测线路）', 5000);
        this._renderPanel();
        return;
      }
      this._playUrl(ordered[i++], text, btn, token, next);
    };
    next();
  },

  _playUrl(provider, text, btn, token, onFail) {
    if (!this._audio) this._audio = new Audio();
    const a = this._audio;
    a.onended = a.onerror = a.onplaying = null;
    clearTimeout(this._audioTimer);
    let settled = false;

    const fail = () => {
      if (settled || token !== this._onlineToken) return;
      settled = true;
      clearTimeout(this._audioTimer);
      a.onplaying = a.onerror = a.onended = null;
      try { a.pause(); } catch (e) { /* ignore */ }
      if (this.probe[provider.id] !== false) this.probe[provider.id] = false;
      onFail();   // 换下一条线路重试
    };

    a.onerror = fail;
    a.onplaying = () => {
      if (settled || token !== this._onlineToken) return;
      settled = true;
      clearTimeout(this._audioTimer);
      if (this.probe[provider.id] !== true) {
        this.probe[provider.id] = true;          // 这条线路实测可用，记住
        try { localStorage.setItem(VOICE_PROVIDER_KEY, provider.id); } catch (e) { /* ignore */ }
        this._renderPanel();
      }
      a.onended = () => { if (btn) btn.classList.remove('speaking'); };
    };

    a.src = provider.url(text);
    this._audioTimer = setTimeout(fail, 7000);   // 7 秒还没出声按失败处理
    const p = a.play();
    if (p && p.catch) p.catch(fail);
  },

  /* 线路排序：上次成功的排最前，其次探测过可用的，最后未知的 */
  _orderedProviders() {
    let saved = null;
    try { saved = localStorage.getItem(VOICE_PROVIDER_KEY); } catch (e) { /* ignore */ }
    const arr = ONLINE_PROVIDERS.slice();
    arr.sort((x, y) => this._providerScore(y, saved) - this._providerScore(x, saved));
    return arr;
  },
  _providerScore(p, saved) {
    if (saved && p.id === saved) return 3;
    if (this.probe[p.id] === true) return 2;
    if (this.probe[p.id] === false) return 0;
    return 1;
  },

  /* 线路连通性探测：加载 'hello' 的音频，5 秒内拿到数据即算可用 */
  probeProviders() {
    const jobs = ONLINE_PROVIDERS.map(p => new Promise(resolve => {
      let a;
      try { a = new Audio(); } catch (e) { return resolve(false); }
      let done = false;
      const finish = ok => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        a.onloadeddata = a.onerror = null;
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) { /* ignore */ }
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), 5000);
      a.onloadeddata = () => finish(true);
      a.onerror = () => finish(false);
      a.preload = 'auto';
      a.src = p.url('hello');
      try { a.load(); } catch (e) { finish(false); }
    }));
    return Promise.all(jobs).then(arr => {
      ONLINE_PROVIDERS.forEach((p, i) => { this.probe[p.id] = arr[i]; });
      this._probed = true;
      return this.probe;
    });
  },

  /* 判断"全部线路失败"是否疑似宿主环境 CSP 拦截：
   * 页面由本地预览服务器承载（127.0.0.1/localhost、非 file:// 打开），
   * 且 3 条互不相关的线路全部失败——普通断网很难同时杀死有道+百度 */
  _looksCSP() {
    if (this.cspBlocked) return true;
    try {
      const loc = window.location;
      const allBad = ONLINE_PROVIDERS.every(p => this.probe[p.id] === false);
      return allBad && /^https?:$/.test(loc.protocol) &&
             /^(127\.|localhost|\[::1\])/.test(loc.hostname);
    } catch (e) { return false; }
  },

  /* ================= 语音设置面板 ================= */
  /* 点右上角按钮打开：展示引擎状态 + 线路检测结果，支持手动切换/试听 */
  selfTest() { this.togglePanel(); },

  togglePanel() {
    this._ensurePanel();
    const open = this._panel.classList.toggle('open');
    if (open) {
      this._renderPanel();
      if (!this._probed) this._autoProbe();
    }
  },

  _ensurePanel() {
    if (this._panel) return;
    const el = document.createElement('div');
    el.id = 'voicePanel';
    document.body.appendChild(el);
    this._panel = el;
    // 点击面板外部时关闭
    document.addEventListener('click', (e) => {
      if (!el.classList.contains('open')) return;
      if (el.contains(e.target)) return;
      if (e.target && e.target.closest && e.target.closest('#voiceTestBtn')) return;
      el.classList.remove('open');
    });
  },

  _autoProbe() {
    this._renderPanel();          // 先渲染"检测中"状态
    this.probeProviders().then(() => this._renderPanel());
  },

  _renderPanel() {
    if (!this._panel) return;
    const engine = this.mode === 'online' ? '在线发音' :
                   this.mode === 'web' ? '系统语音' : '自动（优先系统语音）';
    let enCount = 0, voiceName = null;
    if (this.supported) {
      const en = (window.speechSynthesis.getVoices() || []).filter(v => /^en/i.test(v.lang || ''));
      enCount = en.length;
      voiceName = (this.voice && this.voice.name) || (en[0] && en[0].name) || null;
    }
    const webState = !this.supported ? '浏览器不支持' :
                     this.webOk ? '正常' :
                     this.webFailed ? '启动失败，已自动改用在线发音' : '未验证';

    let saved = null;
    try { saved = localStorage.getItem(VOICE_PROVIDER_KEY); } catch (e) { /* ignore */ }
    const lines = ONLINE_PROVIDERS.map(p => {
      const st = this.probe[p.id];
      const dot = st === true ? 'ok' : st === false ? 'bad' : 'wait';
      const label = st === true ? '可用' : st === false ? '不可用' : '未检测';
      const cur = saved === p.id ? ' · 当前线路' : '';
      return '<div class="vp-row"><span class="vp-dot ' + dot + '"></span>' +
             '<span>' + p.name + '</span><span class="vp-st">' + label + cur + '</span></div>';
    }).join('');

    this._panel.innerHTML =
      '<button class="vp-close" title="关闭">✕</button>' +
      '<h4>🔊 语音设置</h4>' +
      '<div class="vp-status">' +
        '<div class="vp-row"><span class="vp-dot ' + (this.webOk ? 'ok' : this.webFailed ? 'bad' : 'wait') + '"></span>' +
          '<span>当前引擎：<b>' + engine + '</b></span></div>' +
        '<div class="vp-row"><span class="vp-dot ' + (enCount ? 'ok' : 'bad') + '"></span>' +
          '<span>系统英文音色：' + (enCount ? enCount + ' 个（' + voiceName + '）' : '未检测到') + '</span></div>' +
        '<div class="vp-row"><span class="vp-dot ' + (this.webOk ? 'ok' : this.webFailed ? 'bad' : 'wait') + '"></span>' +
          '<span>系统语音状态：' + webState + '</span></div>' +
      '</div>' +
      '<div class="vp-sec">在线发音线路（播放失败自动切换）</div>' + lines +
      (this._looksCSP() ? '<div class="vp-warn">🔒 检测到当前预览环境的安全策略（CSP）拦截了外部音频——这不是网络问题！<br>请关闭此预览，到文件夹中<b>双击 HTML 文件</b>用 Chrome 打开，即可正常发音。</div>' : '') +
      '<div class="vp-btns">' +
        '<button class="vp-btn" data-act="probe">🔄 检测线路</button>' +
        '<button class="vp-btn" data-act="testweb">🔈 试听系统语音</button>' +
        '<button class="vp-btn" data-act="testonline">🌐 试听在线发音</button>' +
        '<button class="vp-btn" data-act="auto">✨ 自动模式</button>' +
        '<button class="vp-btn" data-act="web">仅系统语音</button>' +
        '<button class="vp-btn" data-act="online">仅在线发音</button>' +
      '</div>';

    const panel = this._panel;
    panel.querySelectorAll('.vp-btn').forEach(b => {
      b.addEventListener('click', (e) => { e.stopPropagation(); this._panelAct(b.dataset.act); });
    });
    const close = panel.querySelector('.vp-close');
    if (close) close.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.remove('open'); });
  },

  _panelAct(act) {
    const sample = 'Hello! Let us learn English together!';
    if (act === 'probe') { this._autoProbe(); return; }
    if (act === 'testweb') {
      this.webFailed = false;
      this.webOk = false;
      this._webFailNotified = false;
      if (!this.supported || !this.voice) {
        toast('未检测到英文语音包：Windows 设置 → 时间和语言 → 语音 → 添加 English 语音包；添加后点“重新检测”');
        this._renderPanel();
        return;
      }
      toast('正在试听系统语音…');
      this.tryWeb(sample, null);
      setTimeout(() => this._renderPanel(), 3000);
      return;
    }
    if (act === 'testonline') { this.playOnline(sample, null); return; }
    if (act === 'auto' || act === 'web' || act === 'online') {
      if (act === 'web' && (!this.supported || !this.voice)) {
        toast('未检测到英文语音包，无法使用系统语音');
        return;
      }
      this.setMode(act);
      if (act === 'web') { this.webFailed = false; this.webOk = false; }
      return;
    }
  },

  /* ================= 内部工具 ================= */
  _stopAll() {
    this._clearWatchdog();
    this._onlineToken++;
    clearTimeout(this._audioTimer);
    if (this._audio) {
      this._audio.onended = this._audio.onerror = this._audio.onplaying = null;
      try { this._audio.pause(); } catch (e) { /* ignore */ }
    }
    if (this.current) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      this.current = null;
    }
  },

  _clearWatchdog() {
    if (this._watchdog) { clearTimeout(this._watchdog); this._watchdog = null; }
  }
};

/* ============================================================
 * 全局兼容函数（onclick 内联调用）+ toast 提示
 * ============================================================ */
function speakWord(text) { Speech.speak(text); }
function playWord(event, word) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  Speech.speak(word, event && event.currentTarget);
}

let toastTimer = null;
function toast(msg, duration) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration || 2400);
}
