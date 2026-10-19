import { newSteps } from "./domain";
import type {
  Brief,
  ContentItem,
  Platform,
  Project,
  Solution,
  UsageLog,
} from "./domain";

export const exampleBrief: Brief = {
  name: "山野气泡茶新品上市整合营销方案",
  brand: "山野气泡茶",
  product: "低糖东方植物气泡饮",
  industry: "食品饮料 / 新消费",
  background:
    "示例策划 Brief：山野气泡茶拟以低糖东方植物气泡饮进入城市白领的日常饮用场景，开展为期 30 天的新品上市传播。品牌、产品与资源条件用于演示，配料表、营养标签、售价、库存、上市城市及渠道链接均待品牌确认。",
  problem:
    "新品认知尚待建立；用户可能把低糖误认为零糖，把东方植物误读为养生功效。需要以真实口感、标签信息和可复现的午后、佐餐场景解释购买理由，并为首月转化建立可核验的渠道归因。",
  sellingPoints:
    "拟传播卖点：低糖、东方植物风味、气泡口感、适合通勤后与办公室午后的饮用场景。低糖称谓须以实际营养标签及适用标准为依据，不等于零糖；植物原料、口味、糖含量、包装规格待核验，不承诺减脂、助眠、排毒或其他健康功效。",
  competitors:
    "竞品观察维度：无糖气泡水、即饮茶、植物风味饮料及便利店佐餐饮品。待采集同规格售价、糖含量标签、真实口感反馈、陈列与内容形式；未进行实时市场调查，不作市场份额或竞品优劣结论。",
  audience: "22—35 岁的城市年轻白领，关注轻负担饮食、情绪价值和生活方式表达。",
  needs:
    "希望在工作间隙喝到有风味、有气泡的饮品；关注糖含量、配料、价格与购买便利性；偏好自然可信、不过度营销的内容，愿意用一次试饮确认是否符合个人口味。以上为策划假设，待访谈与试饮验证。",
  goals: ["新品上市", "社交媒体种草", "首月转化"],
  platforms: ["小红书", "抖音", "微信公众号", "视频号"],
  budget: 300000,
  duration: 30,
  tone: "自然、轻松、年轻、有东方感、不过度营销",
  requirements:
    "重点平台为小红书、抖音、微信公众号、视频号；按附件另提供 3 条微博补充素材，是否投放待确认。完整交付 3 条小红书笔记、2 条抖音脚本、1 篇公众号提纲、2 条视频号脚本、3 条微博文案。内容均待人工核验；低糖不写成零糖，不宣传健康疗效；合作与赠饮明确披露；音乐、字体、图片和肖像取得授权；试饮需真实规则与隐私告知；转化以去重订单和约定归因窗口核验，跨平台曝光不得当作独立人数。",
};

export const djiBrief: Brief = {
  name: "大疆 Osmo 360 全景相机新品上市整合营销方案",
  brand: "DJI 大疆",
  product: "Osmo 360 全景相机",
  industry: "数码科技 / 影像设备",
  background:
    "本地策划示例：围绕大疆 Osmo 360 全景相机的新品上市传播，面向希望记录旅行、户外运动和第一视角内容的创作者，设计一套从产品认知到内容试用的整合营销方案。产品规格、售价、上市时间与购买入口均待品牌官方资料确认。",
  problem:
    "全景相机容易被理解成小众运动设备，普通用户不清楚它与手机、运动相机的使用差异。传播需要先让用户看见‘拍摄后再决定视角’的内容价值，再解释真实使用条件和购买门槛。",
  sellingPoints:
    "候选传播方向：360° 全景记录、旅行与运动中的第一视角、后期重新取景和分享。具体分辨率、续航、防护等级、配件兼容性及 AI 功能不在本地示例中做确定性描述，发布前以 DJI 官方资料核验。",
  competitors:
    "观察对象包括手机空间视频、运动相机、其他全景相机和短视频平台原生拍摄方式。当前未开展实时竞品调研，不作市场份额、画质或价格优劣结论。",
  audience:
    "20—38 岁的旅行、骑行、滑雪、潜水和户外内容创作者，以及想记录家庭旅行但不擅长复杂剪辑的用户。",
  needs:
    "希望一次拍摄保留更多视角，回到家后再选择画面；关注设备是否容易携带、素材是否容易分享、拍摄过程是否需要额外学习，以及设备与配件成本是否清晰。以上为策划假设，待用户访谈和真实试用验证。",
  goals: ["新品上市", "品牌认知", "社交媒体种草"],
  platforms: ["小红书", "抖音", "微信公众号", "视频号"],
  budget: 500000,
  duration: 45,
  tone: "真实、轻快、有探索感，不夸大参数与拍摄效果",
  requirements:
    "全部内容标明为策划草案；产品参数、样片、售价、上市时间、购买入口、合作达人、音乐、字体与肖像授权待确认。不得把规划曝光、播放、收藏或销售目标写成实际结果；不得暗示设备适合所有运动环境；真实试用需说明样机、拍摄条件与合作关系。",
};

const SAMPLE_DATE = "2026-10-17T09:00:00+08:00";
const MOCK_MODEL = "Mock · 本地模板";
const quantities: Record<Platform, number> = {
  小红书: 3,
  抖音: 2,
  微信公众号: 1,
  视频号: 2,
  微博: 3,
};
const formats: Record<Platform, string> = {
  小红书: "小红书笔记",
  抖音: "抖音脚本",
  微信公众号: "微信公众号文章提纲",
  视频号: "视频号脚本",
  微博: "微博文案",
};

function scheduledAt(createdAt: string, day: number, hour = 12): string {
  const date = new Date(createdAt);
  // Calendar offsets are fixed to the campaign's China timezone, independent of browser timezone.
  const local = new Date(date.getTime() + 8 * 3600000);
  local.setUTCDate(local.getUTCDate() + day);
  local.setUTCHours(hour, 0, 0, 0);
  return `${local.toISOString().slice(0, 19)}+08:00`;
}

