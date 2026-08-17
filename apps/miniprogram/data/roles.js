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
    preview: {
      badVerdict: '这也叫简历？满页都在证明你上过班，没一行证明你干成过事。',
      goodVerdict: '这份简历还行，至少在拿数字说话。'
    },
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
      targetedNote: '审岗位匹配证据'
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
    preview: {
      badVerdict: '你管这叫汇报？开会、沟通、推进写了一堆，结果去哪儿了？',
      goodVerdict: '行，结论和数字都在前面。至少没让领导翻二十页替你找答案。'
    },
    review: {
      titleLines: ['把汇报拿来。', '我倒要看看你忙出了什么。'],
      subtitle: '过程写得再热闹也不算成绩。结论、数字、要什么决定，说不清就等于白汇报。',
      materialLabel: '把汇报交出来',
      materialPlaceholder: '粘贴汇报稿、周报、复盘或述职材料。',
      contextLabel: '汇报对象与期望决定',
      contextPlaceholder: '例如：向业务负责人汇报，希望获得下个季度的增长预算。',
      generalLabel: '直接审汇报',
      generalNote: '审结构与结果',
      targetedLabel: '带决策目标',
      targetedNote: '审能否推动决策'
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
    preview: {
      badVerdict: '这也叫文案？受众没有，卖点没有，倒是把自己感动得够呛。',
      goodVerdict: '这句知道自己在跟谁说话，卖点和证据也对得上。难得不是自嗨。'
    },
    review: {
      titleLines: ['把文案拿来。', '看读者凭什么不划走。'],
      subtitle: '卖点说不清、证据拿不出、行动推不动，还想靠几个形容词骗点击？',
      materialLabel: '把文案交出来',
      materialPlaceholder: '粘贴广告、社媒、标题、落地页或活动文案。',
      contextLabel: '目标受众与期望行动',
      contextPlaceholder: '例如：面向刚开始带团队的管理者，希望其预约试用。',
      generalLabel: '直接审文案',
      generalNote: '审卖点与表达',
      targetedLabel: '带转化目标',
      targetedNote: '审受众与行动'
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
    preview: {
      badVerdict: '八个功能全想做，一个问题都没证实。你这不是 PRD，是愿望清单。',
      goodVerdict: '先证明问题，再决定做什么。总算是一份产品方案，不是功能许愿池。'
    },
    review: {
      titleLines: ['把方案拿来。', '先证明这东西不是自嗨。'],
      subtitle: '别急着爱上自己的功能。问题、证据、取舍、验收，一个说不清就别谈立项。',
      materialLabel: '把产品方案交出来',
      materialPlaceholder: '粘贴产品想法、需求文档、PRD 或功能方案。',
      contextLabel: '目标用户、产品阶段与验证目标',
      contextPlaceholder: '例如：面向 20-100 人团队的早期验证，想确认用户是否愿意持续使用。',
      generalLabel: '直接审方案',
      generalNote: '审问题与取舍',
      targetedLabel: '带验证目标',
      targetedNote: '审能否验证假设'
    }
  }
];

const processingStagesByRole = Object.fromEntries(roles.map((role) => [role.id, [
  { title: '逐句挑刺', description: '事实还是废话，一句也别想混过去' },
  { title: '追着要证据', description: '说了等于没说的句子，一个不放过' },
  { title: '看看什么水平', description: '是垃圾、半成品，还是真能交出去' },
  { title: '直接下修改命令', description: '哪里扯淡、怎么改、改成什么样才算完' }
]]));

function getRole(roleId) {
  return roles.find((role) => role.id === roleId) || roles[0];
}

module.exports = {
  roles,
  getRole,
  processingStagesByRole
};
