import type { Brief } from "./domain";
import { downloadFile } from "./export";

export interface DeckSlide {
  title: string;
  eyebrow: string;
  bullets: string[];
  note?: string;
}

const money = (value: number) =>
  value >= 10000 ? `${(value / 10000).toFixed(value % 10000 ? 1 : 0)} 万元` : `${value.toLocaleString("zh-CN")} 元`;

export function buildDeckSpec(brief: Brief): DeckSlide[] {
  const platforms = brief.platforms.length ? brief.platforms.join("、") : "待确认";
  return [
    {
      eyebrow: "MARKETING PROPOSAL",
      title: brief.name || "整合营销方案",
      bullets: [
        `${brief.brand || "品牌待确认"} · ${brief.product || "产品待确认"}`,
        `${brief.duration || "待确认"} 天整合传播 · ${money(brief.budget || 0)}`,
        "演示版策略输出，目标值与市场信息仍需人工核验",
      ],
      note: "BlueMark Agent",
    },
    {
      eyebrow: "01 / EXECUTIVE BRIEF",
      title: "先解决三件事：被看见、被理解、可转化",
      bullets: [
        `传播背景：${brief.background || "待确认"}`,
        `目标人群：${brief.audience || "待确认"}`,
        `传播目标：${brief.goals.join("、") || "待确认"}`,
      ],
    },
    {
      eyebrow: "02 / AUDIENCE",
      title: "把宽泛人群还原成真实选择场景",
      bullets: [
        `核心人群：${brief.audience || "待确认"}`,
        `主要需求：${brief.needs || "通过访谈补充"}`,
        `产品理由：${brief.sellingPoints || "待确认"}`,
      ],
      note: "用户洞察为策划假设，需通过访谈、搜索和试饮验证。",
    },
    {
      eyebrow: "03 / POSITIONING",
      title: "用可信信息建立第一次尝试理由",
      bullets: [
        `产品基础：${brief.product || "待确认"}`,
        `品牌语气：${brief.tone || "待确认"}`,
        `内容原则：事实与规划分开，健康功效与最终结果不作承诺`,
      ],
    },
    {
      eyebrow: "04 / CHANNEL STRATEGY",
      title: "按平台分工，不把同一句话复制四遍",
      bullets: brief.platforms.length
        ? brief.platforms.map((platform, index) => {
            const roles: Record<string, string> = {
              "小红书": "场景笔记、标签解读、试饮邀约；观察收藏和有效提问",
              "抖音": "镜头化产品演示与场景短片；观察完播和真实评论",
              "微信公众号": "完整解释、FAQ 与购买路径；观察有效阅读和点击",
              "视频号": "40 秒产品短片与真实试饮记录；观察完播和分享",
              "微博": "短话题和补充素材；是否投放待确认",
            };
            return `${platform}：${roles[platform] || `按平台特点拆分内容角色，第 ${index + 1} 项待细化`}`;
          })
        : [`待确认渠道：${platforms}`],
    },
    {
      eyebrow: "05 / 30-DAY RHYTHM",
      title: "先验证理解，再放大场景，最后承接转化",
      bullets: [
        "第 1 周｜信息校准：确认标签、价格、渠道与素材授权",
        "第 2 周｜场景启动：小红书 + 抖音建立午后饮用联想",
        "第 3 周｜信任加深：公众号解释 + 视频号真实试饮记录",
        "第 4 周｜转化承接：统一购买入口，复盘素材与渠道质量",
      ],
    },
    {
      eyebrow: "06 / DELIVERABLES",
      title: "交付不是一堆文案，而是可审、可改、可追踪的资产",
      bullets: [
        "策略 Brief 与决策依据",
        "渠道内容矩阵与发布节奏",
        "小红书、抖音、公众号、视频号内容草案",
        "合规检查表与 KPI 口径",
        "可编辑 PPTX 汇报稿",
      ],
    },
    {
      eyebrow: "07 / MEASUREMENT",
      title: "先定义口径，再讨论目标",
      bullets: [
        `总预算：${money(brief.budget || 0)}；周期：${brief.duration || "待确认"} 天`,
        "认知：去重曝光、有效播放、搜索增量",
        "互动：收藏、有效评论、分享；删除无意义互动",
        "转化：去重订单与约定归因窗口；跨平台曝光不得相加",
      ],
      note: "所有目标值需在投放前根据历史数据和真实渠道反馈校准。",
    },
  ];
}