function mockCopy(brief: Brief, platform: Platform, index: number): string {
  const goals = brief.goals.join("、") || "待确认";
  const angle = ["真实使用场景", "产品信息问答", "自愿反馈邀请"][index % 3];
  const context = `【Mock 本地规则模板｜非模型推理、用户调研或真实体验，待人工修改】
品牌：${brief.brand}；产品：${brief.product}；行业：${brief.industry}。
目标人群：${brief.audience}。
输入背景：${brief.background}
需解决的问题：${brief.problem}
用户需求假设：${brief.needs}
候选卖点（未核验，不直接作发布事实）：${brief.sellingPoints}
竞品输入（非本次研究）：${brief.competitors || "待补充"}
传播目标：${goals}；预算上限 ${brief.budget.toLocaleString("zh-CN")} 元；周期 ${brief.duration} 天。
所选平台：${brief.platforms.join("、") || "待选择"}；品牌语气：${brief.tone}。
本条角度：${angle}。`;
  const copies: Record<Platform, string> = {
    小红书: `正文草案：
今天想认真了解一下${brief.brand}的${brief.product}。先不急着给结论，把自己关心的问题写下来：它适合什么真实使用场景？产品信息能否核验？我能否方便地进一步了解？
对于${brief.audience}，这篇选择从「${angle}」讲起。把${brief.needs}拆成一个可以拍摄的日常片段，展示真实产品；没有试用证据就不写“亲测”，没有来源就不引用用户评价。
产品说明先回到品牌确认的资料。${brief.sellingPoints}是当前 Brief 中的待核验信息，不是本模板已证实的结论。发布定稿时只保留有依据的表述。
你最想先了解哪一项？欢迎真实提问；如果存在合作或赠品关系，应显著披露，不要求好评。
配图安排：实际产品全貌、真实场景、经审核的信息卡。结尾仅放确认有效的官方入口，不自行填价格、库存或活动权益。`,
    抖音: `短视频脚本草案｜30 秒｜竖屏：
0—4 秒：真实场景镜头；字幕“了解${brief.product}，你先看什么？”不虚构痛点或使用结果。
4—10 秒：展示${brief.brand}实际产品与正式资料。旁白“先从${angle}开始”。画面与口播需能被输入资料支持。
10—19 秒：拍摄一个与${brief.audience}相关的实际使用步骤；当前未有素材，仅安排镜头，不假装已经拍摄。卖点“${brief.sellingPoints}”经品牌核验后再写入最终口播。
19—25 秒：主持人提出一个关于${brief.needs}的开放问题；用可读信息卡作答，无法确认的部分明确待确认。
25—30 秒：品牌与产品同框，邀请查看已核验的官方信息。目标为${goals}，不承诺播放或订单。
制作要求：授权音乐、真实产品、合规字幕；如为合作内容按平台披露。设置独立链接编码后再测点击，播放不能替代销量。`,
    微信公众号: `文章提纲草案｜建议 1,000—1,500 字：
标题：认识${brief.brand}的${brief.product}，从真实问题开始
摘要：围绕${brief.audience}的${brief.needs}，说明已核验信息与仍需确认的问题。
开篇（150 字）：从 Brief 的真实背景“${brief.background}”选一个可验证场景，不杜撰用户故事。
第一节（300 字）：产品是什么。根据品牌资料说明品类、规格与使用条件；“${brief.sellingPoints}”逐条核实，不添加输入没有提供的功能或效果。
第二节（250 字）：如何与目标人群场景联系。用${angle}演示一个步骤，区分策划假设与真实素材；没有实拍则延后发布。
第三节（250 字）：回答选择问题。列出价格、适用限制、获取方式与售后规则；缺失信息先保留内部审核任务，不对外编造。
结尾（100 字）：邀请提出真实问题，加入已核验的官方入口；合作关系及隐私规则单独说明。
配图：产品实拍、来源明确的信息图及授权场景。目标为${goals}；文章阅读、入口点击与订单分别采集，不互相替代。`,
    视频号: `视频号脚本草案｜45 秒：
0—6 秒：主持人与${brief.product}实际产品同框，介绍品牌${brief.brand}；无实物不假装完成拍摄。
6—17 秒：围绕「${angle}」提出来自 Brief 的问题“${brief.problem}”。使用“我们想验证”而非“用户都认为”。
17—30 秒：以正式资料说明一个候选卖点“${brief.sellingPoints}”；资料未确认则暂停该镜头。若有试用者，另取得肖像授权并披露赠品关系，不编造评价。
30—39 秒：回到${brief.audience}的需求“${brief.needs}”，邀请表达不同意见，不绑定关注或好评。
39—45 秒：展示品牌与经确认的官方信息入口。只记录实际发生的分享、点击与反馈；未经归因核对不称成交。
制作：自然真实的场景，授权字体音乐，字幕可读。信息尚不完整时，这只是生产计划，不作为发布稿。`,
    微博: `微博短文案草案：
认识${brief.brand}的${brief.product}，先从一个具体问题聊起：${brief.needs}。
这次围绕「${angle}」，我们更想把能核验的信息说明白，而不是用没有依据的效果承诺代替回答。${brief.audience}最关心哪一项，欢迎真实提问。
产品卖点按品牌最终审核资料发布；尚未提供的售价、活动和权益不补写。合作或赠品关系显著披露，不以好评换权益。
配图使用真实产品和授权素材；仅放有效官方入口。此条服务${goals}，实际互动与转化未采集。`,
  };
  return `${context}\n\n${copies[platform]}\n\n执行约束：${brief.requirements || "品牌尚未提供额外限制，发布前补齐审核。"}\n审核任务：核实事实、适用范围、授权、商业关系、隐私及转化归因；不将本地模板当作专业调研或实际效果。`;
}

