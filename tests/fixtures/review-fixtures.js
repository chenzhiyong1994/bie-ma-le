// Test-only review fixtures. These are deliberately kept out of the production mini-program bundle.
const roles = [
  {
    id: 'resume-terminator',
    number: '001',
    symbol: '简',
    name: '简历暴君',
    englishName: 'THE RESUME TYRANT',
    category: '求职职场',
    title: '前大厂人才评审负责人',
    years: '看过 12,000+ 份简历',
    declaration: '负责、参与、协助，写满一页也凑不出一条成绩。别告诉我你上过班，告诉我你到底干成了什么。',
    scope: ['求职定位', '成果量化', '可信证据', '表达效率'],
    requirements: ['选择整体评审或按目标 JD 评审', '至少一段完整工作经历', '上传 PDF / DOCX，或粘贴文本'],
    dimensions: [
      { index: '01', name: '内容取舍 / JD 匹配', description: '没有目标时审整体结构，有 JD 时审匹配证据' },
      { index: '02', name: '成果证据', description: '有没有数字、结果和清晰的个人贡献边界' },
      { index: '03', name: '可信表达', description: '每一句判断是否经得起招聘官追问' },
      { index: '04', name: '阅读效率', description: '8 秒内能否抓住值得继续看的信息' }
    ],
    review: {
      titleLines: ['把简历拿来。', '我看看你干成了什么。'],
      subtitle: '没投具体岗位，就看这份简历能不能让人记住你；有 JD，就看你是真匹配，还是硬往自己脸上贴。',
      materialLabel: '把简历交出来',
      materialPlaceholder: '粘贴完整简历正文，至少包含一段工作或项目经历。',
      contextLabel: '完整职位描述（JD）',
      contextPlaceholder: '粘贴完整职位描述，包括职责、要求和加分项。',
      generalLabel: '没有投递目标',
      generalNote: '审整体撰写质量',
      targetedLabel: '有目标 JD',
      targetedNote: '审岗位匹配证据',
      sampleAction: '塞一份烂简历试试'
    }
  },
  {
    id: 'report-debt-collector',
    number: '002',
    symbol: '汇',
    name: '汇报暴君',
    englishName: 'THE REPORT TYRANT',
    category: '求职职场',
    title: '管理层汇报成果审计官',
    years: '听过 3,000+ 场无效汇报',
    declaration: '开会、沟通、推进，忙活半天然后呢？领导批资源看的是结果，不是你的群聊活跃度。',
    scope: ['结论前置', '成果证据', '决策请求', '表达效率'],
    requirements: ['汇报稿、周报或述职材料', '可选汇报对象与期望决定', '上传 PDF / DOCX，或粘贴文本'],
    dimensions: [
      { index: '01', name: '结论前置', description: '听众能否先听懂发生了什么' },
      { index: '02', name: '成果证据', description: '工作过程有没有兑换成结果和数字' },
      { index: '03', name: '决策请求', description: '是否说清需要谁在何时做什么决定' },
      { index: '04', name: '表达效率', description: '是否用最少的废话完成信息传递' }
    ],
    review: {
      titleLines: ['把汇报拿来。', '我倒要看看你忙出了什么。'],
      subtitle: '过程写得再热闹也不算成绩。结论、数字、要什么决定，说不清就等于白汇报。',
      materialLabel: '把汇报交出来',
      materialPlaceholder: '粘贴汇报稿、周报、复盘或述职材料。',
      contextLabel: '汇报对象与期望决定',
      contextPlaceholder: '例如：向业务负责人汇报，希望获得下个季度的增长预算。',
      generalLabel: '直接审汇报', generalNote: '审结构与结果',
      targetedLabel: '带决策目标', targetedNote: '审能否推动决策',
      sampleAction: '塞一份流水账试试'
    }
  },
  {
    id: 'copy-judge',
    number: '003',
    symbol: '案',
    name: '文案暴君',
    englishName: 'THE COPY TYRANT',
    category: '内容创作',
    title: '前一线品牌创意总监',
    years: '退过 8,000+ 条自嗨文案',
    declaration: '全新升级、匠心打造、震撼来袭，全齐了。广告位这么贵，你就拿来堆这三句破词？',
    scope: ['受众命中', '价值钩子', '可信证据', '行动驱动'],
    requirements: ['广告、社媒、标题或活动文案', '可选目标受众与期望行动', '粘贴文本或上传文档'],
    dimensions: [
      { index: '01', name: '受众命中', description: '文案是否在对一群具体的人说话' },
      { index: '02', name: '价值钩子', description: '开头和卖点是否值得读者继续看' },
      { index: '03', name: '可信证据', description: '形容词背后是否有事实、数字或机制' },
      { index: '04', name: '行动驱动', description: '读完后是否知道为什么现在就要行动' }
    ],
    review: {
      titleLines: ['把文案拿来。', '看读者凭什么不划走。'],
      subtitle: '卖点说不清、证据拿不出、行动推不动，还想靠几个形容词骗点击？',
      materialLabel: '把文案交出来',
      materialPlaceholder: '粘贴广告、社媒、标题、落地页或活动文案。',
      contextLabel: '目标受众与期望行动',
      contextPlaceholder: '例如：面向刚开始带团队的管理者，希望其预约试用。',
      generalLabel: '直接审文案', generalNote: '审卖点与表达',
      targetedLabel: '带转化目标', targetedNote: '审受众与行动',
      sampleAction: '塞一份自嗨文案试试'
    }
  },
  {
    id: 'product-tyrant',
    number: '004',
    symbol: '产',
    name: '产品暴君',
    englishName: 'THE PRODUCT TYRANT',
    category: '产品创业',
    title: '连续拆掉三轮伪需求的产品负责人',
    years: '打回过 2,000+ 个无效功能',
    declaration: '八个功能全想做，一个问题都没证实。你这不是 PRD，是愿望清单，还许得挺全面。',
    scope: ['问题证据', '方案匹配', '优先级取舍', '验收边界'],
    requirements: ['产品想法、需求文档或 PRD', '可选目标用户、产品阶段和验证目标', '上传 PDF / DOCX，或粘贴文本'],
    dimensions: [
      { index: '01', name: '问题真实性', description: '是否有证据证明用户真的遇到了问题' },
      { index: '02', name: '方案匹配', description: '功能是否直接作用于核心问题' },
      { index: '03', name: '优先级取舍', description: '是否说清为什么先做这个而不是别的' },
      { index: '04', name: '验收与边界', description: '是否有可验证指标、异常情况和停止条件' }
    ],
    review: {
      titleLines: ['把方案拿来。', '先证明这东西不是自嗨。'],
      subtitle: '别急着爱上自己的功能。问题、证据、取舍、验收，一个说不清就别谈立项。',
      materialLabel: '把产品方案交出来',
      materialPlaceholder: '粘贴产品想法、需求文档、PRD 或功能方案。',
      contextLabel: '目标用户、产品阶段与验证目标',
      contextPlaceholder: '例如：面向 20-100 人团队的早期验证，想确认用户是否愿意持续使用。',
      generalLabel: '直接审方案', generalNote: '审问题与取舍',
      targetedLabel: '带验证目标', targetedNote: '审能否验证假设',
      sampleAction: '塞一份许愿单试试'
    }
  }
];

