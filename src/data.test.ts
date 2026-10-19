// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMockSolution,
  exampleBrief,
  seedLogs,
  seedProjects,
} from "./data";
import { emptyBrief, STEP_KEYS } from "./domain";
import type { Brief, Solution } from "./domain";
import { validateStepOutput } from "./engine";

afterEach(() => vi.useRealTimers());

const moduleKeys = STEP_KEYS.filter((key) => key !== "validate");
const counts = { 小红书: 3, 抖音: 2, 微信公众号: 1, 视频号: 2, 微博: 3 };

function assertContract(solution: Solution) {
  expect(Object.keys(solution).sort()).toEqual([...moduleKeys].sort());
  for (const key of moduleKeys) {
    expect(() =>
      validateStepOutput(key, { [key]: solution[key] }),
    ).not.toThrow();
  }
}

describe("complete example case", () => {
  it("retains the attachment brief and distinguishes priority channels from supplemental Weibo", () => {
    expect(exampleBrief).toMatchObject({
      name: "山野气泡茶新品上市整合营销方案",
      brand: "山野气泡茶",
      product: "低糖东方植物气泡饮",
      budget: 300000,
      duration: 30,
      goals: ["新品上市", "社交媒体种草", "首月转化"],
      platforms: ["小红书", "抖音", "微信公众号", "视频号"],
    });
    for (const value of Object.values(exampleBrief)) {
      expect(
        typeof value === "string" ? value.trim().length : value,
      ).toBeTruthy();
    }
    expect(exampleBrief.requirements).toContain("微博补充");
  });

  it("provides all 12 schema-valid modules, 3 creatives, 4 stages and 9 KPIs", () => {
    const project = seedProjects().find((item) => item.isCase)!;
    assertContract(project.solution);
    expect(project.solution.creatives?.map((item) => item.name)).toEqual([
      "今天，给自己放个气",
      "东方植物的轻盈一刻",
      "办公室里的自然补给站",
    ]);
    expect(project.solution.timeline?.map((item) => item.phase)).toEqual([
      "预热期",
      "引爆期",
      "扩散期",
      "沉淀期",
    ]);
    expect(project.solution.kpis).toHaveLength(9);
    expect(
      project.solution.matrix?.reduce((sum, item) => sum + item.quantity, 0),
    ).toBe(11);
  });

  it("contains exactly 11 substantial pieces with complete copy/scripts, ownership and pending review", () => {
    const project = seedProjects()[0];
    expect(project.solution.contents).toHaveLength(11);
    for (const [platform, quantity] of Object.entries(counts)) {
      expect(
        project.solution.contents!.filter((item) => item.platform === platform),
      ).toHaveLength(quantity);
      expect(
        project.solution.matrix!.find((item) => item.platform === platform)
          ?.quantity,
      ).toBe(quantity);
    }
    expect(
      new Set(project.solution.contents!.map((item) => item.id)).size,
    ).toBe(11);
    for (const item of project.solution.contents!) {
      expect(item).toMatchObject({
        projectId: project.id,
        review: "待审核",
        needsEdit: true,
        createdAt: project.createdAt,
        updatedAt: project.createdAt,
      });
      expect(item.body.length).toBeGreaterThan(
        item.platform === "微博" ? 180 : 350,
      );
      expect(item.body).toContain("低糖");
      expect(item.title.trim()).not.toBe("");
      expect(item.goal.trim()).not.toBe("");
      expect(item.owner.trim()).not.toBe("");
    }
    expect(
      project.solution.contents!.find((item) => item.platform === "微信公众号")
        ?.type,
    ).toContain("提纲");
    for (const item of project.solution.contents!.filter(
      (item) => item.platform === "抖音" || item.platform === "视频号",
    )) {
      expect(item.body).toMatch(/0—\d+ 秒/);
      expect(item.body).toContain("秒");
    }
  });

  it("schedules sample content relative to its project creation, not hardcoded past campaign dates", () => {
    const project = seedProjects()[0];
    for (const item of project.solution.contents!) {
      const elapsed =
        Date.parse(item.publishAt) - Date.parse(project.createdAt);
      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(project.brief.duration * 86400000);
      expect(Number.isFinite(elapsed)).toBe(true);
    }
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-03-02T01:00:00Z"));
    const recreated = createMockSolution(
      structuredClone(exampleBrief),
      "fresh-project",
    );
    expect(recreated.contents).toHaveLength(11);
    expect(recreated.contents![0].publishAt).toBe("2027-03-04T12:00:00+08:00");
    expect(
      recreated.contents!.every((item) => item.projectId === "fresh-project"),
    ).toBe(true);
  });

  it("never preclaims review, execution, risk resolution or measured performance", () => {
    const projects = seedProjects();
    expect(projects).toHaveLength(3);
    for (const project of projects) {
      expect(project.isExample).toBe(true);
      expect(project.reviewedModules).toEqual([]);
      expect(project.status).not.toBe("已完成");
      for (const kpi of project.solution.kpis || []) {
        expect(kpi.current).toBe("未采集");
        expect(kpi.target).toContain("规划");
        expect(kpi.source).toContain("尚未");
      }
      expect(
        project.solution.compliance?.every((item) => !item.resolved) ?? true,
      ).toBe(true);
      expect(project.steps.every((step) => step.attempts === 0)).toBe(true);
    }
    const draft = projects.find((project) => project.status === "草稿")!;
    expect(draft.solution).toEqual({});
    expect(draft.steps.every((step) => step.status === "pending")).toBe(true);
    const risks = JSON.stringify(projects[0].solution.compliance);
    for (const term of ["零糖", "健康", "激励", "版权", "隐私", "归因", "退款"])
      expect(risks).toContain(term);
  });

  it("returns independent seed objects without leaking UI edits into later seeds or the shared brief", () => {
    const projects = seedProjects();
    projects[0].brief.brand = "已编辑";
    projects[0].brief.goals.push("改动");
    projects[0].solution.contents![0].body = "已编辑";
    projects[0].solution.creatives![0].platforms.push("已编辑");
    const fresh = seedProjects();
    expect(fresh[0].brief).toEqual(exampleBrief);
    expect(fresh[0].solution.contents![0].body).not.toBe("已编辑");
    expect(fresh[0].solution.creatives![0].platforms).not.toContain("已编辑");
    expect(fresh[1].brief.goals).toEqual(["试饮方案筹备"]);
  });
});

