import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
}

export const isPathAllowed = (targetPath: string): boolean => {
    const resolvedPath = path.resolve(targetPath);
    return config.allowedPaths.some((allowed) => {
        const resolvedAllowed = path.resolve(allowed);
        return resolvedPath.startsWith(resolvedAllowed);
    });
};

export const getFileTree = (dirPath: string): FileNode[] => {
    if (!isPathAllowed(dirPath)) throw new Error('Forbidden');

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    return items.map((item) => {
        const fullPath = path.join(dirPath, item.name);
        const stats = fs.statSync(fullPath);
        return {
            name: item.name,
            path: fullPath,
            type: item.isDirectory() ? 'directory' : 'file',
            size: stats.size,
        };
    });
};

export const readFileContent = (filePath: string): { content: string; language: string } => {
    if (!isPathAllowed(filePath)) throw new Error('Forbidden');

    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).slice(1);

    const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        md: 'markdown',
        json: 'json',
        css: 'css',
        html: 'html',
    };

    return { content, language: langMap[ext] || 'text' };
};