const sampleInputs = {
  'resume-terminator': {
    materialText: `张然｜3 年互联网产品经验

工作经历
某科技公司｜产品经理｜2022.07 - 至今
· 负责用户增长相关工作，参与活动策划与落地
· 优化投放策略，提升转化效果
· 与研发、设计和运营团队保持良好沟通，推动项目按时上线

项目经历
会员增长项目
· 负责需求调研、原型设计和项目推进
· 上线后获得用户好评，为业务增长提供支持

技能
熟练掌握 Excel、PPT，具备良好沟通能力和团队协作精神`,
    contextText: ''
  },
  'report-debt-collector': {
    materialText: `本周工作汇报

本周主要负责用户增长项目，召开了多次会议，与产品、运营、技术和设计进行了充分沟通。
我们持续推进活动页优化，做了很多调整，整体取得了不错的效果。
同时积极协调各方资源，解决了一些问题，为后续工作奠定了良好基础。
下周将继续跟进项目，推动各项任务顺利完成。`,
    contextText: ''
  },
  'copy-judge': {
    materialText: `全新升级，震撼来袭！

我们致力于为用户提供高品质、高价值、专业且贴心的服务。凭借创新理念和匠心精神，我们带来前所未有的卓越体验。

无论你是谁，无论你有什么需求，都能在这里获得惊喜。
现在就来体验吧！`,
    contextText: ''
  },
  'product-tyrant': {
    materialText: `项目名称：智能任务管理平台

项目背景
随着人们工作节奏加快，任务管理越来越重要。市场空间巨大，用户需要更智能的产品。

方案
我们将开发一个全功能任务平台，包含任务、日历、聊天、文件、AI 助手、积分、社区和商城。
第一版计划在三个月内完成所有功能，上线后通过用户反馈持续优化。

预期成果
打造行业领先的一站式效率平台，让每个人的工作效率显著提升。`,
    contextText: ''
  }
};

