import { db } from '@/lib/db';
import { apiPlans, apiKeys, apiUsage } from '@/lib/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * 生成 API Key
 */
function generateApiKey(): string {
  const prefix = 'fp'; // FreePic prefix
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${randomPart}`;
}

/**
 * 获取或创建默认免费套餐
 */
export async function getDefaultPlan() {
  let plan = await db.query.apiPlans.findFirst({
    where: eq(apiPlans.slug, 'free'),
  });

  if (!plan) {
    const id = uuidv4();
    await db.insert(apiPlans).values({
      id,
      name: 'Free',
      slug: 'free',
      description: '免费套餐，适合测试',
      dailyLimit: 100,
      monthlyLimit: 3000,
      price: 0,
      features: ['search', 'browse'],
      isActive: true,
    });
    plan = await db.query.apiPlans.findFirst({
      where: eq(apiPlans.slug, 'free'),
    });
  }

  return plan;
}

/**
 * 为用户创建 API Key
 */
export async function createApiKey(
  userId: string,
  options: {
    name?: string;
    description?: string;
    planId?: string;
    expiresAt?: Date;
  } = {}
) {
  const plan = options.planId
    ? await db.query.apiPlans.findFirst({ where: eq(apiPlans.id, options.planId) })
    : await getDefaultPlan();

  const id = uuidv4();
  const key = generateApiKey();

  await db.insert(apiKeys).values({
    id,
    userId,
    planId: plan?.id,
    key,
    name: options.name || 'Default',
    description: options.description,
    isActive: true,
    expiresAt: options.expiresAt,
  });

  return {
    id,
    key,
    name: options.name || 'Default',
    plan: plan?.name,
    dailyLimit: plan?.dailyLimit,
    createdAt: new Date(),
  };
}

/**
 * 验证 API Key
 */
export async function verifyApiKey(key: string): Promise<{
  valid: boolean;
  apiKey?: typeof apiKeys.$inferSelect;
  plan?: typeof apiPlans.$inferSelect;
  reason?: string;
}> {
  const apiKeyRecord = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)),
  });

  if (!apiKeyRecord) {
    return { valid: false, reason: 'Invalid API key' };
  }

  // 检查是否过期
  if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
    return { valid: false, reason: 'API key expired' };
  }

  // 获取套餐信息
  const plan = apiKeyRecord.planId
    ? await db.query.apiPlans.findFirst({
        where: eq(apiPlans.id, apiKeyRecord.planId),
      })
    : await getDefaultPlan();

  // 更新最后使用时间
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKeyRecord.id));

  return {
    valid: true,
    apiKey: apiKeyRecord,
    plan: plan || undefined,
  };
}

/**
 * 获取用户的所有 API Keys
 */
export async function getUserApiKeys(userId: string) {
  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    orderBy: [desc(apiKeys.createdAt)],
  });

  // 获取套餐信息
  const plans = await db.query.apiPlans.findMany();
  const planMap = new Map(plans.map((p) => [p.id, p]));

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    description: key.description,
    key: key.key.substring(0, 12) + '...' + key.key.substring(key.key.length - 4),
    fullKey: key.key, // 仅在创建时返回完整key
    plan: planMap.get(key.planId || '')?.name || 'Free',
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
  }));
}

/**
 * 禁用 API Key
 */
export async function revokeApiKey(keyId: string, userId: string) {
  const result = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

  return result;
}

/**
 * 记录 API 使用量
 */
export async function recordApiUsage(
  apiKeyId: string,
  options: {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    cost?: number;
  }
) {
  const id = uuidv4();
  await db.insert(apiUsage).values({
    id,
    apiKeyId,
    date: new Date(),
    endpoint: options.endpoint,
    method: options.method,
    statusCode: options.statusCode,
    responseTime: options.responseTime,
    cost: options.cost || 0,
  });
}

/**
 * 获取 API Key 今日使用量
 */
export async function getTodayUsage(apiKeyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await db
    .select({
      count: apiUsage.id,
      totalCost: apiUsage.cost,
    })
    .from(apiUsage)
    .where(and(eq(apiUsage.apiKeyId, apiKeyId), gte(apiUsage.date, today)));

  return {
    requests: usage.length,
    cost: usage.reduce((sum, r) => sum + (r.totalCost || 0), 0),
  };
}

/**
 * 检查 API Key 是否超过限额
 */
export async function checkRateLimit(
  apiKeyId: string,
  dailyLimit: number
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const usage = await getTodayUsage(apiKeyId);
  const remaining = dailyLimit - usage.requests;

  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    resetAt,
  };
}

/**
 * 获取所有可用套餐
 */
export async function getAvailablePlans() {
  return db.query.apiPlans.findMany({
    where: eq(apiPlans.isActive, true),
    orderBy: [apiPlans.price],
  });
}

/**
 * API 速率限制和用量追踪中间件
 */
import { NextRequest, NextResponse } from 'next/server';

export interface ApiEndpointConfig {
  path: string;
  method: string;
  cost: number;
  requiresAuth: boolean;
  publicAccess: boolean;
}

// 端点配置
const ENDPOINT_CONFIGS: Record<string, { cost: number; publicAccess: boolean }> = {
  '/api/images': { cost: 1, publicAccess: true },
  '/api/search': { cost: 1, publicAccess: true },
  '/api/tags': { cost: 1, publicAccess: true },
  '/api/anp/search': { cost: 1, publicAccess: false },
  '/api/anp/images': { cost: 1, publicAccess: false },
  '/api/anp/upload': { cost: 5, publicAccess: false },
};

function getEndpointConfig(pathname: string) {
  if (ENDPOINT_CONFIGS[pathname]) {
    return ENDPOINT_CONFIGS[pathname];
  }
  for (const [key, config] of Object.entries(ENDPOINT_CONFIGS)) {
    if (pathname.startsWith(key)) {
      return config;
    }
  }
  return { cost: 1, publicAccess: true };
}

export async function withApiRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const endpointConfig = getEndpointConfig(pathname);

  const apiKey = request.headers.get('x-api-key') || request.headers.get('fp-api-key');

  if (apiKey) {
    const verification = await verifyApiKey(apiKey);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason, code: 'INVALID_KEY' },
        { status: 401 }
      );
    }

    const plan = verification.plan;
    const dailyLimit = plan?.dailyLimit || 100;

    const rateLimit = await checkRateLimit(verification.apiKey!.id, dailyLimit);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          remaining: 0,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(dailyLimit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    const response = await handler(request);

    const responseTime = Date.now() - startTime;
    await recordApiUsage(verification.apiKey!.id, {
      endpoint: pathname,
      method,
      statusCode: response.status,
      responseTime,
      cost: endpointConfig.cost,
    });

    response.headers.set('X-RateLimit-Limit', String(dailyLimit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining - 1));
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    return response;
  }

  return handler(request);
}
