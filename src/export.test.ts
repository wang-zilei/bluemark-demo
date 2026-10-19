// @vitest-environment node
import { describe, expect, it } from "vitest";
import { seedLogs, seedProjects } from "./data";
import type { UsageLog } from "./domain";
import { escapeHtml, projectMarkdown, serializeProject } from "./export";

function fixture() {
  const projects = seedProjects();
  const project = structuredClone(projects.find((item) => item.isExample)!);
  const included: UsageLog = {
    id: "local-log",
    projectId: project.id,
    projectName: project.brief.name,
    time: "2026-10-17T00:00:00.000Z",
    action: "修改内容",
    model: project.model,
    result: "THIS_PROJECT_LOG",
    actor: "本地用户",
    success: true,
  };
  const excluded: UsageLog = {
    ...included,
    id: "other-log",
    projectId: "other-project",
    result: "UNRELATED_PROJECT_LOG",
  };
  return {
    project,
    logs: [...seedLogs(projects), included, excluded],
    included,
  };
}

describe("project exports", () => {
  it("includes project metadata and every required Markdown section with actual project content", () => {
    const { project, logs } = fixture();
    const result = serializeProject(project, logs, "markdown");
    expect(result).toMatchObject({
      extension: "md",
      mime: "text/markdown;charset=utf-8",
    });
    expect(result.text).toBe(projectMarkdown(project, logs));
    expect(result.text).toContain(`# ${project.brief.name}`);
    for (const label of [
      "状态",
      "模型",
      "创建时间",
      "最近更新",
      "人工审核模块",
    ])
      expect(result.text).toContain(`${label}：`);
    for (const section of [
      "Brief",
      "用户洞察",
      "核心策略",
      "创意方向",
      "内容矩阵",
      "平台内容",
      "传播排期",
      "KPI",
      "风险审核",
      "使用记录",
    ]) {
      expect(result.text.split("\n")).toContain(`## ${section}`);
    }
    expect(result.text).toContain(project.brief.brand);
    expect(result.text).toContain(project.solution.audience!.persona);
    expect(result.text).toContain(project.solution.strategy!.coreMessage);
    expect(result.text).toContain(project.solution.contents![0].body);
    expect(result.text).toContain("未采集");
    expect(result.text).toContain("内置虚构示例");
    expect(result.text).toContain("THIS_PROJECT_LOG");
    expect(result.text).not.toContain("UNRELATED_PROJECT_LOG");
  });

  it("exports a parseable versioned JSON envelope without losing nested content or provenance", () => {
    const { project, logs, included } = fixture();
    project.brief.requirements = '包含 "引号"、换行\n与 <标签> 的要求';
    const original = structuredClone({ project, logs });
    const result = serializeProject(project, logs, "json");
    const decoded = JSON.parse(result.text);
    expect(result).toMatchObject({
      extension: "json",
      mime: "application/json",
    });
    expect(decoded.schemaVersion).toBe(1);
    expect(Number.isNaN(Date.parse(decoded.exportedAt))).toBe(false);
    expect(decoded.project).toEqual(project);
    expect(decoded.usageLogs).toEqual(
      logs.filter((log) => log.projectId === project.id),
    );
    expect(decoded.usageLogs).toContainEqual(included);
    expect(decoded.project.isExample).toBe(true);
    expect({ project, logs }).toEqual(original);
    expect(result.text).not.toContain("UNRELATED_PROJECT_LOG");
  });

  it("keeps incomplete projects exportable and labels ungenerated sections without inventing results", () => {
    const { project } = fixture();
    project.solution = {};
    project.reviewedModules = [];
    project.isExample = false;
    const text = projectMarkdown(project, []);
    expect(text).toContain("## 用户洞察\n\n未生成");
    expect(text).toContain("## KPI\n\n未生成");
    expect(text).toContain("人工审核模块：尚未完成");
    expect(text).toContain("目标值不代表实际效果");
    expect(text).not.toContain("内置虚构示例");
  });

  it("escapes all five HTML-sensitive characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(escapeHtml("普通中文")).toBe("普通中文");
  });

  it("escapes title, body and usage logs so HTML exports cannot break out into executable markup", () => {
    const { project, logs, included } = fixture();
    const payload = `</pre><script>alert("xss")</script><img src=x onerror='alert(1)'>&`;
    const escaped =
      "&lt;/pre&gt;&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;";
    project.brief.name = payload;
    project.solution.contents![0].body = payload;
    included.result = payload;
    const result = serializeProject(project, logs, "html");
    expect(result).toMatchObject({
      extension: "html",
      mime: "text/html;charset=utf-8",
    });
    expect(result.text).toContain("<!doctype html>");
    expect(result.text).toContain(`<title>${escaped}</title>`);
    expect(result.text).toContain(`<h1>${escaped}</h1>`);
    expect(result.text).toContain(`<p>${escaped}</p>`);
    expect(result.text).toContain("<h2>平台内容</h2>");
    expect(result.text).toContain("<h2>使用记录</h2>");
    // Title, heading, Brief name, content body and log result must all be escaped.
    expect(result.text.split(escaped)).toHaveLength(6);
    expect(result.text).not.toContain(payload);
    expect(result.text).not.toContain("<script>");
    expect(result.text).not.toContain("<img ");
    expect(result.text).not.toContain("UNRELATED_PROJECT_LOG");
  });
});