const criticalReports = {
  'resume-terminator': {
    qualityBand: 'critical',
    verdict: '这也叫简历？满页都在证明你上过班，没一行证明你干成过事。',
    verdictNote: '“负责、参与、协作”写得挺热闹，成绩一个没有。这堆垃圾话再铺满两页，也还是零结果。',
    overallScore: 42,
    scores: [
      { dimension: '信息结构', score: 45, note: '经历不少，重点却被废话埋了' },
      { dimension: '成果量化', score: 28, note: '满篇“提升”，没有一个能核验的数字' },
      { dimension: '可信证据', score: 58, note: '事情像真的，功劳却写得像冒领的' },
      { dimension: '表达效率', score: 63, note: '字不算多，能救命的信息更少' }
    ],
    strengths: [],
    issues: [
      {
        severity: 'P0', evidenceKind: 'quote', title: '把岗位职责冒充个人成果',
        evidenceSamples: ['负责用户增长相关工作，参与活动策划与落地', '负责需求调研、原型设计和项目推进'],
        diagnosis: '你管这叫经历？这两句只是岗位说明，换个人坐这个工位也能原样复制。',
        impact: '招聘官看不见你的贡献，只会得出一个结论：你来上过班，但没留下什么成绩。',
        suggestion: '按“业务问题—你的关键动作—可量化结果—个人边界”重写，每条只保留一个主结果。可以直接套这个骨架：“针对 X 问题，我主导/独立完成 Y 动作，在 Z 周内把 A 指标从 B 做到 C”。暂时没有结果数字，就诚实补项目范围、交付物和可验证变化，别现场编数据。',
        acceptance: '每条经历同时回答四件事：解决什么问题、你亲自做了什么、结果如何、功劳边界在哪里；招聘官不用追加提问，就能复述你的独立贡献和结果量级。'
      },
      {
        severity: 'P0', evidenceKind: 'quote', title: '用模糊好词掩盖零数字',
        evidenceSamples: ['优化投放策略，提升转化效果', '上线后获得用户好评，为业务增长提供支持'],
        diagnosis: '“提升了”“效果不错”——提升多少？从 1 到 1.01 也叫提升。你是觉得招聘官不会追问？',
        impact: '最该拿数字说话的地方突然含糊，对方只会默认：没结果，所以不敢写。',
        suggestion: '先回到项目看板或复盘材料，依次补齐指标名称、变化前基线、变化后结果、统计周期和覆盖范围。数字涉密时用百分比、区间或排名替代绝对值，并写清统计口径；确实没有数据，就换成交付效率、用户规模或业务采纳情况，别继续写“效果不错”。',
        acceptance: '每个结果句至少包含“指标 + 前后变化 + 时间周期”三项，其中一项还能说明覆盖范围或统计口径；读者一眼能判断变化幅度，而不是只能相信形容词。'
      },
      {
        severity: 'P1', evidenceKind: 'quote', title: '拿通用形容词占黄金位置',
        evidenceSamples: ['熟练掌握 Excel、PPT，具备良好沟通能力和团队协作精神'],
        diagnosis: '“沟通能力强、团队精神好”这种自评谁不会写？你夸得挺熟练，证据是一点没给。',
        impact: '黄金位置被套话占满，真正能让你和别人拉开差距的经历反而没地方写。',
        suggestion: '先删掉“沟通能力强、团队精神好”这类自评，再选一段真正发生过分歧或资源受限的项目，按“阻力是什么—你协调了谁—你做了什么取舍—最终推进到哪一步”写成一条经历。没有可验证事件支撑的能力词，一个都别留。',
        acceptance: '全文不再出现孤立的性格或能力形容词；每项保留能力都由一条具体事件支撑，并能看出协作对象、个人动作和最终结果。'
      }
    ]
  },
  'report-debt-collector': {
    qualityBand: 'critical',
    verdict: '你管这叫汇报？开会、沟通、推进写了一堆，结果去哪儿了？',
    verdictNote: '领导要结论、数字和需要拍板的事。你交上来一份垃圾流水账，是准备让听众替你总结？',
    overallScore: 29,
    scores: [
      { dimension: '结论前置', score: 32, note: '结论藏在哪里没人知道，听众只看到一堆过程' },
      { dimension: '成果证据', score: 24, note: '全篇动作无一兑换成可核验结果' },
      { dimension: '决策请求', score: 18, note: '没有向任何人请求任何决定' },
      { dimension: '表达效率', score: 40, note: '四段话的信息量压缩成一句还嫌多余' }
    ],
    strengths: [],
    issues: [
      {
        severity: 'P0', evidenceKind: 'quote', title: '用动作流水冒充工作结论',
        evidenceSamples: ['本周主要负责用户增长项目，召开了多次会议，与产品、运营、技术和设计进行了充分沟通。', '同时积极协调各方资源，解决了一些问题，为后续工作奠定了良好基础。'],
        diagnosis: '开了会、拉了人、做了沟通——然后呢？领导给你批资源，是看你的会议时长吗？',
        impact: '决策者无法判断项目进展正常还是已经失控，只能再花时间追问。',
        suggestion: '把第一段改成“结论—数字—原因—影响”的四句结构：先说本周结果好坏，再给核心指标及环比/目标差，随后解释一个主因，最后说明对目标或排期的影响。会议、沟通和协调过程只保留能解释结果的动作，其余全部挪到附录。',
        acceptance: '前四句话必须同时出现核心结论、至少一个带口径的数字、一个主因和一个业务影响；听众在前 10 秒内能复述结果，并判断项目正常、偏离还是需要介入。'
      },
      {
        severity: 'P0', evidenceKind: 'quote', title: '下一步没有决策请求，只有自我承诺',
        evidenceSamples: ['下周将继续跟进项目，推动各项任务顺利完成。', '我们持续推进活动页优化，做了很多调整，整体取得了不错的效果。'],
        diagnosis: '“继续跟进”“持续推进”，翻译一下就是：我还没想清楚下一步要谁做什么。',
        impact: '汇报听完等于没听，决策者没有行动项，下一步只能靠你自己猜。',
        suggestion: '在结尾新增“请决策”区，按“决策人—截止时间—待决定事项—可选方案—推荐方案—不决策的代价”写完整。不要只说“请支持”，直接写成：“请市场负责人于周三前确认 A/B 方案；建议选 A，因为能守住 X 指标，若延期将影响 Y 节点。”',
        acceptance: '结尾至少有一条明确请求，并完整写出谁决定、何时决定、决定什么、推荐哪项以及逾期影响；收件人不需要再问“所以你要我做什么”。'
      }
    ]
  },
  'copy-judge': {
    qualityBand: 'critical',
    verdict: '这也叫文案？受众没有，卖点没有，倒是把自己感动得够呛。',
    verdictNote: '对所有人说话，等于对空气喊话。读者看完连你卖什么都不知道，这坨自嗨垃圾还想要转化？',
    overallScore: 24,
    scores: [
      { dimension: '受众命中', score: 20, note: '“无论你是谁”说明你根本不知道在跟谁说话' },
      { dimension: '价值钩子', score: 25, note: '开头全是自嗨口号，没有一个具体利益点' },
      { dimension: '可信证据', score: 22, note: '“卓越体验”和“匠心精神”背后零事实、零数字' },
      { dimension: '行动驱动', score: 30, note: '“现在就来体验”没有给出任何立即行动的理由' }
    ],
    strengths: [],
    issues: [
      {
        severity: 'P0', evidenceKind: 'quote', title: '受众缺失，用万能句对空气喊话',
        evidenceSamples: ['无论你是谁，无论你有什么需求，都能在这里获得惊喜。', '我们致力于为用户提供高品质、高价值、专业且贴心的服务。'],
        diagnosis: '“无论你是谁”听着挺包容，实际上就是你根本不知道在跟谁说话。',
        impact: '读者在第一句就会判定“这不是说给我听的”，然后直接划走。',
        suggestion: '先锁定一个最值得转化的人群，再用“具体身份/场景 + 正在发生的麻烦 + 立即可得的收益”重写首句。可以套用：“每天被 X 困住的 Y 人，用 Z 在 N 分钟内完成 A。”不要同时讨好所有人，其他受众留给下一条文案。',
        acceptance: '首句必须出现可识别的人群或场景、一个具体痛点和一个明确收益；目标读者能在 3 秒内对号入座，非目标读者也能判断这条文案不是写给自己的。'
      },
      {
        severity: 'P0', evidenceKind: 'quote', title: '形容词替代了卖点证据',
        evidenceSamples: ['凭借创新理念和匠心精神，我们带来前所未有的卓越体验。', '全新升级，震撼来袭！'],
        diagnosis: '“创新、匠心、卓越、震撼”四个词全来了，证据一个没来。广告位这么贵，你就拿来堆这套狗屎配方？',
        impact: '读者的信任从第一句开始归零，后面的行动号召自然失效。',
        suggestion: '逐个圈出“创新、匠心、卓越、升级”这类词，每个词要么删除，要么替换成“具体功能/方法 + 与旧方案的差异 + 可验证结果”。例如别写“全新升级”，改成“新增 X 功能，把原本 Y 步缩短到 Z 步”；没有事实支撑的卖点直接删除。',
        acceptance: '每个价值主张后都紧跟至少一条功能、参数、对比或结果证据；全文不再保留无法验证的形容词，读者无需先相信品牌自夸就能判断价值。'
      }
    ]
  },
  'product-tyrant': {
    qualityBand: 'critical',
    verdict: '八个功能全想做，一个问题都没证实。你这不是 PRD，是愿望清单。',
    verdictNote: '问题零证据、方案零聚焦、优先级零取舍、验收零指标。这种垃圾方案拿去立项，是嫌团队还不够忙？',
    overallScore: 22,
    scores: [
      { dimension: '问题真实性', score: 22, note: '“市场空间巨大”不是问题证据，是自我催眠' },
      { dimension: '方案匹配', score: 26, note: '八个功能堆在一起，看不出哪个对准核心问题' },
      { dimension: '优先级取舍', score: 18, note: '“第一版完成所有功能”说明你主动放弃了取舍' },
      { dimension: '验收与边界', score: 20, note: '没有一个成功指标、失败条件或停止规则' }
    ],
    strengths: [],
    issues: [
      {
        severity: 'P0', evidenceKind: 'quote', title: '项目背景用趋势口号替代问题证据',
        evidenceSamples: ['随着人们工作节奏加快，任务管理越来越重要。市场空间巨大，用户需要更智能的产品。', '打造行业领先的一站式效率平台，让每个人的工作效率显著提升。'],
        diagnosis: '“市场空间巨大、用户需要更智能”——这种正确的废话写十页，也证明不了一个用户真的需要你。',
        impact: '没有问题证据，整个方案就失去存在理由：你回答不了为什么要做，而不是什么都不做。',
        suggestion: '先把宏大趋势全部移到附录，用访谈原话、行为日志、工单或业务数据补成“谁—在什么场景—发生什么阻碍—频率/损失多大—现有方案为何无效”的问题陈述。证据不足时明确标成待验证假设，并写出下一次访谈或数据查询要验证什么。',
        acceptance: '问题陈述必须包含目标用户、触发场景、具体阻碍、影响量级和现有替代方案缺陷五项；至少一项真实数据或用户行为能支撑它，并能区分已证实事实与待验证假设。'
      },
      {
        severity: 'P0', evidenceKind: 'quote', title: '方案堆功能不做取舍，也没有验收边界',
        evidenceSamples: ['我们将开发一个全功能任务平台，包含任务、日历、聊天、文件、AI 助手、积分、社区和商城。', '第一版计划在三个月内完成所有功能，上线后通过用户反馈持续优化。'],
        diagnosis: '八个模块三个月全上，你是做第一版，还是准备一口气重建互联网？“持续优化”更省事，反正失败了也没有标准。',
        impact: '资源一定会被摊薄，团队不知道哪个功能必须成功、哪个可以放弃，最后所有模块都变成半成品。',
        suggestion: '先按“对核心问题的直接贡献、验证成本、开发依赖”给八个模块排序，只留下一个核心功能和最多一个必要支撑功能。随后为第一版写清目标指标、当前基线、期望阈值、观察周期和停止条件；聊天、社区、商城等不能验证核心假设的模块全部移出本期。',
        acceptance: '第一版范围最多包含两个功能，并明确主次关系；方案同时写出一个核心指标、基线、目标阈值、观察周期和停止规则，团队能据此判断继续、调整还是终止投入。'
      }
    ]
  }
};