describe("dynamic mock data", () => {
  const other: Brief = {
    name: "折光首发计划",
    brand: "折光",
    product: "便携投影仪",
    industry: "数码科技",
    background: "面向租房场景的新品发布",
    problem: "空间限制与安装疑问",
    sellingPoints: "便携设计，亮度与续航待核验",
    competitors: "同价位投影产品待研究",
    audience: "周末观影的城市租房人群",
    needs: "小空间里方便布置观影",
    goals: ["预约体验", "了解配置"],
    platforms: ["微信公众号", "微博"],
    budget: 48000,
    duration: 9,
    tone: "理性、清晰",
    requirements: "不得编造亮度、续航、售价和兼容性；不用用户肖像。",
  };

  it("substitutes brand/product/audience/budget/goals/platforms without mutating input or leaking ShanYe copy", () => {
    const before = structuredClone(other);
    const solution = createMockSolution(other, "other-project");
    assertContract(solution);
    expect(other).toEqual(before);
    const text = JSON.stringify(solution);
    for (const value of [
      other.brand,
      other.product,
      other.audience,
      "48,000",
      ...other.goals,
      other.tone,
      other.requirements,
    ])
      expect(text).toContain(value);
    for (const leaked of [
      "山野",
      "气泡",
      "试饮",
      "低糖",
      "办公室补给",
      "300,000",
      "小红书",
      "抖音",
      "视频号",
    ])
      expect(text).not.toContain(leaked);
    expect(solution.contents).toHaveLength(4);
    expect(solution.matrix?.map((item) => item.platform)).toEqual(
      other.platforms,
    );
    for (const item of solution.contents!) {
      expect(other.platforms).toContain(item.platform);
      expect(item.body).toContain("Mock");
      expect(item.body).toContain(other.brand);
      expect(item.body).toContain(other.product);
      expect(item.body).toContain(other.audience);
      expect(item.projectId).toBe("other-project");
      expect(item.review).toBe("待审核");
    }
    expect(solution.kpis!.every((item) => item.current === "未采集")).toBe(
      true,
    );
  });

  it("handles optional empty and whitespace fields without emitting invalid empty evidence or risk entries", () => {
    const brief: Brief = {
      ...emptyBrief,
      name: "新品首发",
      brand: "青禾",
      product: "桌面灯",
      audience: "居家办公人群",
      background: " ",
      problem: "",
      sellingPoints: "",
      competitors: " ",
      needs: "",
      tone: " ",
      requirements: "",
    };
    assertContract(createMockSolution(brief, "minimal-project"));
    expect(brief.problem).toBe("");
    expect(brief.requirements).toBe("");
  });

  it("uses generic templates after any example brief edit instead of silently reusing the curated case", () => {
    const edited = {
      ...structuredClone(exampleBrief),
      brand: "其他品牌",
      product: "无糖咖啡",
      audience: "夜班工作者",
      budget: 12000,
      goals: ["预约购买"],
      platforms: ["抖音"] as Brief["platforms"],
    };
    const result = createMockSolution(edited, "edited");
    expect(result.contents).toHaveLength(2);
    expect(
      result.contents!.every((item) =>
        item.title.startsWith("其他品牌｜无糖咖啡"),
      ),
    ).toBe(true);
    expect(result.positioning?.message).toContain("其他品牌");
    expect(result.positioning?.message).not.toContain("自然气");
  });

  it("keeps short campaigns within the requested duration and deduplicates selected channels", () => {
    const solution = createMockSolution(
      { ...other, duration: 1, platforms: ["微博", "微博"] },
      "short",
    );
    expect(solution.matrix).toHaveLength(1);
    expect(solution.contents).toHaveLength(3);
    for (const item of solution.contents!)
      expect(item.publishAt.slice(0, 10)).toBe(
        new Date(Date.parse(item.createdAt) + 8 * 3600000)
          .toISOString()
          .slice(0, 10),
      );
    expect(solution.timeline!.every((item) => item.time === "D1—D1")).toBe(
      true,
    );
  });
});

describe("honest sample activity", () => {
  it("logs only supplied example projects and never invents API calls, exports or human review events", () => {
    const projects = seedProjects();
    const logs = seedLogs([
      ...projects,
      { ...projects[0], id: "real", isExample: false },
    ]);
    expect(logs.length).toBeGreaterThan(0);
    expect(new Set(logs.map((item) => item.id)).size).toBe(logs.length);
    for (const log of logs) {
      expect(log).toMatchObject({
        isExample: true,
        actor: "示例演示",
        success: true,
        model: "Mock · 本地模板",
      });
      expect(projects.some((project) => project.id === log.projectId)).toBe(
        true,
      );
      expect(log.action).toMatch(/^载入示例/);
      expect(log.result).toMatch(/未调用模型|不是实际模型请求/);
      expect(log.result).toContain("导出");
      expect(Number.isFinite(Date.parse(log.time))).toBe(true);
    }
    expect(seedLogs([])).toEqual([]);
  });
});
