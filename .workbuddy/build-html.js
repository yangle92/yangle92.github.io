/* 构建脚本：重建 HTML —— 去掉年级筛选，改为引用 js/ 目录下的外部脚本 */
const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\yangle\\Desktop\\作业\\english-study';
const file = path.join(dir, '小学英语学习系统.html');
let html = fs.readFileSync(file, 'utf8');

function mustReplace(str, from, to) {
  if (!str.includes(from)) throw new Error('未找到目标片段: ' + from.slice(0, 60) + '...');
  return str.split(from).join(to);
}

// 1) CSS：删除 grade-nav / grade-btn 样式，换成语音检测按钮样式
html = mustReplace(html,
`.grade-nav {
  max-width: 1100px; margin: 10px auto 0;
  display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
}
.grade-btn {
  border: 3px solid transparent;
  background: var(--white);
  border-radius: 999px;
  padding: 8px 20px;
  font-family: inherit; font-size: 15px; font-weight: 800;
  color: var(--text-soft);
  cursor: pointer; transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(44,44,52,0.08);
}
.grade-btn:hover { transform: translateY(-2px); }
.grade-btn.active {
  background: var(--yellow); color: var(--text);
  border-color: #E8B900;
  box-shadow: 0 6px 16px rgba(232, 185, 0, 0.35);
}
`,
`.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.voice-test-btn {
  border: none; background: var(--white);
  padding: 8px 16px; border-radius: 999px;
  font-family: inherit; font-size: 14px; font-weight: 800;
  color: var(--text-soft); cursor: pointer;
  box-shadow: var(--shadow); transition: all 0.2s ease;
}
.voice-test-btn:hover { transform: translateY(-2px); color: var(--text); }
.voice-test-btn.speaking { animation: pulse 0.8s ease infinite; background: var(--yellow); }
`);

// 2) 打印样式里去掉 .grade-nav
html = mustReplace(html,
  'header, .tab-nav, .grade-nav, .quiz-next-btn, .result-actions, .back-btn, .speak-btn, .example-speak { display: none; }',
  'header, .tab-nav, .quiz-next-btn, .result-actions, .back-btn, .speak-btn, .example-speak { display: none; }');

// 3) HTML：header 里加语音检测按钮，删除年级导航条
html = mustReplace(html,
`    <div class="stars-display">
      <span class="star">⭐</span>
      <span id="totalStars">0</span> 颗星星
    </div>
  </div>
  <div class="grade-nav" id="gradeNav">
    <button class="grade-btn" data-grade="3">3️⃣ 三年级</button>
    <button class="grade-btn" data-grade="4">4️⃣ 四年级</button>
    <button class="grade-btn" data-grade="5">5️⃣ 五年级</button>
    <button class="grade-btn" data-grade="6">6️⃣ 六年级</button>
  </div>
  <div class="header-inner" style="padding-top:8px;">
`,
`    <div class="header-actions">
      <button class="voice-test-btn" id="voiceTestBtn" title="测试语音朗读是否正常">🔊 语音检测</button>
      <div class="stars-display">
        <span class="star">⭐</span>
        <span id="totalStars">0</span> 颗星星
      </div>
    </div>
  </div>
  <div class="header-inner">
`);

// 4) 去掉各处年级标签
html = mustReplace(html,
  '选择单词分类（<span id="gradeLabelVocab">三年级</span>）</h3>',
  '选择单词分类 <span id="wordTotalLabel" style="font-size:14px; font-weight:600; color:var(--text-soft);"></span></h3>');
html = mustReplace(html, '选择练习类型（<span id="gradeLabelPractice">三年级</span>）</h3>', '选择练习类型</h3>');
html = mustReplace(html, '学习统计（<span id="gradeLabelProgress">三年级</span>）</h3>', '学习统计</h3>');
html = mustReplace(html, '已掌握的单词（<span id="gradeLabelLearned">三年级</span>）</h3>', '已掌握的单词</h3>');
html = mustReplace(html, '<h4>本年级已学单词</h4>', '<h4>已学单词</h4>');

// 5) 页脚文案
html = mustReplace(html,
  '🌈 快乐英语乐园 · 覆盖小学 3-6 年级 · 每天进步一点点',
  '🌈 快乐英语乐园 · 小学英语词汇与语法 · 每天进步一点点');

// 6) 内联脚本 → 外部脚本（注意顺序：数据 → 语音 → 应用）
const scriptTags = `<script src="js/data-words.js"></script>
<script src="js/data-grammar.js"></script>
<script src="js/data-quiz.js"></script>
<script src="js/speech.js"></script>
<script src="js/app.js"></script>`;
html = html.replace(/<script>[\s\S]*<\/script>/, scriptTags);
if (html.includes('const wordDatabase') || html.includes('const Speech')) {
  throw new Error('内联脚本未完全移除');
}

fs.writeFileSync(file, html);
console.log('HTML 重建完成，大小:', html.length, '字符');