function buildCriticalReport(roleId) {
  if (criticalReports[roleId]) return criticalReports[roleId];
  const role = roles.find((item) => item.id === roleId);
  const input = sampleInputs[roleId].materialText;
  const lines = input.split('\n').map((line) => line.trim()).filter((line) => line.length > 12);
  return {
    qualityBand: 'critical',
    verdict: `这也敢交给${role.name}？整份材料还在拿空话冒充判断。`,
    verdictNote: '证据没有，取舍没有，漂亮话倒是一句没少。写得这么满，是怕别人发现里面没东西？',
    overallScore: 36,
    scores: role.dimensions.map((item, index) => ({ dimension: item.name, score: [32, 27, 38, 45][index], note: ['核心对象没有被说清', '结论后没有足够证据', '关键取舍被空话埋了', '字不少，有用信息太少'][index] })),
    strengths: [],
    issues: [
      {
        severity: 'P0', evidenceKind: 'quote', title: '拿宏大形容词冒充可验证结论', evidenceSamples: [lines[0]],
        diagnosis: '听着挺大，拆开一看什么都没有。把愿望写得像结论，不代表它就突然成真了。',
        impact: '读者无法判断它是事实、愿望，还是写作者在糊弄自己。',
        suggestion: '先删掉所有无法验证的宏大形容词，再按“对象—当前事实—期望变化—验证方式”重写结论。每个判断后至少跟一条数字、行为或可检查交付物；证据暂缺就明确标成假设，并写出下一步如何验证，别把愿望伪装成事实。',
        acceptance: '结论同时包含明确对象、当前事实、目标变化和验证方式四项；一名不了解背景的读者能准确复述现状与目标，并指出哪部分是事实、哪部分仍是假设。'
      },
      {
        severity: 'P0', evidenceKind: 'quote', title: '把动作清单当成了成果', evidenceSamples: (lines.slice(1, 3).length ? lines.slice(1, 3) : [lines[0]]),
        diagnosis: '又是一堆“我们做了什么”的废话，却没证明“所以怎样”。',
        impact: '动作没有兑换成价值，读者就没有理由采信或行动。',
        suggestion: '把动作按同一目标归组，每组只留一个关键动作，并在后面补齐“带来了什么结果、影响了多大范围、因此得出什么判断”。可以使用“通过 X 动作，使 Y 指标在 Z 范围内发生 A 变化，因此建议 B”的结构；无法兑换成结果的会议和沟通记录直接删除。',
        acceptance: '每个保留动作都紧跟结果、影响范围和下一步判断三项；读者无需追问就能回答“这个动作具体改变了什么，以及接下来为什么这样做”。'
      }
    ]
  };
}