export async function downloadMarketingDeck(brief: Brief) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "BlueMark";
  pptx.subject = brief.name || "整合营销方案";
  pptx.title = brief.name || "整合营销方案";
  pptx.company = "BlueMark";
  pptx.theme = {
    headFontFace: "Microsoft YaHei",
    bodyFontFace: "Microsoft YaHei",
  };

  const slides = buildDeckSpec(brief);
  slides.forEach((item, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: index === 0 ? "101A32" : "F6F8FC" };

    if (index === 0) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        fill: { color: "101A32" },
        line: { color: "101A32" },
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 9.45,
        y: 0,
        w: 3.883,
        h: 7.5,
        fill: { color: "245BFA", transparency: 5 },
        line: { color: "245BFA", transparency: 100 },
      });
      slide.addText(item.eyebrow, {
        x: 0.8,
        y: 0.65,
        w: 5.2,
        h: 0.25,
        fontFace: "Aptos",
        fontSize: 10,
        bold: true,
        color: "87A9FF",
        charSpacing: 2.4,
      });
      slide.addText(item.title, {
        x: 0.8,
        y: 1.45,
        w: 8.1,
        h: 1.45,
        fontFace: "Microsoft YaHei",
        fontSize: 31,
        bold: true,
        color: "FFFFFF",
        breakLine: false,
        valign: "middle",
      });
      slide.addText(
        item.bullets.map((text) => ({ text, options: { bullet: { indent: 12 }, breakLine: true } })),
        {
          x: 0.95,
          y: 3.55,
          w: 7.6,
          h: 1.75,
          fontFace: "Microsoft YaHei",
          fontSize: 13,
          color: "DDE7FF",
          breakLine: false,
          paraSpaceAfter: 9,
        },
      );
      slide.addText("BLUEMARK AGENT", {
        x: 10.05,
        y: 6.65,
        w: 2.3,
        h: 0.3,
        fontFace: "Aptos",
        fontSize: 10,
        bold: true,
        color: "FFFFFF",
        align: "right",
      });
      return;
    }

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.12,
      fill: { color: "245BFA" },
      line: { color: "245BFA" },
    });
    slide.addText(item.eyebrow, {
      x: 0.78,
      y: 0.58,
      w: 3.3,
      h: 0.28,
      fontFace: "Aptos",
      fontSize: 9,
      bold: true,
      color: "245BFA",
      charSpacing: 1.6,
    });
    slide.addText(item.title, {
      x: 0.78,
      y: 1.08,
      w: 11.6,
      h: 0.72,
      fontFace: "Microsoft YaHei",
      fontSize: 24,
      bold: true,
      color: "17243B",
      breakLine: false,
      fit: "shrink",
    });
    slide.addText(
      item.bullets.map((text) => ({ text, options: { bullet: { indent: 14 }, breakLine: true } })),
      {
        x: 0.95,
        y: 2.15,
        w: 11.3,
        h: item.note ? 3.45 : 4.1,
        fontFace: "Microsoft YaHei",
        fontSize: 14,
        color: "435269",
        breakLine: false,
        paraSpaceAfter: 12,
        valign: "middle",
        fit: "shrink",
      },
    );
    if (item.note) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.82,
        y: 5.85,
        w: 11.7,
        h: 0.72,
        rectRadius: 0.06,
        fill: { color: "EAF0FF" },
        line: { color: "D5E1FF" },
      });
      slide.addText(item.note, {
        x: 1.04,
        y: 6.02,
        w: 11.2,
        h: 0.35,
        fontFace: "Microsoft YaHei",
        fontSize: 10.5,
        color: "41619F",
        fit: "shrink",
      });
    }
    slide.addText(`${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`, {
      x: 11.65,
      y: 7.02,
      w: 0.85,
      h: 0.2,
      fontFace: "Aptos",
      fontSize: 8,
      color: "8795AA",
      align: "right",
    });
  });

  await pptx.writeFile({ fileName: `${brief.name || "BlueMark 整合营销方案"}.pptx` });
}

export function downloadBriefMarkdown(brief: Brief) {
  const text = `# ${brief.name || "执行 Brief"}\n\n> 本文件由 BlueMark Agent 生成；待确认信息不得作为已核实事实使用。\n\n## 项目\n\n- 品牌：${brief.brand || "待确认"}\n- 产品：${brief.product || "待确认"}\n- 人群：${brief.audience || "待确认"}\n- 目标：${brief.goals.join("、") || "待确认"}\n- 渠道：${brief.platforms.join("、") || "待确认"}\n- 预算：${brief.budget || "待确认"}\n- 周期：${brief.duration || "待确认"} 天\n\n## 项目背景\n\n${brief.background || "待确认"}\n\n## 产品卖点\n\n${brief.sellingPoints || "待确认"}\n\n## 执行约束\n\n${brief.requirements || "无额外约束"}\n`;
  downloadFile(`${brief.name || "执行 Brief"}.md`, text, "text/markdown;charset=utf-8");
}

export function downloadContentMatrix(brief: Brief) {
  const rows = [
    ["平台", "内容角色", "建议数量", "核心目标", "状态"],
    ...brief.platforms.map((platform) => [
      platform,
      "按平台拆分内容，不复用同一文案",
      platform === "小红书" ? "3" : "2",
      "建立场景理解并观察有效互动",
      "待人工审核",
    ]),
  ];
  const csv = `\ufeff${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")}`;
  downloadFile(`${brief.name || "平台内容矩阵"}.csv`, csv, "text/csv;charset=utf-8");
}