function buildSolution(
  brief: Brief,
  projectId: string,
  createdAt: string,
): Solution {
  brief = {
    ...brief,
    industry: brief.industry.trim() || "行业待确认",
    background:
      brief.background.trim() || "项目背景待补充，当前不推断市场事实。",
    problem:
      brief.problem.trim() || "市场问题待访谈与品牌确认，不将假设当作结论。",
    sellingPoints:
      brief.sellingPoints.trim() || "产品卖点与证据待品牌补充，禁止自行编造。",
    competitors:
      brief.competitors.trim() || "竞品与资料来源待补充，未开展市场研究。",
    needs: brief.needs.trim() || "具体用户需求与场景待访谈验证。",
    tone: brief.tone.trim() || "品牌语气待确认，暂采用克制、事实性表达。",
    requirements:
      brief.requirements.trim() ||
      "品牌约束待确认；发布前核验产品事实、授权、商业披露、隐私与归因。",
  };
  const selected = [...new Set(brief.platforms)];
  const goal = brief.goals.join("、") || "营销目标待确认";
  const budget = `${brief.budget.toLocaleString("zh-CN")} 元`;
  const duration = Math.max(1, Math.floor(brief.duration) || 1);
  const contents: ContentItem[] = selected.flatMap((platform) =>
    Array.from({ length: quantities[platform] }, (_, index) => ({
      id: `${projectId}-${platform}-${index + 1}`,
      projectId,
      title: `${brief.brand}｜${brief.product} · ${platform}内容 ${index + 1}`,
      body: mockCopy(brief, platform, index),
      platform,
      type: formats[platform],
      goal,
      publishAt: scheduledAt(createdAt, Math.min(duration - 1, index * 4 + 2)),
      review: "待审核" as const,
      needsEdit: true,
      owner: "待分配",
      createdAt,
      updatedAt: createdAt,
    })),
  );
  return {
    audience: {
      persona: `策划假设，非调研结论：${brief.audience}`,
      scenarios: [brief.needs],
      painPoints: [brief.problem],
      motivations: [brief.sellingPoints],
      mediaHabits: [`拟在 ${selected.join("、") || "待选渠道"} 验证内容偏好。`],
      perceptions: [`${brief.product} 的认知与接受度待访谈。`],
      concerns: ["产品信息、价格、售后及商业合作披露待核验。"],
    },
    market: {
      landscape: `Mock 框架：${brief.industry}；背景：${brief.background}`,
      competitors: [brief.competitors || "竞品待补充"],
      limitations: ["未开展实时检索、用户访谈或市场数据采集。"],
    },
    opportunity: {
      opportunity: `${brief.brand} 围绕“${brief.needs}”验证 ${brief.product} 的内容机会。`,
      evidence: [
        "仅依据输入 Brief 的策划假设，不代表已验证的市场机会。",
        brief.problem,
      ],
    },
    positioning: {
      positioning: `面向${brief.audience}的${brief.product}，定位待品牌确认。`,
      message: `${brief.brand}，从一个真实使用场景开始。`,
    },
    strategy: {
      opportunity: `围绕${goal}验证需求与内容。`,
      challenge: brief.problem,
      positioning: `${brief.brand} / ${brief.product}`,
      coreMessage: `${brief.brand}，从一个真实使用场景开始。`,
      tone: brief.tone,
      strategy: [
        `服务目标：${goal}。`,
        `总预算上限 ${budget}；投入建议为内容 30%、合作 35%、渠道测试 20%、合规及机动 15%，均待审批。`,
        `只覆盖所选渠道：${selected.join("、") || "待确认"}。`,
      ],
      rhythm: [
        `${duration} 天按预热、引爆、扩散、沉淀四阶段执行；短周期可同日交付。`,
      ],
      risks: [
        brief.requirements,
        "Mock 为本地规则模板，非实际模型推理；不得承诺营销效果。",
      ],
    },
    creatives: [1, 2, 3].map((n) => ({
      id: `${projectId}-creative-${n}`,
      name: `${brief.brand}：${["真实场景", "产品证据", "用户提问"][n - 1]}`,
      explanation: `围绕${brief.product}与${brief.needs}设计待验证内容。`,
      platforms: selected,
      format: ["场景记录", "信息图解", "问答短片"][n - 1],
      audience: brief.audience,
      example: `${brief.brand}的${brief.product}：${brief.sellingPoints}`,
      expected: `策划目标：支持${goal}，尚未采集结果。`,
      risk: `待核实事实和授权；${brief.requirements}`,
    })),
    matrix: selected.map((platform) => ({
      platform,
      role: `围绕${goal}进行${platform}小规模测试`,
      format: formats[platform],
      quantity: quantities[platform],
      objective: "规划数量，非已发布；数据未采集。",
    })),
    contents,
    timeline: ["预热期", "引爆期", "扩散期", "沉淀期"].map((phase, i) => ({
      phase,
      time: `D${Math.min(duration, Math.floor((duration * i) / 4) + 1)}—D${Math.min(duration, Math.max(1, Math.floor((duration * (i + 1)) / 4)))}`,
      goal: `${phase}：服务${goal}`,
      tasks: [
        `核对${brief.brand}的${brief.product}事实与${brief.audience}需求`,
        `安排${selected.join("、") || "待选渠道"}内容及审核`,
      ],
      platforms: selected,
      owner: ["品牌负责人", "内容负责人", "渠道负责人", "数据负责人"][i],
      deliverables: `${phase}内容与审核记录（计划）`,
      metrics: "按约定数据源采集；当前未采集，不将未执行计为零。",
    })),
    kpis: [
      "总曝光目标",
      ...selected.map((platform) => `${platform}有效互动目标`),
      "互动率目标",
      "官方入口点击目标",
      "有效意向量",
      "销售转化目标",
      "粉丝增长目标",
      "内容发布数量",
    ].map((name) => ({
      name,
      target:
        name === "内容发布数量"
          ? `规划 ${contents.length} 条，非已发布`
          : `规划目标待确认；预算 ${budget}，目标 ${goal}`,
      formula:
        name === "销售转化目标"
          ? "先约定归因窗口；按订单号去重，扣除取消与退款；没有交易数据时不可计算。"
          : "按平台原始口径采集，排除无效及重复记录；归因规则先确认。",
      source: `${selected.join("、") || "待选平台"}后台 / 业务台账（尚未接入）`,
      frequency: "每周及结项",
      current: "未采集",
    })),
    compliance: [
      {
        severity: "高",
        area: "产品事实",
        issue: `尚未核验${brief.product}的卖点与宣传依据。`,
        suggestion: `${brief.sellingPoints}；发布前由品牌和法务核实，不作健康疗效承诺。`,
        resolved: false,
      },
      {
        severity: "高",
        area: "合作与版权",
        issue: "商业合作、试用激励披露及素材授权待审核。",
        suggestion:
          "标明广告、合作或赠品关系；核验音乐、字体、图片、肖像授权；不得以好评换赠品。",
        resolved: false,
      },
      {
        severity: "高",
        area: "转化归因",
        issue: "未配置埋点、去重及退款口径，不能声明销售成果。",
        suggestion:
          "确认链接、活动编码、归因窗口及订单去重；仅采集必要个人信息并告知用途。",
        resolved: false,
      },
    ],
    quality: {
      score: 50,
      summary:
        "本地检查 1/2 项通过，分数仅作模板检查摘要，不代表策略有效、合规通过或人工审核。",
      checks: [
        {
          name: "结构完整",
          passed: true,
          detail: "12 个输出模块提供模板数据。",
        },
        {
          name: "执行与发布审核",
          passed: false,
          detail: "产品事实、预算、内容及追踪方式待人工确认；效果未采集。",
        },
      ],
    },
  };
}

export function createMockSolution(brief: Brief, projectId: string): Solution {
  const createdAt = new Date().toISOString();
  const isExactExample = (Object.keys(exampleBrief) as (keyof Brief)[]).every(
    (key) => JSON.stringify(brief[key]) === JSON.stringify(exampleBrief[key]),
  );
  return isExactExample
    ? exampleSolution(projectId, createdAt)
    : buildSolution(brief, projectId, createdAt);
}

