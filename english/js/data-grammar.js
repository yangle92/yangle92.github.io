/* ============================================================
 * 语法知识库（共 21 个专题）
 * 快乐英语乐园 · 数据文件（可直接编辑，增删内容无需改其他文件）
 * 生成日期：2026-08-30
 * ============================================================ */

const grammarData = [
  {
    "id": "be",
    "emoji": "🔵",
    "title": "be 动词（am / is / are）",
    "diff": "⭐⭐",
    "intro": "<strong>什么是 be 动词？</strong><br>be 动词就像句子的\"胶水\"，把主语和后面的内容连起来。它有三个小伙伴：<strong>am</strong>、<strong>is</strong>、<strong>are</strong>，不同的主语要用不同的 be 动词哦！",
    "table": {
      "caption": "be 动词用法对照表",
      "headers": [
        "主语",
        "be 动词",
        "中文意思",
        "例句"
      ],
      "rows": [
        [
          "I（我）",
          "<span class=\"big\">am</span>",
          "是",
          "I <strong>am</strong> a student.<br>我是一名学生。"
        ],
        [
          "he / she / it<br>他 / 她 / 它",
          "<span class=\"big\">is</span>",
          "是",
          "She <strong>is</strong> my friend.<br>她是我的朋友。"
        ],
        [
          "you / we / they<br>你 / 我们 / 他们",
          "<span class=\"big\">are</span>",
          "是",
          "They <strong>are</strong> happy.<br>他们很开心。"
        ]
      ]
    },
    "tips": [
      "我用 am，你用 are，is 连着他她它",
      "单数名词用 is，复数名词全用 are",
      "变否定，很简单，be 后 not 加上去",
      "变疑问，往前提，句末问号莫丢弃"
    ],
    "examples": [
      {
        "en": "I am a girl. → I'm a girl.",
        "cn": "我是一个女孩。（缩写）"
      },
      {
        "en": "He is tall. → He's tall.",
        "cn": "他很高。"
      },
      {
        "en": "They are students. → They're students.",
        "cn": "他们是学生。"
      },
      {
        "en": "I am not late.",
        "cn": "我没有迟到。（否定）"
      },
      {
        "en": "Are you ready?",
        "cn": "你准备好了吗？（疑问句）"
      }
    ]
  },
  {
    "id": "aan",
    "emoji": "🍎",
    "title": "不定冠词 a / an",
    "diff": "⭐",
    "intro": "<strong>a 和 an 都表示\"一个\"</strong>，都用在单数可数名词前面。它们的区别只有一个：<strong>an 用在元音音素（发音）开头的单词前，a 用在辅音音素开头的单词前</strong>。记住是听发音，不是看字母哦！",
    "table": {
      "caption": "a / an 用法对照表",
      "headers": [
        "冠词",
        "用法",
        "例词",
        "例句"
      ],
      "rows": [
        [
          "<span class=\"big\">a</span>",
          "辅音音素开头",
          "a cat / a dog<br>a book / a pen",
          "I have <strong>a</strong> cat."
        ],
        [
          "<span class=\"big\">an</span>",
          "元音音素开头",
          "an apple / an egg<br>an orange / an eraser",
          "I eat <strong>an</strong> apple."
        ],
        [
          "<span class=\"big\">a</span>",
          "特殊：u 读 /juː/ 时用 a",
          "a useful book",
          "This is <strong>a</strong> useful book."
        ],
        [
          "<span class=\"big\">an</span>",
          "特殊：h 不发音时用 an",
          "an hour",
          "Wait for <strong>an</strong> hour."
        ]
      ]
    },
    "tips": [
      "看发音不看字母：an apple（虽然 a 是字母，但发元音 /æ/）",
      "元音字母 a e i o u 开头的单词，大多用 an",
      "一个单词前只能用 a 或 an，不能两个都用",
      "复数前不用 a / an：two apples ✗ an apples"
    ],
    "examples": [
      {
        "en": "This is an orange.",
        "cn": "这是一个橙子。"
      },
      {
        "en": "I have a pen and an eraser.",
        "cn": "我有一支钢笔和一块橡皮。"
      },
      {
        "en": "She is a student.",
        "cn": "她是一名学生。"
      },
      {
        "en": "There is an elephant in the zoo.",
        "cn": "动物园里有一头大象。"
      }
    ]
  },
  {
    "id": "pronoun",
    "emoji": "👤",
    "title": "人称代词（主格与宾格）",
    "diff": "⭐⭐",
    "intro": "<strong>什么是人称代词？</strong><br>人称代词就是用来代替人的词。分为<strong>主格</strong>（做主语，放在句子开头）和<strong>宾格</strong>（做宾语，放在动词或介词后面）。",
    "table": {
      "caption": "人称代词对照表",
      "headers": [
        "意思",
        "主格（做主语）",
        "宾格（做宾语）",
        "例句"
      ],
      "rows": [
        [
          "我",
          "<strong>I</strong>",
          "<strong>me</strong>",
          "<strong>I</strong> love you. → You love <strong>me</strong>."
        ],
        [
          "你",
          "<strong>you</strong>",
          "<strong>you</strong>",
          "<strong>You</strong> are my friend."
        ],
        [
          "他",
          "<strong>he</strong>",
          "<strong>him</strong>",
          "<strong>He</strong> is a boy. → Look at <strong>him</strong>."
        ],
        [
          "她",
          "<strong>she</strong>",
          "<strong>her</strong>",
          "<strong>She</strong> sings well. → I help <strong>her</strong>."
        ],
        [
          "它",
          "<strong>it</strong>",
          "<strong>it</strong>",
          "<strong>It</strong> is a dog. → I like <strong>it</strong>."
        ],
        [
          "我们",
          "<strong>we</strong>",
          "<strong>us</strong>",
          "<strong>We</strong> are friends. → Join <strong>us</strong>."
        ],
        [
          "他们",
          "<strong>they</strong>",
          "<strong>them</strong>",
          "<strong>They</strong> are happy. → Look at <strong>them</strong>."
        ]
      ]
    },
    "tips": [
      "主格放句首，宾格动/介后",
      "I 和 me 都是\"我\"，开头用 I，结尾用 me",
      "you 和 it 主格宾格长得一样，记住这两个最特别",
      "him / her / them 都有不同尾巴，分开记清楚"
    ],
    "examples": [
      {
        "en": "I like him very much.",
        "cn": "我非常喜欢他。"
      },
      {
        "en": "Please help me.",
        "cn": "请帮帮我。"
      },
      {
        "en": "We play with them after school.",
        "cn": "放学后我们和他们一起玩。"
      }
    ]
  },
  {
    "id": "imperative",
    "emoji": "📣",
    "title": "祈使句与 Let's 句型",
    "diff": "⭐",
    "intro": "<strong>什么是祈使句？</strong><br>祈使句就是<strong>命令、请求或建议</strong>别人做某事的句子，以<strong>动词原形开头</strong>，没有主语。加上 please 更有礼貌哦！<br><strong>Let's…</strong> 表示\"让我们一起做…\"，Let's 后面接动词原形。",
    "table": {
      "caption": "祈使句的几种形式",
      "headers": [
        "类型",
        "构成",
        "例句"
      ],
      "rows": [
        [
          "肯定祈使句",
          "动词原形 + 其他",
          "<strong>Open</strong> the door. 打开门。<br><strong>Stand</strong> up, please. 请起立。"
        ],
        [
          "否定祈使句",
          "Don't + 动词原形",
          "<strong>Don't</strong> run in the hall. 不要在走廊跑。<br><strong>Don't</strong> be late! 不要迟到！"
        ],
        [
          "礼貌请求",
          "please 放句首或句尾",
          "<strong>Close</strong> the window, please. 请关窗。"
        ],
        [
          "Let's 句型",
          "Let's + 动词原形",
          "<strong>Let's</strong> play football. 我们踢足球吧。"
        ]
      ]
    },
    "tips": [
      "祈使句开头没有 I / You，直接动词原形",
      "变成否定句，句首加 Don't",
      "Let's 是 Let us 的缩写，后面跟动词原形",
      "Let's 句型的回答：Good idea! / OK! / Sorry, I can't."
    ],
    "examples": [
      {
        "en": "Come in, please.",
        "cn": "请进。"
      },
      {
        "en": "Don't touch it!",
        "cn": "别碰它！"
      },
      {
        "en": "Let's go to the park.",
        "cn": "我们去公园吧。"
      },
      {
        "en": "Let's sing a song together.",
        "cn": "我们一起唱首歌吧。"
      }
    ]
  },
  {
    "id": "possessive",
    "emoji": "🎁",
    "title": "物主代词（表示\"谁的\"）",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是物主代词？</strong><br>物主代词就是表示\"某某的\"，用来说明东西属于谁。分为<strong>形容词性物主代词</strong>（后面要跟名词）和<strong>名词性物主代词</strong>（本身就等于\"形容词+名词\"）。",
    "table": {
      "caption": "物主代词对照表",
      "headers": [
        "意思",
        "形容词性（+名词）",
        "名词性（单独用）",
        "例句对比"
      ],
      "rows": [
        [
          "我的",
          "<strong>my</strong>",
          "<strong>mine</strong>",
          "This is <strong>my</strong> book. → This book is <strong>mine</strong>."
        ],
        [
          "你的",
          "<strong>your</strong>",
          "<strong>yours</strong>",
          "Is this <strong>your</strong> pen? → Is it <strong>yours</strong>?"
        ],
        [
          "他的",
          "<strong>his</strong>",
          "<strong>his</strong>",
          "That's <strong>his</strong> bag. → The bag is <strong>his</strong>."
        ],
        [
          "她的",
          "<strong>her</strong>",
          "<strong>hers</strong>",
          "This is <strong>her</strong> pencil. → It's <strong>hers</strong>."
        ],
        [
          "我们的",
          "<strong>our</strong>",
          "<strong>ours</strong>",
          "This is <strong>our</strong> classroom. → It's <strong>ours</strong>."
        ],
        [
          "他们的",
          "<strong>their</strong>",
          "<strong>theirs</strong>",
          "Those are <strong>their</strong> toys. → The toys are <strong>theirs</strong>."
        ]
      ]
    },
    "tips": [
      "形容词性像形容词，后面名词不能丢（my book）",
      "名词性很独立，自己就能当名词（mine, yours）",
      "my-mine, your-yours, her-hers，加个 s 就变身",
      "his 和 its 不变化，记住它们最特别"
    ],
    "examples": [
      {
        "en": "My hair is long. Hers is short.",
        "cn": "我的头发长。她的短。"
      },
      {
        "en": "Our school is big. Theirs is small.",
        "cn": "我们的学校大。他们的小。"
      },
      {
        "en": "I do my homework. He does his.",
        "cn": "我做我的作业。他做他的。"
      }
    ]
  },
  {
    "id": "these",
    "emoji": "👆",
    "title": "指示代词 this / that / these / those",
    "diff": "⭐⭐",
    "intro": "<strong>什么是指示代词？</strong><br>指示代词就是用来\"指东西\"的词。离得近的用 this（这个）/ these（这些），离得远的用 that（那个）/ those（那些）。",
    "table": {
      "caption": "指示代词对照表",
      "headers": [
        "",
        "单数",
        "复数",
        "距离"
      ],
      "rows": [
        [
          "近处",
          "<strong>this</strong> 这个",
          "<strong>these</strong> 这些",
          "🚶 离得近"
        ],
        [
          "远处",
          "<strong>that</strong> 那个",
          "<strong>those</strong> 那些",
          "🏃 离得远"
        ]
      ]
    },
    "tips": [
      "this 和 these 都有 i → 想到 here（这里）→ 近的",
      "that 和 those 都有 a → 想到 there（那里）→ 远的",
      "this / that 后面用 is，these / those 后面用 are",
      "结尾带 s 的（these / those）是复数"
    ],
    "examples": [
      {
        "en": "This is my pen.",
        "cn": "这是我的钢笔。（近处）"
      },
      {
        "en": "That is a bird in the tree.",
        "cn": "树上那是一只鸟。（远处）"
      },
      {
        "en": "These are my books.",
        "cn": "这些是我的书。（复数）"
      },
      {
        "en": "Those are mountains far away.",
        "cn": "那些是远处的山。（远+复数）"
      }
    ]
  },
  {
    "id": "plural",
    "emoji": "🔢",
    "title": "名词复数",
    "diff": "⭐⭐",
    "intro": "<strong>什么是名词复数？</strong><br>英语里表示\"两个或以上\"的东西时，名词要变复数。大多数直接加 <strong>-s</strong>，但也有一些特殊变化哦！",
    "table": {
      "caption": "名词复数变化规则表",
      "headers": [
        "规则",
        "变化方法",
        "例词"
      ],
      "rows": [
        [
          "一般情况",
          "直接加 <strong>-s</strong>",
          "book → book<strong>s</strong> / cat → cat<strong>s</strong>"
        ],
        [
          "以 s, x, ch, sh 结尾",
          "加 <strong>-es</strong>",
          "bus → bus<strong>es</strong> / box → box<strong>es</strong> / watch → watch<strong>es</strong>"
        ],
        [
          "\"辅音字母+y\"结尾",
          "变 y 为 i 加 <strong>-es</strong>",
          "baby → bab<strong>ies</strong> / strawberry → strawberr<strong>ies</strong>"
        ],
        [
          "以 f / fe 结尾",
          "变 f / fe 为 <strong>-ves</strong>",
          "leaf → lea<strong>ves</strong> / knife → kni<strong>ves</strong>"
        ],
        [
          "不规则变化",
          "要单独记",
          "man → <strong>men</strong> / child → <strong>children</strong> / foot → <strong>feet</strong> / tooth → <strong>teeth</strong>"
        ],
        [
          "单复数同形",
          "不变",
          "fish → <strong>fish</strong> / sheep → <strong>sheep</strong>"
        ]
      ]
    },
    "tips": [
      "大多数名词加 s 就变复数，最简单",
      "bus、box、watch 结尾特殊，要加 es",
      "辅音+y 结尾，y 变 i 再加 es（元音+y 直接加 s：boys）",
      "man-men, child-children, foot-feet 是最常见的三个不规则"
    ],
    "examples": [
      {
        "en": "I have two cats and three dogs.",
        "cn": "我有两只猫和三条狗。"
      },
      {
        "en": "There are many buses on the road.",
        "cn": "路上有很多公交车。"
      },
      {
        "en": "How many children are there in your class?",
        "cn": "你们班有多少个孩子？"
      }
    ]
  },
  {
    "id": "prep",
    "emoji": "📦",
    "title": "方位介词 in / on / under / behind",
    "diff": "⭐⭐",
    "intro": "<strong>什么是方位介词？</strong><br>方位介词用来说明东西<strong>在哪里</strong>。想象一个盒子和一只猫，就能记住它们啦！",
    "table": {
      "caption": "常用方位介词表",
      "headers": [
        "介词",
        "意思",
        "形象记忆",
        "例句"
      ],
      "rows": [
        [
          "<span class=\"big\">in</span>",
          "在…里面",
          "🐱 躲进箱子",
          "The cat is <strong>in</strong> the box."
        ],
        [
          "<span class=\"big\">on</span>",
          "在…上面（接触）",
          "🐱 坐在箱子上",
          "The cat is <strong>on</strong> the box."
        ],
        [
          "<span class=\"big\">under</span>",
          "在…下面",
          "🐱 藏在箱子下",
          "The cat is <strong>under</strong> the box."
        ],
        [
          "<span class=\"big\">behind</span>",
          "在…后面",
          "🐱 躲在箱子后",
          "The cat is <strong>behind</strong> the box."
        ],
        [
          "<span class=\"big\">next to</span>",
          "在…旁边",
          "🐱 靠着箱子坐",
          "The cat is <strong>next to</strong> the box."
        ],
        [
          "<span class=\"big\">in front of</span>",
          "在…前面",
          "🐱 站在箱子前",
          "The cat is <strong>in front of</strong> the box."
        ]
      ]
    },
    "tips": [
      "in 在里面，on 在上面，under 在下面",
      "behind 是后面，in front of 是前面",
      "next to 紧挨着，就在旁边",
      "介词后面跟名词：on the desk, under the chair"
    ],
    "examples": [
      {
        "en": "The ball is under the chair.",
        "cn": "球在椅子下面。"
      },
      {
        "en": "My book is on the desk.",
        "cn": "我的书在桌子上。"
      },
      {
        "en": "The park is behind the school.",
        "cn": "公园在学校后面。"
      }
    ]
  },
  {
    "id": "can",
    "emoji": "🌟",
    "title": "情态动词 can",
    "diff": "⭐⭐",
    "intro": "<strong>can 的本领很大！</strong>它可以表示<strong>会做</strong>某事（能力），也可以表示<strong>可以</strong>做某事（许可）。can 后面永远跟<strong>动词原形</strong>，不管主语是谁，can 都不变形！",
    "table": {
      "caption": "can 的句型变化",
      "headers": [
        "句型",
        "构成",
        "例句"
      ],
      "rows": [
        [
          "肯定句",
          "主语 + can + 动词原形",
          "I <strong>can</strong> swim. 我会游泳。<br>She <strong>can</strong> dance. 她会跳舞。"
        ],
        [
          "否定句",
          "can 后加 not（can't）",
          "I <strong>can't</strong> fly. 我不会飞。<br>He <strong>can't</strong> come today. 他今天不能来。"
        ],
        [
          "一般疑问句",
          "Can 提到句首",
          "<strong>Can</strong> you play the piano? 你会弹钢琴吗？<br>— Yes, I can. / No, I can't."
        ],
        [
          "特殊疑问句",
          "疑问词 + can…",
          "<strong>What</strong> can you do? 你会做什么？"
        ]
      ]
    },
    "tips": [
      "can 后面永远用动词原形：She can swims ✗ → She can swim ✓",
      "can 没有三单变化：He can… 不是 He cans…",
      "can't 是 cannot 的缩写",
      "问\"会不会\"用 Can you…? 回答 Yes, I can. / No, I can't."
    ],
    "examples": [
      {
        "en": "Birds can fly, but fish can't.",
        "cn": "鸟会飞，但鱼不会。"
      },
      {
        "en": "Can you help me, please?",
        "cn": "你能帮帮我吗？"
      },
      {
        "en": "I can speak a little English.",
        "cn": "我会说一点英语。"
      }
    ]
  },
  {
    "id": "ing",
    "emoji": "🏃",
    "title": "现在进行时（be + V-ing）",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是现在进行时？</strong><br>表示<strong>现在正在进行</strong>或<strong>正在发生</strong>的动作。结构是：<strong>be 动词 + 动词-ing</strong>。比如\"我正在吃饭\"I am eating。看到 Look!（看！）或 Listen!（听！）时，常用现在进行时哦！",
    "table": {
      "caption": "现在进行时构成表",
      "headers": [
        "主语",
        "be 动词",
        "例句",
        "意思"
      ],
      "rows": [
        [
          "I",
          "am",
          "I <strong>am reading</strong>.",
          "我正在读书。"
        ],
        [
          "He / She / It",
          "is",
          "She <strong>is cooking</strong>.",
          "她正在做饭。"
        ],
        [
          "You / We / They",
          "are",
          "They <strong>are playing</strong>.",
          "他们正在玩。"
        ]
      ]
    },
    "tips": [
      "口诀：进行时，很容易，be 加动词-ing",
      "Look! / Listen! 出现，八成用进行时",
      "否定在 be 后加 not：He is not sleeping.",
      "疑问把 be 提前：Are you listening?"
    ],
    "examples": [
      {
        "en": "Look! The children are playing football.",
        "cn": "看！孩子们正在踢足球。"
      },
      {
        "en": "Listen! Someone is singing.",
        "cn": "听！有人在唱歌。"
      },
      {
        "en": "I am doing my homework now.",
        "cn": "我正在做作业。"
      }
    ]
  },
  {
    "id": "w5h2",
    "emoji": "❓",
    "title": "5W2H 疑问词",
    "diff": "⭐⭐",
    "intro": "<strong>什么是 5W2H？</strong><br>5W2H 是英语中最常用的疑问词，用来提问。<strong>5W</strong> = What / Who / Where / When / Why，<strong>2H</strong> = How / How many (much)。记住它们，提问就不愁啦！",
    "table": {
      "caption": "5W2H 疑问词用法表",
      "headers": [
        "疑问词",
        "意思",
        "用来问什么",
        "例句"
      ],
      "rows": [
        [
          "<strong>What</strong>",
          "什么",
          "问事物、名字、职业",
          "<strong>What</strong> is this? — It's a cat."
        ],
        [
          "<strong>Who</strong>",
          "谁",
          "问人",
          "<strong>Who</strong> is she? — She's my mother."
        ],
        [
          "<strong>Where</strong>",
          "哪里",
          "问地点、位置",
          "<strong>Where</strong> is my book? — On the desk."
        ],
        [
          "<strong>When</strong>",
          "什么时候",
          "问时间",
          "<strong>When</strong> do you get up? — At 6:30."
        ],
        [
          "<strong>Why</strong>",
          "为什么",
          "问原因（because 回答）",
          "<strong>Why</strong> are you late? — Because…"
        ],
        [
          "<strong>How</strong>",
          "怎样",
          "问方式、身体状况",
          "<strong>How</strong> are you? — I'm fine."
        ],
        [
          "<strong>How many</strong>",
          "多少",
          "问数量（可数）",
          "<strong>How many</strong> apples? — Five."
        ],
        [
          "<strong>How much</strong>",
          "多少",
          "问价格（不可数）",
          "<strong>How much</strong> is it? — 5 yuan."
        ]
      ]
    },
    "tips": [
      "问什么用 What，问是谁用 Who",
      "问哪里用 Where，问何时用 When",
      "问原因用 Why，回答要用 Because",
      "可数名词用 many，不可数名词用 much"
    ],
    "examples": [
      {
        "en": "What is your favorite subject?",
        "cn": "你最喜欢的学科是什么？"
      },
      {
        "en": "Where do you live?",
        "cn": "你住在哪里？"
      },
      {
        "en": "How many books do you have?",
        "cn": "你有多少本书？"
      }
    ]
  },
  {
    "id": "therebe",
    "emoji": "📍",
    "title": "There be 句型（某地有某物）",
    "diff": "⭐⭐",
    "intro": "<strong>什么是 There be 句型？</strong><br>There be 句型表示<strong>\"某地有某物\"</strong>，强调\"存在\"。There is + 单数/不可数名词，There are + 复数名词。它和 have 不一样哦：have 表示\"某人拥有\"，there be 表示\"某地存在\"。",
    "table": {
      "caption": "There be 句型用法表",
      "headers": [
        "形式",
        "用法",
        "例句"
      ],
      "rows": [
        [
          "<span class=\"big\">There is</span>",
          "后面跟<strong>单数</strong>或<strong>不可数</strong>名词",
          "There <strong>is</strong> a book on the desk.<br>There <strong>is</strong> some water in the cup."
        ],
        [
          "<span class=\"big\">There are</span>",
          "后面跟<strong>复数</strong>名词",
          "There <strong>are</strong> five apples on the tree.<br>There <strong>are</strong> many students in the classroom."
        ],
        [
          "就近原则",
          "be 动词和最近的名词一致",
          "There <strong>is</strong> a pen and two books on the desk.<br>There <strong>are</strong> two books and a pen on the desk."
        ]
      ]
    },
    "tips": [
      "有一个用 is，有很多用 are",
      "就近原则：be 动词看离它最近的名词",
      "否定句：be 后加 not（isn't / aren't）",
      "疑问句：把 be 提到 there 前面"
    ],
    "examples": [
      {
        "en": "There is a park near my home.",
        "cn": "我家附近有一个公园。"
      },
      {
        "en": "There are many birds in the tree.",
        "cn": "树上有很多鸟。"
      },
      {
        "en": "Is there any milk in the fridge?",
        "cn": "冰箱里有牛奶吗？"
      }
    ]
  },
  {
    "id": "third",
    "emoji": "⚡",
    "title": "一般现在时与三单变化",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是一般现在时？</strong><br>表示<strong>经常发生</strong>的动作或<strong>习惯</strong>，常和 always, usually, often, sometimes, every day 连用。当主语是<strong>第三人称单数</strong>（he / she / it 或单个人名）时，动词要加 s 或 es，这叫\"三单变化\"！",
    "table": {
      "caption": "三单动词变化规则表",
      "headers": [
        "规则",
        "变化方法",
        "例词"
      ],
      "rows": [
        [
          "一般情况",
          "直接加 <strong>-s</strong>",
          "play → play<strong>s</strong> / like → like<strong>s</strong>"
        ],
        [
          "以 s, x, ch, sh, o 结尾",
          "加 <strong>-es</strong>",
          "watch → watch<strong>es</strong> / go → go<strong>es</strong> / do → do<strong>es</strong>"
        ],
        [
          "\"辅音字母+y\"结尾",
          "变 y 为 i 加 <strong>-es</strong>",
          "study → stud<strong>ies</strong> / fly → fl<strong>ies</strong>"
        ],
        [
          "特殊变化",
          "单独记",
          "have → <strong>has</strong>"
        ]
      ]
    },
    "tips": [
      "三单口诀：三单动词加 s，s x ch sh o 加 es",
      "have 很特殊，三单变 has",
      "否定句用 doesn't + 动词原形：He doesn't like…",
      "疑问句用 Does + 主语 + 动词原形：Does she play…?"
    ],
    "examples": [
      {
        "en": "He goes to school at seven every day.",
        "cn": "他每天七点上学。"
      },
      {
        "en": "She likes music very much.",
        "cn": "她非常喜欢音乐。"
      },
      {
        "en": "My mother watches TV in the evening.",
        "cn": "我妈妈晚上看电视。"
      },
      {
        "en": "Does he have breakfast at home?",
        "cn": "他在家吃早餐吗？"
      }
    ]
  },
  {
    "id": "someany",
    "emoji": "🧺",
    "title": "some / any 的用法",
    "diff": "⭐⭐",
    "intro": "<strong>some 和 any 都表示\"一些\"</strong>。它们的区别在于：<strong>some 用于肯定句</strong>，<strong>any 用于否定句和疑问句</strong>。既可以修饰可数名词复数，也可以修饰不可数名词。",
    "table": {
      "caption": "some / any 用法对照表",
      "headers": [
        "词",
        "用在什么句子",
        "例句"
      ],
      "rows": [
        [
          "<span class=\"big\">some</span>",
          "肯定句",
          "There is <strong>some</strong> water in the cup.<br>I have <strong>some</strong> apples."
        ],
        [
          "<span class=\"big\">any</span>",
          "否定句",
          "There isn't <strong>any</strong> milk in the fridge.<br>I don't have <strong>any</strong> money."
        ],
        [
          "<span class=\"big\">any</span>",
          "疑问句",
          "Do you have <strong>any</strong> brothers?<br>Would you like <strong>some</strong> tea?（期待肯定回答时用 some）"
        ]
      ]
    },
    "tips": [
      "肯定句用 some，否定疑问用 any",
      "表示请求建议的问句用 some：Would you like some…?",
      "some 和 any 都能修饰可数复数和不可数名词",
      "any 还能表示\"任何一个\"：Any student can do it."
    ],
    "examples": [
      {
        "en": "I have some good friends.",
        "cn": "我有一些好朋友。"
      },
      {
        "en": "There isn't any juice in the bottle.",
        "cn": "瓶子里没有果汁了。"
      },
      {
        "en": "Are there any books on the desk?",
        "cn": "桌子上有一些书吗？"
      }
    ]
  },
  {
    "id": "past",
    "emoji": "⏪",
    "title": "一般过去时",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是一般过去时？</strong><br>表示<strong>过去发生</strong>的动作或状态，常和 yesterday, last week, last night, two days ago 等时间词连用。动词要变成<strong>过去式</strong>：规则动词加 -ed，不规则动词要单独记（如 go → went）。",
    "table": {
      "caption": "动词过去式变化规则表",
      "headers": [
        "规则",
        "变化方法",
        "例词"
      ],
      "rows": [
        [
          "一般情况",
          "直接加 <strong>-ed</strong>",
          "play → play<strong>ed</strong> / watch → watch<strong>ed</strong>"
        ],
        [
          "以 e 结尾",
          "只加 <strong>-d</strong>",
          "like → like<strong>d</strong> / live → live<strong>d</strong>"
        ],
        [
          "\"辅音字母+y\"结尾",
          "变 y 为 i 加 <strong>-ed</strong>",
          "study → stud<strong>ied</strong>"
        ],
        [
          "不规则变化",
          "单独记",
          "go → <strong>went</strong> / eat → <strong>ate</strong> / see → <strong>saw</strong> / have → <strong>had</strong>"
        ],
        [
          "be 动词",
          "is/am → <strong>was</strong>，are → <strong>were</strong>",
          "I <strong>was</strong> at home. / They <strong>were</strong> happy."
        ]
      ]
    },
    "tips": [
      "看到 yesterday / last… / …ago，动词变过去式",
      "否定句：didn't + 动词原形（didn't went ✗ → didn't go ✓）",
      "疑问句：Did + 主语 + 动词原形",
      "was / were 的否定：wasn't / weren't"
    ],
    "examples": [
      {
        "en": "I went to the park yesterday.",
        "cn": "我昨天去了公园。"
      },
      {
        "en": "She watched a film last night.",
        "cn": "她昨晚看了一部电影。"
      },
      {
        "en": "We were very happy at the party.",
        "cn": "我们在聚会上很开心。"
      },
      {
        "en": "Did you do your homework?",
        "cn": "你做作业了吗？"
      }
    ]
  },
  {
    "id": "freq",
    "emoji": "📊",
    "title": "频度副词",
    "diff": "⭐⭐",
    "intro": "<strong>什么是频度副词？</strong><br>频度副词表示动作发生的<strong>频率</strong>（多久一次）。频率从高到低：always → usually → often → sometimes → never。它们通常放在<strong>实义动词前面</strong>、<strong>be 动词后面</strong>。",
    "table": {
      "caption": "频度副词频率表",
      "headers": [
        "频度副词",
        "意思",
        "频率",
        "例句"
      ],
      "rows": [
        [
          "<strong>always</strong>",
          "总是",
          "100%",
          "I <strong>always</strong> get up at six."
        ],
        [
          "<strong>usually</strong>",
          "通常",
          "80%",
          "He <strong>usually</strong> goes to school by bus."
        ],
        [
          "<strong>often</strong>",
          "经常",
          "60%",
          "We <strong>often</strong> play football."
        ],
        [
          "<strong>sometimes</strong>",
          "有时",
          "30%",
          "She <strong>sometimes</strong> reads at night."
        ],
        [
          "<strong>never</strong>",
          "从不",
          "0%",
          "I <strong>never</strong> eat fast food."
        ]
      ]
    },
    "tips": [
      "频率排队：always > usually > often > sometimes > never",
      "放在实义动词前：I often swim.（不是 I swim often.）",
      "放在 be 动词后：He is always happy.",
      "提问频率用 How often…? 多久一次"
    ],
    "examples": [
      {
        "en": "I always brush my teeth before bed.",
        "cn": "我总是睡前刷牙。"
      },
      {
        "en": "She is never late for school.",
        "cn": "她上学从不迟到。"
      },
      {
        "en": "How often do you exercise?",
        "cn": "你多久锻炼一次？"
      }
    ]
  },
  {
    "id": "future",
    "emoji": "🚀",
    "title": "一般将来时（will / be going to）",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是一般将来时？</strong><br>表示<strong>将来要发生</strong>的动作或打算。有两种常用结构：<strong>will + 动词原形</strong>（临时决定、预测）和<strong>be going to + 动词原形</strong>（计划、打算）。常和 tomorrow, next week, soon 连用。",
    "table": {
      "caption": "一般将来时构成表",
      "headers": [
        "句型",
        "构成",
        "例句"
      ],
      "rows": [
        [
          "will 结构",
          "主语 + will + 动词原形",
          "I <strong>will</strong> visit Beijing next week.<br>It <strong>will</strong> rain tomorrow."
        ],
        [
          "be going to 结构",
          "主语 + am/is/are + going to + 动词原形",
          "We <strong>are going to</strong> have a picnic.<br>She <strong>is going to</strong> buy a book."
        ],
        [
          "否定句",
          "will not = won't / be not going to",
          "I <strong>won't</strong> be late.<br>He <strong>isn't going to</strong> swim."
        ],
        [
          "疑问句",
          "Will 提前 / Be 提前",
          "<strong>Will</strong> you help me?<br><strong>Are</strong> you <strong>going to</strong> play?"
        ]
      ]
    },
    "tips": [
      "will 后面永远接动词原形，没有人称变化",
      "事先打算用 be going to，临时决定用 will",
      "won't 是 will not 的缩写",
      "tomorrow / next… / soon 出现，想到将来时"
    ],
    "examples": [
      {
        "en": "I will call you tomorrow.",
        "cn": "我明天给你打电话。"
      },
      {
        "en": "We are going to visit the museum.",
        "cn": "我们打算去参观博物馆。"
      },
      {
        "en": "It will be sunny this weekend.",
        "cn": "这周末会是晴天。"
      }
    ]
  },
  {
    "id": "compare",
    "emoji": "📏",
    "title": "比较级与最高级",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是比较级和最高级？</strong><br>比较两个人或东西时用<strong>比较级</strong>（更…，后面接 than），比较三个及以上用<strong>最高级</strong>（最…，前面常加 the）。大多数单音节词加 -er / -est，多音节词用 more / most。",
    "table": {
      "caption": "形容词比较级/最高级变化表",
      "headers": [
        "规则",
        "比较级",
        "最高级",
        "例词"
      ],
      "rows": [
        [
          "单音节一般加 -er/-est",
          "<strong>-er</strong>",
          "<strong>-est</strong>",
          "tall → tall<strong>er</strong> → tall<strong>est</strong>"
        ],
        [
          "以 e 结尾加 -r/-st",
          "<strong>-r</strong>",
          "<strong>-st</strong>",
          "nice → nice<strong>r</strong> → nice<strong>st</strong>"
        ],
        [
          "重读闭音节双写尾字母",
          "<strong>-er</strong>",
          "<strong>-est</strong>",
          "big → bi<strong>gger</strong> → bi<strong>ggest</strong>"
        ],
        [
          "多音节用 more/most",
          "more…",
          "most…",
          "beautiful → <strong>more</strong> beautiful → <strong>most</strong> beautiful"
        ],
        [
          "不规则变化",
          "单独记",
          "单独记",
          "good → <strong>better</strong> → <strong>best</strong> / bad → <strong>worse</strong> → <strong>worst</strong>"
        ]
      ]
    },
    "tips": [
      "比较级 + than：Tom is taller than Mike.",
      "最高级 + the + 范围：He is the tallest in our class.",
      "good-better-best 和 bad-worse-worst 最常考",
      "much/even 可以修饰比较级：much better 好得多"
    ],
    "examples": [
      {
        "en": "An elephant is bigger than a horse.",
        "cn": "大象比马大。"
      },
      {
        "en": "This is the most interesting book.",
        "cn": "这是最有趣的书。"
      },
      {
        "en": "My English is getting better and better.",
        "cn": "我的英语越来越好了。"
      }
    ]
  },
  {
    "id": "modal",
    "emoji": "🔔",
    "title": "情态动词 should / must / may",
    "diff": "⭐⭐⭐",
    "intro": "<strong>情态动词三兄弟</strong>：<strong>should</strong> 表示\"应该\"（建议），<strong>must</strong> 表示\"必须\"（强制，语气最强），<strong>may</strong> 表示\"可以\"（许可）或\"可能\"。它们和 can 一样，后面都接<strong>动词原形</strong>，没有人称变化！",
    "table": {
      "caption": "情态动词用法表",
      "headers": [
        "情态动词",
        "意思",
        "语气",
        "例句"
      ],
      "rows": [
        [
          "<span class=\"big\">should</span>",
          "应该（建议）",
          "💡 温和",
          "You <strong>should</strong> drink more water."
        ],
        [
          "<span class=\"big\">must</span>",
          "必须（强制）",
          "❗ 强硬",
          "You <strong>must</strong> finish your homework."
        ],
        [
          "<span class=\"big\">may</span>",
          "可以（许可）/ 可能",
          "🤔 委婉",
          "<strong>May</strong> I come in? / It <strong>may</strong> rain."
        ],
        [
          "mustn't",
          "禁止（一定不要）",
          "🚫 禁止",
          "You <strong>mustn't</strong> swim here. 此处禁止游泳。"
        ]
      ]
    },
    "tips": [
      "情态动词后接动词原形，没有人称变化",
      "shouldn't = should not 建议不要",
      "mustn't 表示\"禁止\"，语气很强",
      "May I…? 是很有礼貌的请求"
    ],
    "examples": [
      {
        "en": "You should go to bed early.",
        "cn": "你应该早点睡觉。"
      },
      {
        "en": "We must obey the traffic rules.",
        "cn": "我们必须遵守交通规则。"
      },
      {
        "en": "May I ask you a question?",
        "cn": "我可以问你一个问题吗？"
      }
    ]
  },
  {
    "id": "ordinal",
    "emoji": "#️⃣",
    "title": "序数词",
    "diff": "⭐⭐",
    "intro": "<strong>什么是序数词？</strong><br>表示<strong>第几</strong>的数词叫序数词（第一、第二…），常用来表示日期、名次、楼层。大多数序数词由基数词加 -th 构成，前面通常加 <strong>the</strong>。",
    "table": {
      "caption": "序数词变化规则表",
      "headers": [
        "规则",
        "例词"
      ],
      "rows": [
        [
          "一般加 <strong>-th</strong>",
          "four → four<strong>th</strong> / six → six<strong>th</strong> / seven → seven<strong>th</strong>"
        ],
        [
          "特殊：one, two, three",
          "one → <strong>first</strong> (1st) / two → <strong>second</strong> (2nd) / three → <strong>third</strong> (3rd)"
        ],
        [
          "特殊：five, eight, nine, twelve",
          "five → <strong>fifth</strong> / eight → <strong>eighth</strong> / nine → <strong>ninth</strong> / twelve → <strong>twelfth</strong>"
        ],
        [
          "整十变 y 为 ie 加 -th",
          "twenty → twenti<strong>eth</strong> / thirty → thirti<strong>eth</strong>"
        ],
        [
          "\"几十几\"只变个位",
          "twenty-one → twenty-<strong>first</strong>"
        ]
      ]
    },
    "tips": [
      "口诀：基变序，有规律，词尾加上 th",
      "一二三特殊记：first, second, third",
      "八减 t，九去 e，f 来把 ve 替（fifth, twelfth）",
      "序数词前常加 the：the first lesson"
    ],
    "examples": [
      {
        "en": "March is the third month of the year.",
        "cn": "三月是一年的第三个月。"
      },
      {
        "en": "My birthday is on June the first.",
        "cn": "我的生日是六月一日。"
      },
      {
        "en": "Our classroom is on the second floor.",
        "cn": "我们的教室在二楼。"
      }
    ]
  },
  {
    "id": "exclaim",
    "emoji": "❗",
    "title": "感叹句 What / How",
    "diff": "⭐⭐⭐",
    "intro": "<strong>什么是感叹句？</strong><br>表示<strong>强烈感情</strong>（惊讶、赞美等）的句子。有两种结构：<strong>What + (a/an) + 名词</strong>（感叹东西）和 <strong>How + 形容词/副词</strong>（感叹程度）。",
    "table": {
      "caption": "感叹句结构表",
      "headers": [
        "结构",
        "用于",
        "例句"
      ],
      "rows": [
        [
          "What + a/an + 形容词 + 单数名词",
          "感叹单数东西",
          "<strong>What a</strong> beautiful day! 多好的一天啊！"
        ],
        [
          "What + 形容词 + 复数名词",
          "感叹复数东西",
          "<strong>What</strong> lovely flowers! 多美的花啊！"
        ],
        [
          "What + 形容词 + 不可数名词",
          "感叹不可数东西",
          "<strong>What</strong> fine weather! 多好的天气！"
        ],
        [
          "How + 形容词",
          "感叹程度",
          "<strong>How</strong> tall he is! 他真高啊！"
        ],
        [
          "How + 副词",
          "感叹方式",
          "<strong>How</strong> fast she runs! 她跑得真快！"
        ]
      ]
    },
    "tips": [
      "感叹名词用 What，感叹形容词/副词用 How",
      "What 后面有名词，How 后面没有名词",
      "单数可数名词前要 a/an：What a nice girl!",
      "weather 是不可数名词：What fine weather!（不加 a）"
    ],
    "examples": [
      {
        "en": "What a clever boy!",
        "cn": "多么聪明的男孩啊！"
      },
      {
        "en": "How beautiful the flowers are!",
        "cn": "这些花多美啊！"
      },
      {
        "en": "What delicious food!",
        "cn": "多么好吃的食物！"
      }
    ]
  }
];
