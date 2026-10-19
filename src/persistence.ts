import { z } from "zod";
import { briefSchema, solutionSchema } from "./engine";
import { STEP_KEYS } from "./domain";
const stepSchema = z.object({
  key: z.enum(STEP_KEYS),
  status: z.enum(["pending", "running", "success", "error"]),
  attempts: z.number().int().nonnegative(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});
const projectSchema = z.object({
  id: z.string().min(1),
  brief: briefSchema.extend({
    name: z.string(),
    brand: z.string(),
    product: z.string(),
    audience: z.string(),
    goals: z.array(z.string()),
    platforms: z.array(
      z.enum(["小红书", "抖音", "微信公众号", "视频号", "微博"]),
    ),
    budget: z.number(),
    duration: z.number(),
  }),
  status: z.enum(["草稿", "生成中", "待审核", "已完成", "已归档"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  model: z.string(),
  isCase: z.boolean(),
  favorite: z.boolean(),
  isExample: z.boolean(),
  sourceCaseId: z.string().optional(),
  reviewedModules: z.array(z.string()),
  solution: solutionSchema,
  steps: z
    .array(stepSchema)
    .length(STEP_KEYS.length)
    .refine(
      (steps) => new Set(steps.map((s) => s.key)).size === STEP_KEYS.length,
    ),
});
const logSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  time: z.string(),
  action: z.string(),
  model: z.string(),
  result: z.string(),
  actor: z.string(),
  success: z.boolean(),
  isExample: z.boolean().optional(),
});
export const persistedSchema = z.object({
  version: z.literal(1),
  projects: z.array(projectSchema),
  logs: z.array(logSchema),
  config: z.object({
    provider: z.string(),
    baseUrl: z.string(),
    apiKey: z.string(),
    model: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(1),
    timeout: z.number().positive(),
    mock: z.boolean(),
    connection: z.enum(["untested", "success", "error"]),
    lastTestAt: z.string(),
    error: z.string(),
  }),
  settings: z.object({
    workspace: z.string(),
    language: z.string(),
    defaultModel: z.string(),
    exportFormat: z.enum(["markdown", "json", "html"]),
    autoSave: z.boolean(),
  }),
  draft: z.object({
    name: z.string(),
    brand: z.string(),
    product: z.string(),
    industry: z.string(),
    background: z.string(),
    problem: z.string(),
    sellingPoints: z.string(),
    competitors: z.string(),
    audience: z.string(),
    needs: z.string(),
    goals: z.array(z.string()),
    platforms: z.array(
      z.enum(["小红书", "抖音", "微信公众号", "视频号", "微博"]),
    ),
    budget: z.number(),
    duration: z.number(),
    tone: z.string(),
    requirements: z.string(),
  }),
});