function exampleSolution(projectId: string, createdAt: string): Solution {
  const solution = buildSolution(exampleBrief, projectId, createdAt);
  const scripts: {
    platform: Platform;
    title: string;
    day: number;
    hour: number;
    goal: string;
    body: string;
  }[] = [
    {
      platform: "小红书",
      title: "下午三点，把工位挪进一小片山野",
      day: 2,
      hour: 12,
      goal: "建立办公室午后饮用联想；观察收藏与配料提问，不预设购买效果。",
      body: `【品牌自有内容草案；图片、标签与购买入口待核验】
午后待办还没清空，先给自己留五分钟。
把桌面收出一个杯垫的位置，倒一杯山野气泡茶，看气泡慢慢浮起来。今天不替你规划理想生活，只记录一个普通工作日的小停顿。
这次想认识的是「低糖东方植物气泡饮」。我会先看配料表和营养标签，再决定是不是自己喜欢的风味。低糖不等于零糖，具体糖含量和原料以最终包装为准，也不意味着喝了能减脂或缓解焦虑。
我的工位五分钟清单：放下手机、倒好饮品、看看窗外，再回到下一件事。饮料只是这段日常里的一个选择，不是解决工作压力的方法。
你下午想喝有茶感的，还是气泡感更明显的？评论区聊聊口味偏好，不用先给好评。
配图：①真实包装与普通工位；②倒入透明杯的气泡近景；③完整可辨认的配料和营养标签。不要用植物道具暗示包装未列明的配方。
发布前补齐：经核验的口味描述、真实规格及官方购买入口。无返现、无好评激励。
#山野气泡茶 #工位日常 #午后五分钟`,
    },
    {
      platform: "小红书",
      title: "低糖不是零糖：买气泡饮前我会看这三处",
      day: 8,
      hour: 20,
      goal: "解释产品信息边界，承接真实标签问题与收藏。",
      body: `【品牌自有内容草案；低糖宣传资格待营养标签审核】
想选一瓶风味饮品，先别只看包装上的大字。
第一，看产品名称与配料表。山野气泡茶是「低糖东方植物气泡饮」的策划定位；用了哪些植物原料、有没有茶成分，要回到实际标签，不凭名字猜。
第二，看营养成分表。留意每 100 毫升与每瓶的区别，比较相同计量单位。低糖不等于零糖，具体数字必须来自正式包装，这篇发布前会放上清晰实拍，不用模糊截图代替证据。
第三，看自己是否真的喜欢。气泡强弱、甜度和风味是个人偏好，试一口比形容词更有帮助；不喜欢也可以如实说。
我们不会把「东方植物」写成养生配方，也不承诺控糖、排毒或减重。饮品不是药品，特定饮食限制请根据个人情况审慎选择。
图文安排：封面三项检查表；中间两张完整标签；最后一张真实倒杯过程。若尚未取得正式标签，本篇暂停发布，不自行填糖含量。
你最先看配料，还是看甜度？欢迎提问，品牌仅回复可核验信息。
#山野气泡茶 #饮品标签 #低糖不等于零糖`,
    },
    {
      platform: "小红书",
      title: "办公室自然补给站：把口味选择权交给同事",
      day: 16,
      hour: 12,
      goal: "招募真实试饮反馈，收集口味疑问，不以赠饮换好评。",
      body: `【品牌活动邀约草案；有赠饮，须披露，不是用户自发推荐】
想在办公室摆一个小小试饮角：不是来打卡交作业，只是午休时聊聊一瓶饮料。
山野气泡茶准备了「办公室里的自然补给站」试饮方案，产品为低糖东方植物气泡饮。可以先看包装，再少量试饮；你可以说喜欢、不喜欢，也可以不评价。
试饮反馈只问三件事：甜度是否合适？气泡口感如何？你会在什么场景选择它？不写疗效，不要求发笔记、关注或五星评价，不以正面评价作为领取条件。
低糖并非零糖；原料与糖含量以最终包装为准。有过敏或特殊饮食限制请先看标签，自行决定是否参与。
正式活动帖必须补齐：城市、场地、起止时间、名额、领取方式、每人数量、库存与取消规则。以上资源尚未确认，当前不是可报名活动，不收姓名、手机号或地址。
若后续需登记配送，单独告知用途、保存期限与删除渠道，只采集完成配送所需信息。参与者照片需另行征得同意。
#山野气泡茶 #办公室试饮 #真实口味反馈`,
    },
    {
      platform: "抖音",
      title: "今天，给自己放个气｜25 秒工位短片",
      day: 6,
      hour: 19,
      goal: "用可见场景建立产品记忆，观察有效播放与商品入口点击。",
      body: `【品牌短片草案｜9:16｜25 秒｜商业内容按平台要求标识】
0—3 秒：固定机位拍办公桌待办与一只收起手机的手。字幕「下午三点，给自己留五分钟」。不露出客户资料、聊天记录或第三方商标。
3—7 秒：山野气泡茶真实包装入画，开盖收音；旁白「今天，给自己放个气」。只用真实开盖声，不夸张暗示情绪治疗。
7—13 秒：倒杯近景、气泡特写；字幕「低糖东方植物气泡饮」。角标「低糖不等于零糖，配料和糖含量以包装为准」。产品名称与标签审核后才能上片。
13—19 秒：镜头回到窗边桌面，人物尝一口；旁白「风味合不合口，自己试过再说」。不用演员表演立即恢复精力。
19—25 秒：完整产品与品牌名，字幕「给忙碌生活，加一点自然气」。结尾「你想把这五分钟留在哪里？」；官方购买入口配置并核验后才添加。
制作：自然光、真实产品、原创或授权音乐；演员肖像、场地许可留档。封面使用实际产品，不用与配方无关的植物暗示成分。
数据：记录播放定义、完播与有效入口点击；未经埋点不得归因为订单。`,
    },
    {
      platform: "抖音",
      title: "一瓶饮料，先回答三个问题｜35 秒标签问答",
      day: 12,
      hour: 19,
      goal: "消除低糖与植物风味误解，承接理性试饮兴趣。",
      body: `【品牌问答草案｜9:16｜35 秒｜标签未确认不得拍摄定稿】
0—4 秒：主持人与完整包装同框。「听到低糖、东方植物、气泡，你会先问什么？」
4—12 秒：问题一「低糖就是零糖？」主持人摇头：「不是。看这瓶山野气泡茶的正式营养标签，再按真实规格算整瓶。没核对前，我们不报数字。」镜头展示经审核标签，不虚构糖含量。
12—21 秒：问题二「东方植物等于养生？」回答：「这是风味与原料表达，不是健康功效。实际用了什么，以配料表为准。」不出现减脂、排毒、改善睡眠等话术。
21—29 秒：问题三「什么场景喝？」切午餐后桌面和午休画面：「喜欢有风味、有气泡的口感，可以把它作为日常饮品的一个选择；是否适合自己，由个人口味和饮食安排决定。」
29—35 秒：品牌包装定格。「还有什么想看清楚？留言，我们用能核验的信息回答。」
剪辑：每问留出清晰字幕，标签镜头可暂停阅读；主持人口播与字幕同时保留低糖边界。不得搬用竞品画面、贬低其他饮品或伪造测评身份。
转化：只使用经核验的官方入口；链接编码区分本片，不以评论人数替代购买人数。`,
    },
    {
      platform: "微信公众号",
      title: "给忙碌生活，加一点自然气｜上市文章完整提纲",
      day: 7,
      hour: 12,
      goal: "建立品牌与产品信息承接页，让读者能核验标签、渠道与活动规则。",
      body: `【品牌公众号文章提纲｜建议 1,200—1,500 字｜待事实审核】
标题：给忙碌生活，加一点自然气
摘要：认识山野气泡茶低糖东方植物气泡饮，从一张能看清的标签和一个普通午后开始。
头图：真实产品与日常桌面，避免将不在配料表中的植物作为主视觉。
开篇（约 150 字）：写城市白领午休结束前的五分钟。示例开头：「待办还在，我们先把桌面收出一只杯子的位置。山野气泡茶想参与的，就是这样一段小小的日常。」不把饮用描述为减压或医疗手段。
第一节「它是什么」（约 250 字）：解释产品品类、真实原料、规格与风味。附完整配料表、营养标签和包装实拍；无法确认的糖含量、原产地与工艺不写。明确低糖不等于零糖，不从东方植物推导健康疗效。
第二节「可以在哪些时刻试试」（约 250 字）：午后工位、普通佐餐、周末与朋友聊天三个场景，各配真实画面。不要求用饮料代替水或正餐，不把特定口味写成人人喜欢。
第三节「先看清，再决定」（约 200 字）：设置三问三答：低糖与零糖区别、原料如何核验、哪里可以了解产品。涉及过敏与饮食限制只引导阅读标签，不提供医疗建议。
第四节「办公室里的自然补给站」（约 200 字）：说明拟开展试饮，但城市、时间、场地、名额和领取规则尚待确认。资源未落实前仅写计划，不放虚构报名表。赠饮关系明确披露，不绑定好评与发帖。
结尾（约 100 字）：邀请读者提出真实口味问题。官方购买入口经品牌确认后添加；试饮规则和隐私说明独立链接，不将关注公众号设为领取前提。
发布清单：品牌与法务确认事实；核验图片、字体、音乐与肖像授权；校对链接和移动端标签可读性。保留审核版本及修订时间。
归因：文章专属链接编码，区分阅读、入口点击、去重支付订单；记录退款与归因窗口，不把文章阅读量称为新增消费者。`,
    },
    {
      platform: "视频号",
      title: "办公室里的自然补给站｜45 秒试饮记录",
      day: 15,
      hour: 12,
      goal: "以可信现场记录说明试饮流程，收集开放反馈。",
      body: `【品牌活动脚本草案｜45 秒｜场地和参与者同意后执行】
0—5 秒：普通办公室长桌与山野气泡茶包装。「午休，我们摆了一个小小试饮角。」画面标识「品牌组织活动，饮品免费提供」。活动未实际举办前不得发布为现场实录。
5—12 秒：工作人员摆出可读的配料表和活动说明。「先看标签，自行决定是否试饮；低糖不是零糖。」不采集无关办公信息。
12—27 秒：三位自愿参与者依次回答「甜度感觉怎样」「气泡感如何」「更想在哪个场景喝」。允许保留中性与负面评价，不按品牌话术重录；不得伪造素人。
27—37 秒：工作人员记录匿名口味偏好，不拍手机号或登记信息。「不同口味都值得记下，不喜欢也没关系。」不以赠饮换发帖或正面评价。
37—45 秒：产品与反馈卡同框。「办公室里的自然补给站，下次你想问什么？」没有确认的活动日期、地点或名额不对外招募。
执行清单：核对场地许可、肖像授权、卫生条件及余量；使用原创收音或可商用配乐。产品标签与原料未经确认不出定稿。
数据仅统计自愿有效反馈及实际领取；不要将出镜人数当作转化人数。`,
    },
    {
      platform: "视频号",
      title: "东方植物的轻盈一刻｜40 秒产品问答",
      day: 23,
      hour: 20,
      goal: "沉淀可分享产品说明，回答配料与购买入口问题。",
      body: `【品牌产品问答草案｜40 秒｜「轻盈」仅表达画面和生活节奏】
0—6 秒：窗边自然光下的真实产品与透明杯。旁白「东方植物的轻盈一刻，先从看清一瓶饮料开始。」不得使用体重秤或腰围对比暗示减肥。
6—16 秒：完整包装及配料表特写。旁白「山野气泡茶，低糖东方植物气泡饮。这里写明实际原料；我们不把风味故事说成健康功效。」未获正式配料表时暂停拍摄这一段。
16—26 秒：开盖、倒杯，镜头保持真实。「气泡、风味、甜度，喜欢哪一种，留给你自己的口味判断。低糖不等于零糖，糖含量以营养标签为准。」
26—34 秒：主持人读一条经用户授权并匿名化的真实问题；若尚未收集，改为明确标识的「常见提问示意」，不杜撰用户反馈。「哪里可以买？」只展示确认有效的官方入口。
34—40 秒：包装与主题语「给忙碌生活，加一点自然气」。不显示销量、满意度、功效或未经采集的数据。
素材要求：授权音乐、字体与人物；保留原始拍摄及审核记录。发布目标是完整传达产品事实，实际播放、分享及点击均待采集。`,
    },
    {
      platform: "微博",
      title: "#今天给自己放个气# 午后五分钟",
      day: 4,
      hour: 12,
      goal: "补充话题素材，是否纳入正式投放待确认。",
      body: `【品牌话题草案｜微博为补充渠道，未安排付费投放】
#今天给自己放个气# 待办很长，也可以先把桌面收出一只杯子的位置。倒一杯山野气泡茶，看气泡慢慢冒出来，然后继续过普通的一天。给忙碌生活，加一点自然气。
低糖东方植物气泡饮；低糖不等于零糖，实际配料与糖含量以包装为准。不是减压、减脂或养生承诺。
你的午后五分钟会留给什么？欢迎真实分享，无抽奖、无好评激励。配图使用真实产品及已授权照片。`,
    },
    {
      platform: "微博",
      title: "东方植物是风味，不是功效承诺",
      day: 13,
      hour: 18,
      goal: "以简明事实卡纠正常见误解，承接标签提问。",
      body: `【品牌信息卡草案｜标签待审核】
#山野气泡茶# 认识「低糖东方植物气泡饮」，先看清三件事：①低糖≠零糖，具体糖含量看营养标签；②东方植物是原料与风味表达，不是健康疗效；③喝不喝、喜欢什么口味，由你自己的偏好决定。
发布时配完整配料与营养标签实拍，未核验前不填写具体数字、原料产地或工艺优势。不做竞品踩一捧一，也不引用无来源研究。
把想问的产品问题留在评论里，我们只回答能核验的信息。微博是否正式发布由渠道负责人确认。`,
    },
    {
      platform: "微博",
      title: "补给站想听真话：你更在意甜度还是气泡？",
      day: 24,
      hour: 12,
      goal: "收集非诱导口味偏好，为下一轮内容问题清单提供线索。",
      body: `【品牌互动草案｜不是已发生的用户反馈】
#办公室里的自然补给站# 选一瓶午后饮品，你更在意甜度、气泡感、原料信息，还是购买方便？山野气泡茶想把问题问具体一点，欢迎说真实想法，不必只说好听的。
这是一条自愿讨论，不代表调研样本或满意度结果；没有赠品、返现或好评任务。若后续组织赠饮，会另行公开时间、地点、名额、领取规则及隐私说明。
低糖不等于零糖，东方植物不代表健康功效。评论仅作匿名选题线索，引用原话和头像须单独获得许可；未配置真实活动入口前不收个人联系方式。`,
    },
  ];
  solution.contents = scripts.map((item, i) => ({
    id: `${projectId}-content-${i + 1}`,
    projectId,
    title: item.title,
    body: item.body,
    platform: item.platform,
    type: formats[item.platform],
    goal: item.goal,
    publishAt: scheduledAt(createdAt, item.day, item.hour),
    review: "待审核",
    needsEdit: true,
    owner: "待分配",
    createdAt,
    updatedAt: createdAt,
  }));
  solution.audience = {
    persona:
      "策划假设：22—35 岁城市年轻白领；关注饮食信息与生活方式表达，购买时兼顾风味、价格和便利性。年龄与偏好来自 Brief，尚无访谈、购买记录或抽样数据支持细分结论。",
    scenarios: [
      "工作日下午三点，办公室午休后的短暂停顿。",
      "日常午餐、晚餐佐餐；不替代饮水或正餐。",
      "下班后与朋友聊天，想选有气泡和风味的普通饮品。",
      "办公室试饮角，先看标签，再用少量试饮确认个人偏好。",
    ],
    painPoints: [
      "低糖、零糖、茶饮和植物饮料概念容易混淆。",
      "新品口味、售价、购买入口不清晰，难以判断是否值得尝试。",
      "对夸张健康话术、过度修饰的测评与赠品换好评有疑虑。",
    ],
    motivations: [
      "用一次试饮确认甜度与气泡感。",
      "从可读标签获得选择依据，而非相信抽象卖点。",
      "在普通日常中表达个人口味与生活节奏。",
    ],
    mediaHabits: [
      "假设小红书承担场景搜索与收藏，需由关键词与收藏数据验证。",
      "假设抖音承接开盖、倒杯等短镜头，需观察播放与完播。",
      "公众号承接完整产品信息，视频号承接可分享的问答；微博仅补充话题素材。",
    ],
    perceptions: [
      "低糖不等于零糖；具体含糖量及宣传资格待标签审核。",
      "东方植物首先是原料与风味表达，不能推导养生功效。",
      "气泡带来口感差异，不代表消化、减肥或情绪疗愈效果。",
    ],
    concerns: [
      "是否有未标明成分或过敏原？",
      "每瓶多少、售价多少、哪里能买？以上待品牌提供。",
      "推荐是否收取费用或获得赠品？是否允许负面反馈？",
      "试饮申请会收哪些个人信息、如何删除？",
    ],
  };
  solution.market = {
    landscape:
      "示例分析框架：新品需要在普通气泡水、即饮茶与植物风味饮品之间解释清楚自己的品类、风味与使用场景。这里不提供未经采集的市场规模、增长率、排名或份额。",
    competitors: [
      "无糖气泡水：对照同规格糖含量、价格和气泡口感，不将低糖写成优于无糖。",
      "即饮茶：对照配料、茶成分、风味与佐餐场景，不能假设本品含茶。",
      "植物风味饮品：对照真实原料、风味表达、渠道与标签可读性。",
    ],
    limitations: [
      "未进行实时竞品检索；品牌名、规格、售价与来源链接待补采。",
      "预算分配与渠道角色均为策划建议，并非已谈妥资源或已验证投放结论。",
      "不引用无出处的销量、口碑、达人案例或用户评论。",
    ],
  };
  solution.opportunity = {
    opportunity:
      "用“普通午后 + 可读标签 + 可选择的试饮”降低理解成本，把东方植物从抽象概念落到真实风味与场景。",
    evidence: [
      "Brief 指定人群关注轻负担饮食、情绪价值和生活方式表达，这是输入，不是调研结果。",
      "低糖与零糖、原料与功效容易产生概念误读，是需要测试的沟通问题。",
      "建议访谈 8—12 位目标用户并做自愿试饮，核对上述假设后再扩大投入；当前未执行。",
    ],
  };
  solution.positioning = {
    positioning:
      "给城市白领日常午后与佐餐场景的低糖东方植物气泡饮；具体标签、风味与价格待核验。",
    message: "给忙碌生活，加一点自然气。",
  };
  solution.strategy = {
    opportunity: solution.opportunity.opportunity,
    challenge:
      "同时解释“低糖、东方植物、气泡”而不夸大功效；新品缺少可核验口味、渠道与购买信息，需先补齐事实。",
    positioning: solution.positioning.positioning,
    coreMessage: solution.positioning.message,
    tone: exampleBrief.tone,
    strategy: [
      "信息先行：标签审核通过后发布产品问答，让用户看清是什么、不是什么。",
      "场景切入：以办公室五分钟、普通佐餐和朋友小聚展示可复现日常；情绪表达不转化为疗效承诺。",
      "试饮验证：小规模招募真实反馈，赠饮与合作显著披露，不以正面评价换权益。",
      "渠道分工：小红书搜索与收藏、抖音短片触达、公众号完整承接、视频号问答分享；微博仅提供补充素材。",
      "建议预算合计 300,000 元：内容制作 90,000 元、创作者合作 105,000 元、媒体小额测试 60,000 元、试饮执行 30,000 元、合规及机动 15,000 元。未询价、未购买资源，执行前审批。",
      "先以阶段数据验证内容理解与有效点击，再讨论追加投入；不以规划 KPI 承诺实际结果。",
    ],
    rhythm: [
      "D1—D5 预热：核验标签、搭建归因、发布第一条场景笔记与补充话题。",
      "D6—D10 引爆：上线主短片、公众号承接页与标签笔记。",
      "D11—D24 扩散：产品问答、试饮脚本及视频号内容；活动资源未落实则不招募。",
      "D25—D30 沉淀：汇总真实问题，核对平台数据、订单与退款，形成下阶段假设。",
    ],
    risks: [
      "低糖资格、原料、规格、售价和库存待品牌确认。",
      "素材、达人合作及试饮权益尚未获得授权与审批。",
      "未接入平台与销售后台，不得宣称投放、销量或转化已经发生。",
    ],
  };
  solution.creatives = [
    {
      id: `${projectId}-creative-1`,
      name: "今天，给自己放个气",
      explanation:
        "将开盖声与午后五分钟连接，呈现普通工作间隙；“放个气”是生活化表达，不是减压疗效。",
      platforms: ["小红书", "抖音", "微博"],
      format: "25 秒场景短片 / 工位图文 / 短话题",
      audience: exampleBrief.audience,
      example:
        "放下手机，给杯子留一个位置。开盖、倒杯、看窗外，最后回到下一件事。",
      expected:
        "规划目的：建立开盖与午后场景联想，观察播放、收藏和真实评论；尚未采集。",
      risk: "不得暗示缓解焦虑或恢复精力；办公画面不得泄露隐私；配乐与肖像需授权。",
    },
    {
      id: `${projectId}-creative-2`,
      name: "东方植物的轻盈一刻",
      explanation:
        "用可读标签、真实包装和倒杯画面解释产品信息；轻盈仅指画面与生活节奏，不指减重。",
      platforms: ["小红书", "微信公众号", "视频号"],
      format: "标签信息卡 / 文章问答 / 40 秒产品短片",
      audience: exampleBrief.audience,
      example:
        "先看配料，再看每 100 毫升营养标示；低糖不等于零糖，东方植物不等于健康功效。",
      expected:
        "规划目的：降低概念误解，观察信息卡收藏与有效产品提问；不预设认知提升比例。",
      risk: "未取得正式配料与营养标签不得填数字；不得放入与真实配方不符的植物素材。",
    },
    {
      id: `${projectId}-creative-3`,
      name: "办公室里的自然补给站",
      explanation:
        "以小规模自愿试饮记录真实口味差异，把抽象推荐转为可验证的个人选择。",
      platforms: ["小红书", "视频号", "微博"],
      format: "试饮邀请笔记 / 45 秒现场记录 / 开放提问",
      audience: "目标人群中的办公室团队；场地与参与资格待确认。",
      example:
        "先看标签，再试一口；喜欢、不喜欢、不评价都可以。赠饮不绑定关注、发帖或好评。",
      expected:
        "规划目的：收集有效试饮申请与匿名口味问题，为后续选题提供线索；未招募、未执行。",
      risk: "场地、名额、卫生与隐私规则先确认；显著披露赠饮，另行取得肖像许可。",
    },
  ];
  solution.matrix = [
    {
      platform: "小红书",
      role: "场景搜索与标签收藏",
      format: "工位日常 / 标签解读 / 试饮邀约笔记",
      quantity: 3,
      objective: "规划 3 条待审核；观察收藏及有效提问。",
    },
    {
      platform: "抖音",
      role: "短片触达与产品理解",
      format: "25 秒场景片 / 35 秒问答片",
      quantity: 2,
      objective: "规划 2 条待审核；观察播放、完播及入口点击。",
    },
    {
      platform: "微信公众号",
      role: "完整产品事实承接",
      format: "上市文章完整提纲",
      quantity: 1,
      objective: "规划 1 篇提纲待扩写；承接标签、官方链接与规则。",
    },
    {
      platform: "视频号",
      role: "问答分享与可信试饮记录",
      format: "45 秒试饮记录 / 40 秒问答",
      quantity: 2,
      objective: "规划 2 条待审核；活动未执行不得冒充现场。",
    },
    {
      platform: "微博",
      role: "补充话题素材，非已确认投放渠道",
      format: "午后话题 / 标签信息卡 / 偏好提问",
      quantity: 3,
      objective: "附件要求的 3 条补充草案，正式发布与预算待确认。",
    },
  ];
  solution.timeline = [
    {
      phase: "预热期",
      time: "D1—D5（相对项目创建日）",
      goal: "完成事实、素材与数据准备，提出午后场景。",
      tasks: [
        "核验标签、低糖资格、规格、售价及库存。",
        "确认内容与合作披露、音乐图片字体授权。",
        "建立渠道编码与订单归因测试；规划首条工位笔记 D3、补充微博 D5 发布前审核。",
      ],
      platforms: ["小红书", "微博（补充，待确认）"],
      owner: "品牌负责人 / 法务 / 数据负责人（待分配）",
      deliverables: "产品事实表、审核清单、归因字典、首条笔记及话题草案。",
      metrics: "计划检查标签、链接与埋点完整性；实际状态未采集。",
    },
    {
      phase: "引爆期",
      time: "D6—D10",
      goal: "解释产品与核心主张，引导可核验信息访问。",
      tasks: [
        "D7 发布主短片，D8 公众号，D9 标签笔记，均以审核通过为前提。",
        "先做小额素材测试，核对点击而非按曝光直接归因销售。",
        "记录产品问题及误解，出现低糖或功效误读及时修订。",
      ],
      platforms: ["小红书", "抖音", "微信公众号"],
      owner: "内容负责人 / 渠道负责人（待分配）",
      deliverables: "主短片、上市文章、标签笔记及发布审核记录（计划）。",
      metrics: "规划跟踪曝光、播放、收藏、有效点击；当前未采集。",
    },
    {
      phase: "扩散期",
      time: "D11—D24",
      goal: "以问答和自愿试饮验证场景，不伪造口碑。",
      tasks: [
        "D13 抖音问答、D14 微博信息卡、D16 视频号试饮脚本、D17 小红书试饮邀约。",
        "D24 视频号产品问答；资源未确认则将试饮内容延后，不虚构活动。",
        "记录赠饮披露、真实申请及负面反馈；不得好评换权益。",
      ],
      platforms: ["小红书", "抖音", "视频号", "微博（补充，待确认）"],
      owner: "合作负责人 / 活动负责人（待分配）",
      deliverables: "试饮规则、授权文件、问答内容、匿名反馈台账（计划）。",
      metrics: "规划跟踪有效申请、实际领取、问答分享与入口点击；当前未采集。",
    },
    {
      phase: "沉淀期",
      time: "D25—D30",
      goal: "整理可追溯内容与数据口径，明确下一轮验证问题。",
      tasks: [
        "D25 发布补充偏好提问（渠道确认后）。",
        "按平台导出原始数据；核对付费订单、退款、跨渠道重复与归因窗口。",
        "分别列出已采集、缺失、无法归因数据；归档事实与审核版本，不把缺失记作 0。",
      ],
      platforms: [
        "小红书",
        "抖音",
        "微信公众号",
        "视频号",
        "微博（补充，待确认）",
      ],
      owner: "数据负责人 / 品牌负责人（待分配）",
      deliverables:
        "分平台复盘表、归因核对表、未决问题与下一轮测试建议（计划）。",
      metrics: "与规划目标对照，禁止将模板分数或未采集指标作为营销成果。",
    },
  ];
  const kpiRows = [
    [
      "总曝光目标",
      "规划 1,000,000 次，待预算与渠道确认",
      "各平台后台曝光次数求和；跨平台未去重，只表示次数而非人数",
      "各平台官方后台曝光报表",
    ],
    [
      "小红书收藏目标",
      "规划 600 次",
      "活动内容收藏增量汇总，记录删除与统计时点，不将收藏人数等同购买人数",
      "小红书内容后台",
    ],
    [
      "抖音播放目标",
      "规划 300,000 次",
      "2 条视频后台播放次数之和；注明平台播放定义，不等于独立观看人数",
      "抖音创作者 / 企业后台",
    ],
    [
      "互动率目标",
      "规划 ≥ 3%，按平台分别计算",
      "同平台（点赞 + 评论 + 收藏 + 分享）/ 同期曝光 × 100%；缺曝光分母则标不可计算，不混用播放口径",
      "各平台同周期内容明细",
    ],
    [
      "进店点击目标",
      "规划 5,000 次有效点击",
      "经同意采集的官方链接有效点击，过滤机器人及重复事件；去重人数单列",
      "渠道编码链接 / 商城分析后台",
    ],
    [
      "试饮申请量",
      "规划 300 份有效申请，活动资源确认后启用",
      "符合公开规则且自愿提交的申请去重计数；领取量另计，不以评论数替代",
      "活动报名台账（尚未上线）",
    ],
    [
      "销售转化目标",
      "规划 200 笔归因净支付订单；不承诺 ROI",
      "活动编码、末次有效点击 7 天窗口（建议，待确认），订单号去重，扣除取消与全额退款；净订单/有效访客转化率另列",
      "商城订单 / 退款明细与授权归因记录",
    ],
    [
      "粉丝增长目标",
      "规划净增 1,000，分平台记录",
      "期末粉丝数 - 期初粉丝数；自然与活动贡献未识别时不归功投放，不跨平台去重称人数",
      "各平台账号后台",
    ],
    [
      "内容发布数量",
      "规划 11 条：重点平台 8 条 + 微博补充 3 条（待确认）；均未发布",
      "审核通过且有真实发布链接的唯一内容计数；提纲需扩写后发布，草稿和重发不重复计数",
      "发布台账 / 平台链接及审核记录",
    ],
  ];
  solution.kpis = kpiRows.map(([name, target, formula, source]) => ({
    name,
    target,
    formula,
    source: `${source}（尚未接入，示例不提供实绩）`,
    frequency:
      name === "销售转化目标"
        ? "每日对账；结项及退款观察期后复核"
        : "每周一次；D30 结项复核",
    current: "未采集",
  }));
  solution.compliance = [
    {
      severity: "高",
      area: "低糖与标签",
      issue: "低糖资格、营养标签与整瓶糖含量尚未核验；不能称零糖或虚填数字。",
      suggestion:
        "取得正式标签并按适用法规核对；所有内容保留“低糖不等于零糖”；无法证实则删除低糖声称并暂停定稿。",
      resolved: false,
    },
    {
      severity: "高",
      area: "健康功效",
      issue: "东方植物、轻盈与“放个气”可能被误读为养生、减脂或情绪治疗。",
      suggestion:
        "不声称减肥、排毒、控糖、助眠或缓解焦虑；不使用医疗或身材前后对比，不把植物故事当成疗效证据。",
      resolved: false,
    },
    {
      severity: "高",
      area: "商业合作与激励披露",
      issue: "创作者合作与试饮赠品的商业关系尚待确认。",
      suggestion:
        "按平台规则显著标明广告、合作、免费提供；不得伪装素人推荐，不以好评、关注、发帖换取赠饮，不隐去负面反馈。",
      resolved: false,
    },
    {
      severity: "高",
      area: "素材版权与肖像",
      issue: "音乐、图片、字体、办公场景和人物授权未取得。",
      suggestion:
        "使用原创或合法商用素材并留档；肖像与场地单独授权；拍摄前移除机密信息、第三方商标及无关个人数据。",
      resolved: false,
    },
    {
      severity: "高",
      area: "活动与隐私",
      issue: "试饮城市、名额、库存、卫生及个人信息处理规则尚未落实。",
      suggestion:
        "公开真实起止时间、资格、数量和取消规则后再报名；最小化采集，告知用途、保存期限及删除途径，禁止默认营销授权。",
      resolved: false,
    },
    {
      severity: "高",
      area: "转化归因",
      issue: "平台后台和订单系统未连接，规划目标不能作为实际结果。",
      suggestion:
        "先约定链接编码、7 天末次点击建议窗口、去重、退款与自然流量口径；不能识别则标无法归因，禁止计算虚假 ROI。",
      resolved: false,
    },
    {
      severity: "中",
      area: "微博与预算边界",
      issue:
        "微博不在重点平台选择中，附件仅要求补充素材；30 万元资源尚未审批。",
      suggestion:
        "3 条微博作为待确认补充，不自动追加投放；内容、合作、媒体、活动与机动预算合计 30 万元，询价与审批后执行。",
      resolved: false,
    },
  ];
  solution.quality = {
    score: 60,
    summary:
      "本地检查 3/5 项通过，60 分仅作模板检查摘要，不是市场效果、合规通过率或人工审核分。11 条内容均待审核，实绩全部未采集。",
    checks: [
      { name: "模块完整性", passed: true, detail: "12 个输出模块均有内容。" },
      {
        name: "内容数量",
        passed: true,
        detail:
          "小红书 3、抖音 2、公众号提纲 1、视频号 2、微博补充 3，共 11 条。",
      },
      {
        name: "效果数据边界",
        passed: true,
        detail:
          "所有 KPI 是规划目标，current 均为未采集；无投放、销售、导出或真人审核声明。",
      },
      {
        name: "产品事实审核",
        passed: false,
        detail: "标签、原料、售价、规格、渠道与库存待品牌核验。",
      },
      {
        name: "商业执行审核",
        passed: false,
        detail: "授权、合作披露、活动规则、预算、归因与微博渠道待确认。",
      },
    ],
  };
  return solution;
}