const report = criticalReports['resume-terminator'];
const sampleInput = {
  roleId: 'resume-terminator', reviewMode: 'general', jobDescription: '', contextText: '',
  resumeText: sampleInputs['resume-terminator'].materialText,
  materialText: sampleInputs['resume-terminator'].materialText
};

const solidResumeInput = {
  roleId: 'resume-terminator', reviewMode: 'general', contextText: '',
  materialText: `张然｜3 年互联网增长产品经验
某科技公司｜产品经理｜2022.07 - 至今
· 重构新用户首购路径，通过 4 周 A/B 实验将首购转化率从 8.4% 提升至 11.7%，覆盖月均 12 万新访客。
· 建立渠道质量分层，暂停 3 个高消耗低转化渠道，单个付费用户获客成本下降 18%。
· 主导会员增长项目的需求定义和实验设计，协调 6 人跨职能小组在 5 周内上线。
· 会员项目上线后 30 日付费渗透率提升 9%，但续费率尚未完成完整周期验证。`
};

const solidResumeReport = {
  qualityBand: 'rebuilding',
  verdict: '这份简历还行，至少在拿数字说话。',
  verdictNote: '两个成绩能让招聘官停一下，但别急着飘。会员项目的长期价值还少一条闭环证据。',
  overallScore: 74,
  scores: [
    { dimension: '信息结构', score: 76, note: '定位与经历主线已经对齐' },
    { dimension: '成果量化', score: 86, note: '关键项目有基线、结果与范围' },
    { dimension: '可信证据', score: 68, note: '短期指标成立，长期价值尚未闭环' },
    { dimension: '表达效率', score: 78, note: '每条大都能快速读出贡献' }
  ],
  strengths: [
    { title: '转化成果有完整证据链', evidenceSamples: ['重构新用户首购路径，通过 4 周 A/B 实验将首购转化率从 8.4% 提升至 11.7%，覆盖月均 12 万新访客。'], analysis: '动作、方法、基线、结果和样本范围都在，形容词在这里插不上嘴。', value: '招聘官能直接判断你具备增长实验和规模化验证能力。' },
    { title: '个人决策边界够清楚', evidenceSamples: ['建立渠道质量分层，暂停 3 个高消耗低转化渠道，单个付费用户获客成本下降 18%。'], analysis: '“建立”和“暂停”说清了你做的判断，团队功劳没有被含糊认领。', value: '证明你不只会执行，也能基于数据做资源取舍。' }
  ],
  issues: [
    { severity: 'P1', evidenceKind: 'quote', title: '会员项目只证明了短期渗透', evidenceSamples: ['会员项目上线后 30 日付费渗透率提升 9%，但续费率尚未完成完整周期验证。'], diagnosis: '这句话很诚实，但也暴露了成果还没闭环。渗透率不能冒充长期价值。', impact: '如果投递更高阶的增长岗位，读者会追问留存、续费与增量收入。', suggestion: '保留“长期价值尚未验证”的边界说明，再补上计划观察的续费率、90 日留存和增量收入，以及各指标的统计时间点。后续数据没出来前，可以写清样本规模与实验设计，但别用 30 日渗透率替代长期价值。', acceptance: '这条经历要明确区分已证实的 30 日结果、待观察的长期指标和预计出数时间；读者能看懂当前证据边界，并知道后续用哪三项数据完成闭环。' }
  ]
};

