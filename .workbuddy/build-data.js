/* 构建脚本：从单文件 HTML 中提取数据，合并年级，生成 js/ 下的数据文件 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = 'C:\\Users\\yangle\\Desktop\\作业\\english-study';
const html = fs.readFileSync(path.join(dir, '小学英语学习系统.html'), 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const dataSrc = src.slice(src.indexOf('const wordDatabase'), src.indexOf('const Speech'));

const sb = {};
vm.runInNewContext(dataSrc + ';globalThis.o = { wordDatabase, grammarData, grammarQuiz };', sb);
const { wordDatabase, grammarData, grammarQuiz } = sb.o;

// ---- 合并年级 ----
const mergedWords = Object.assign({}, wordDatabase['3'], wordDatabase['4'], wordDatabase['5'], wordDatabase['6']);
const mergedGrammar = [].concat(grammarData['3'], grammarData['4'], grammarData['5'], grammarData['6']);
const mergedQuiz = Object.assign({}, grammarQuiz['3'], grammarQuiz['4'], grammarQuiz['5'], grammarQuiz['6']);

// ---- 安全校验 ----
const catKeys = Object.keys(mergedWords);
const dupCat = catKeys.filter((k, i) => catKeys.indexOf(k) !== i);
if (dupCat.length) throw new Error('分类 key 重复: ' + dupCat);
const topicIds = mergedGrammar.map(t => t.id);
const dupTopic = topicIds.filter((k, i) => topicIds.indexOf(k) !== i);
if (dupTopic.length) throw new Error('语法专题 id 重复: ' + dupTopic);
// 语法专题必须有对应题库（卡片上有"做本节练习"入口）
const missing = topicIds.filter(id => !mergedQuiz[id] || !mergedQuiz[id].length);
if (missing.length) throw new Error('语法专题缺题库: ' + missing);

const wordTotal = Object.values(mergedWords).reduce((n, c) => n + c.words.length, 0);
const quizTotal = Object.values(mergedQuiz).reduce((n, qs) => n + qs.length, 0);

const banner = (title) => `/* ============================================================
 * ${title}
 * 快乐英语乐园 · 数据文件（可直接编辑，增删内容无需改其他文件）
 * 生成日期：2026-08-30
 * ============================================================ */
`;

fs.mkdirSync(path.join(dir, 'js'), { recursive: true });
fs.writeFileSync(path.join(dir, 'js', 'data-words.js'),
  banner('单词知识库（共 ' + wordTotal + ' 个单词 / ' + catKeys.length + ' 个分类）') +
  '\nconst wordDatabase = ' + JSON.stringify(mergedWords, null, 2) + ';\n');
fs.writeFileSync(path.join(dir, 'js', 'data-grammar.js'),
  banner('语法知识库（共 ' + mergedGrammar.length + ' 个专题）') +
  '\nconst grammarData = ' + JSON.stringify(mergedGrammar, null, 2) + ';\n');
fs.writeFileSync(path.join(dir, 'js', 'data-quiz.js'),
  banner('语法练习题库（共 ' + quizTotal + ' 道，按专题 id 组织）') +
  '\nconst grammarQuiz = ' + JSON.stringify(mergedQuiz, null, 2) + ';\n');

console.log('OK 分类:', catKeys.length, '| 单词:', wordTotal, '| 语法专题:', mergedGrammar.length, '| 题目:', quizTotal);
