import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
    PORT: z.string().default('4242').transform(Number),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PIN_HASH: z.string().min(1, 'PIN_HASH is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRY: z.string().default('7d'),
    CLOUDFLARE_TUNNEL_TOKEN: z.string().optional(),
    OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('llama3'),
});

const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    devCommand: z.string(),
    devPort: z.number(),
    color: z.string().optional(),
});

const configSchema = z.object({
    projects: z.array(projectSchema).default([]),
    allowedPaths: z.array(z.string()).default([]),
    tunnel: z.object({
        mode: z.enum(['quick', 'named']).default('quick'),
        autoRestart: z.boolean().default(true),
        restartDelayMs: z.number().default(3000),
        maxRestarts: z.number().default(10),
    }).default({}),
});

export const getEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        process.exit(1);
    }
    return parsed.data;
};

export const getConfig = () => {
    const configPath = path.resolve(process.cwd(), '../rove.config.json');
    if (!fs.existsSync(configPath)) {
        console.warn('⚠️ rove.config.json not found, using defaults.');
        return configSchema.parse({});
    }

    try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const json = JSON.parse(fileContent);
        return configSchema.parse(json);
    } catch (error) {
        console.error('❌ Invalid rove.config.json:', error);
        process.exit(1);
    }
};

export const env = getEnv();
export const config = getConfig();