const readyResumeInput = {
  roleId: 'resume-terminator', reviewMode: 'general', contextText: '',
  materialText: `张然｜3 年 B2C 增长产品经验｜聚焦首购转化与会员增长
某科技公司｜产品经理｜2022.07 - 至今
· 重构新用户首购路径，设计并完成 4 周 A/B 实验，将首购转化率从 8.4% 提升至 11.7%，覆盖月均 12 万新访客。
· 建立渠道质量分层，主导暂停 3 个高消耗低转化渠道，单个付费用户获客成本下降 18%。
· 主导会员增长项目的需求定义、实验设计和上线验收，协调 6 人跨职能小组在 5 周内上线。
· 会员项目上线 90 日后，付费渗透率提升 9%，首期续费率达 63%，新增月均会员收入 46 万元。`
};

const readyResumeReport = {
  qualityBand: 'ready',
  verdict: '行，这份能投。不是你会包装，是证据确实站得住。',
  verdictNote: '定位、个人决策、短期转化和长期价值都连上了。真挑不出硬伤，我也不至于闭着眼乱骂。',
  overallScore: 89,
  scores: [
    { dimension: '信息结构', score: 90, note: '首行定位与后续证据完整对齐' },
    { dimension: '成果量化', score: 94, note: '转化、成本、续费与收入均有数字' },
    { dimension: '可信证据', score: 87, note: '方法、范围与个人边界可被追问' },
    { dimension: '表达效率', score: 86, note: '四条经历都能快速读出关键价值' }
  ],
  strengths: [
    { title: '定位不是自我标签', evidenceSamples: ['张然｜3 年 B2C 增长产品经验｜聚焦首购转化与会员增长'], analysis: '首行定位被后面的首购、获客和会员证据连续支撑，这个头衔站得住。', value: '招聘官能在第一屏建立清晰的候选人预期。' },
    { title: '实验结果具备可核验范围', evidenceSamples: ['重构新用户首购路径，设计并完成 4 周 A/B 实验，将首购转化率从 8.4% 提升至 11.7%，覆盖月均 12 万新访客。'], analysis: '这条同时给出了方法、周期、基线、结果和覆盖规模，证据链完整。', value: '读者可以直接判断增长实验能力和结果量级。' },
    { title: '会员项目完成了长期闭环', evidenceSamples: ['会员项目上线 90 日后，付费渗透率提升 9%，首期续费率达 63%，新增月均会员收入 46 万元。'], analysis: '从渗透走到续费和收入，没有拿短期热闹冒充长期价值。', value: '证明项目不只上线了，而且对可持续业务结果产生了影响。' }
  ],
  issues: []
};

const processingStagesByRole = Object.fromEntries(roles.map((item) => [item.id, [
  { title: '逐句挑刺', description: '事实还是废话，一句也别想混过去' },
  { title: '追着要证据', description: '说了等于没说的句子，一个不放过' },
  { title: '看看什么水平', description: '是垃圾、半成品，还是真能交出去' },
  { title: '直接下修改命令', description: '哪里扯淡、怎么改、改成什么样才算完' }
]]));

function getRole(roleId) {
  return roles.find((item) => item.id === roleId) || roles[0];
}

function getMockReport(roleId) {
  return buildCriticalReport(roleId);
}

module.exports = {
  roles,
  role: roles[0],
  getRole,
  sampleInputs,
  sampleInput,
  report,
  getMockReport,
  solidResumeInput,
  solidResumeReport,
  readyResumeInput,
  readyResumeReport,
  processingStages: processingStagesByRole['resume-terminator'],
  processingStagesByRole
};