export function seedProjects(): Project[] {
  const brief = structuredClone(exampleBrief);
  const djiCase: Project = {
    id: "case-dji-osmo-360-2026",
    brief: structuredClone(djiBrief),
    status: "待审核",
    createdAt: "2026-10-18T09:00:00+08:00",
    updatedAt: "2026-10-18T09:00:00+08:00",
    model: MOCK_MODEL,
    isCase: true,
    favorite: false,
    isExample: true,
    reviewedModules: [],
    solution: buildSolution(djiBrief, "case-dji-osmo-360-2026", "2026-10-18T09:00:00+08:00"),
    steps: newSteps().map((step) => ({
      ...step,
      status: "success",
      attempts: 0,
      startedAt: "2026-10-18T09:00:00+08:00",
      finishedAt: "2026-10-18T09:00:00+08:00",
    })),
  };
  return [
    {
      id: "case-shanye-2026",
      brief,
      status: "待审核",
      createdAt: SAMPLE_DATE,
      updatedAt: SAMPLE_DATE,
      model: MOCK_MODEL,
      isCase: true,
      favorite: true,
      isExample: true,
      reviewedModules: [],
      solution: exampleSolution("case-shanye-2026", SAMPLE_DATE),
      steps: newSteps().map((step) => ({
        ...step,
        status: "success",
        attempts: 0,
        startedAt: SAMPLE_DATE,
        finishedAt: SAMPLE_DATE,
      })),
    },
    {
      id: "draft-shanye-tasting-2026",
      brief: {
        ...structuredClone(exampleBrief),
        name: "山野气泡茶办公室试饮筹备草稿",
        budget: 60000,
        duration: 14,
        goals: ["试饮方案筹备"],
        platforms: ["小红书", "视频号"],
        background:
          "示例筹备草稿，尚未生成方案。拟确认办公室试饮场地、标签、预算及隐私规则，无实际报名、投放或销售数据。",
      },
      status: "草稿",
      createdAt: SAMPLE_DATE,
      updatedAt: SAMPLE_DATE,
      model: MOCK_MODEL,
      isCase: false,
      favorite: false,
      isExample: true,
      reviewedModules: [],
      solution: {},
      steps: newSteps(),
    },
    djiCase,
  ];
}

export function seedLogs(projects: Project[]): UsageLog[] {
  return projects
    .filter((project) => project.isExample)
    .flatMap((project) => [
      {
        id: `${project.id}-seed-log`,
        projectId: project.id,
        projectName: project.brief.name,
        time: project.createdAt,
        action: "载入示例项目",
        model: MOCK_MODEL,
        result:
          "本地示例数据载入；未调用模型，未导出，未完成人工审核或发布，营销效果未采集。",
        actor: "示例演示",
        success: true,
        isExample: true,
      },
      ...(project.isCase
        ? [
            {
              id: `${project.id}-seed-solution-log`,
              projectId: project.id,
              projectName: project.brief.name,
              time: project.updatedAt,
              action: "载入示例方案",
              model: MOCK_MODEL,
              result:
                "载入预置的 12 模块方案与 11 条待审核草案；不是实际模型请求、人工审核、投放或导出记录。",
              actor: "示例演示",
              success: true,
              isExample: true,
            },
          ]
        : []),
    ]);
}
