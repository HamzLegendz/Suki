import fs from 'node:fs';
import path from 'node:path';

export interface YukiKeepConfig {
  enabled: boolean;
  interval: number;
  maxAge: number | null;
  maxSize: number | null;
  keepRules: KeepRule[];
  deleteRules: DeleteRule[];
}

export interface KeepRule {
  pattern: string;
  type: 'name' | 'extension' | 'contains' | 'regex' | 'age' | 'size';
  value?: string | number;
  condition?: 'older_than' | 'newer_than' | 'larger_than' | 'smaller_than';
}

export interface DeleteRule {
  pattern: string;
  type: 'name' | 'extension' | 'contains' | 'regex' | 'age' | 'size';
  value?: string | number;
  condition?: 'older_than' | 'newer_than' | 'larger_than' | 'smaller_than';
}

interface ParsedLine {
  key: string;
  value: string;
}

export class YukiKeepParser {
  private static instance: YukiKeepParser | null = null;
  private configCache: Map<string, { config: YukiKeepConfig; mtime: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  private constructor() { }

  static getInstance(): YukiKeepParser {
    if (!YukiKeepParser.instance) {
      YukiKeepParser.instance = new YukiKeepParser();
    }
    return YukiKeepParser.instance;
  }

  clearCache(): void {
    this.configCache.clear();
  }

  getCacheSize(): number {
    return this.configCache.size;
  }

  private getDefaultConfig(): YukiKeepConfig {
    return {
      enabled: true,
      interval: 5,
      maxAge: null,
      maxSize: null,
      keepRules: [],
      deleteRules: [{ pattern: '*', type: 'name' }]
    };
  }

  parse(filePath: string): YukiKeepConfig {
    if (!fs.existsSync(filePath)) {
      return this.getDefaultConfig();
    }

    try {
      const stats = fs.statSync(filePath);
      const mtime = stats.mtimeMs;

      const cached = this.configCache.get(filePath);
      if (cached && mtime === cached.mtime) {
        return cached.config;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const config = this.parseContent(content);

      this.configCache.set(filePath, { config, mtime });

      if (this.configCache.size > 10) {
        const entries = Array.from(this.configCache.entries());
        entries.slice(0, entries.length - 10).forEach(([key]) => {
          this.configCache.delete(key);
        });
      }

      return config;
    } catch (e) {
      console.error(`Failed to parse .yuki_keep: ${e}`);
      return this.getDefaultConfig();
    }
  }

  private parseContent(content: string): YukiKeepConfig {
    const config = this.getDefaultConfig();
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        continue;
      }

      const parsed = this.parseLine(trimmed);
      if (!parsed) continue;

      this.applyConfigValue(config, parsed);
    }

    return config;
  }

  private parseLine(line: string): ParsedLine | null {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return null;

    const key = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    return { key, value };
  }

  private applyConfigValue(config: YukiKeepConfig, parsed: ParsedLine): void {
    const { key, value } = parsed;

    switch (key) {
      case 'enabled':
        config.enabled = value.toLowerCase() === 'true' || value === '1';
        break;

      case 'interval':
        const interval = parseInt(value);
        if (!isNaN(interval) && interval > 0) {
          config.interval = interval;
        }
        break;

      case 'max_age':
      case 'maxage':
        config.maxAge = this.parseTimeValue(value);
        break;

      case 'max_size':
      case 'maxsize':
        config.maxSize = this.parseSizeValue(value);
        break;

      case 'keep':
        this.parseRules(value, config.keepRules);
        break;

      case 'delete':
        this.parseRules(value, config.deleteRules);
        break;

      case 'keep_ext':
      case 'keep_extension':
        this.parseExtensionRules(value, config.keepRules);
        break;

      case 'delete_ext':
      case 'delete_extension':
        this.parseExtensionRules(value, config.deleteRules);
        break;

      case 'keep_regex':
        this.parseRegexRules(value, config.keepRules);
        break;

      case 'delete_regex':
        this.parseRegexRules(value, config.deleteRules);
        break;

      case 'keep_older_than':
        this.parseAgeRule(value, config.keepRules, 'older_than');
        break;

      case 'delete_older_than':
        this.parseAgeRule(value, config.deleteRules, 'older_than');
        break;

      case 'keep_newer_than':
        this.parseAgeRule(value, config.keepRules, 'newer_than');
        break;

      case 'delete_newer_than':
        this.parseAgeRule(value, config.deleteRules, 'newer_than');
        break;

      case 'keep_larger_than':
        this.parseSizeRule(value, config.keepRules, 'larger_than');
        break;

      case 'delete_larger_than':
        this.parseSizeRule(value, config.deleteRules, 'larger_than');
        break;

      case 'keep_smaller_than':
        this.parseSizeRule(value, config.keepRules, 'smaller_than');
        break;

      case 'delete_smaller_than':
        this.parseSizeRule(value, config.deleteRules, 'smaller_than');
        break;
    }
  }

  private parseRules(value: string, rules: (KeepRule | DeleteRule)[]): void {
    const patterns = value.split(',').map(v => v.trim()).filter(v => v);

    for (const pattern of patterns) {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        rules.push({ pattern: pattern.slice(1, -1), type: 'regex' });
      } else if (pattern.includes('*')) {
        rules.push({ pattern, type: 'name' });
      } else if (pattern.startsWith('~')) {
        rules.push({ pattern: pattern.slice(1), type: 'contains' });
      } else {
        rules.push({ pattern, type: 'name' });
      }
    }
  }

  private parseExtensionRules(value: string, rules: (KeepRule | DeleteRule)[]): void {
    const extensions = value.split(',').map(v => v.trim().replace(/^\./, '')).filter(v => v);

    for (const ext of extensions) {
      rules.push({ pattern: ext, type: 'extension' });
    }
  }

  private parseRegexRules(value: string, rules: (KeepRule | DeleteRule)[]): void {
    const patterns = value.split(',').map(v => v.trim()).filter(v => v);

    for (const pattern of patterns) {
      rules.push({ pattern, type: 'regex' });
    }
  }

  private parseAgeRule(
    value: string,
    rules: (KeepRule | DeleteRule)[],
    condition: 'older_than' | 'newer_than'
  ): void {
    const age = this.parseTimeValue(value);
    if (age !== null) {
      rules.push({ pattern: '', type: 'age', value: age, condition });
    }
  }

  private parseSizeRule(
    value: string,
    rules: (KeepRule | DeleteRule)[],
    condition: 'larger_than' | 'smaller_than'
  ): void {
    const size = this.parseSizeValue(value);
    if (size !== null) {
      rules.push({ pattern: '', type: 'size', value: size, condition });
    }
  }

  private parseTimeValue(value: string): number | null {
    const match = value.match(/^(\d+)\s*(s|m|h|d|w)?$/i);
    if (!match) return null;

    const num = parseInt(match[1]!!);
    const unit = (match[2] || 'm').toLowerCase();

    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    return num * (multipliers[unit] || multipliers['m']!!);
  }

  private parseSizeValue(value: string): number | null {
    const match = value.match(/^(\d+)\s*(b|kb|mb|gb)?$/i);
    if (!match) return null;

    const num = parseInt(match[1]!!);
    const unit = (match[2] || 'mb').toLowerCase();

    const multipliers: Record<string, number> = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    return num * (multipliers[unit] || multipliers['mb']!!);
  }
}

export class YukiKeepMatcher {
  private regexCache: Map<string, RegExp> = new Map();
  private readonly MAX_REGEX_CACHE = 50;

  constructor() { }

  clearCache(): void {
    this.regexCache.clear();
  }

  shouldKeep(fileName: string, filePath: string, rules: KeepRule[]): boolean {
    if (rules.length === 0) return false;
    if (fileName === '.yuki_keep') return true;

    return rules.some(rule => this.matchRule(fileName, filePath, rule));
  }

  shouldDelete(fileName: string, filePath: string, rules: DeleteRule[]): boolean {
    if (rules.length === 0) return false;
    if (fileName === '.yuki_keep') return false;

    return rules.some(rule => this.matchRule(fileName, filePath, rule));
  }

  private matchRule(fileName: string, filePath: string, rule: KeepRule | DeleteRule): boolean {
    try {
      switch (rule.type) {
        case 'name':
          return this.matchWildcard(fileName, rule.pattern);

        case 'extension':
          const ext = path.extname(fileName).slice(1).toLowerCase();
          return ext === rule.pattern.toLowerCase();

        case 'contains':
          return fileName.toLowerCase().includes(rule.pattern.toLowerCase());

        case 'regex':
          return this.matchRegex(fileName, rule.pattern);

        case 'age':
          return this.matchAge(filePath, rule);

        case 'size':
          return this.matchSize(filePath, rule);

        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  }

  private matchWildcard(fileName: string, pattern: string): boolean {
    if (pattern === '*') return true;

    // Convert wildcard to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(fileName);
  }

  private matchRegex(fileName: string, pattern: string): boolean {
    let regex = this.regexCache.get(pattern);

    if (!regex) {
      regex = new RegExp(pattern, 'i');
      this.regexCache.set(pattern, regex);

      if (this.regexCache.size > this.MAX_REGEX_CACHE) {
        const firstKey = this.regexCache.keys().next().value;
        this.regexCache.delete(firstKey as string);
      }
    }

    return regex.test(fileName);
  }

  private matchAge(filePath: string, rule: KeepRule | DeleteRule): boolean {
    if (!rule.value || !rule.condition) return false;

    try {
      const stats = fs.statSync(filePath);
      const fileAge: any = Date.now() - stats.mtimeMs;

      if (rule.condition === 'older_than') {
        return fileAge > rule.value;
      } else if (rule.condition === 'newer_than') {
        return fileAge < rule.value;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  private matchSize(filePath: string, rule: KeepRule | DeleteRule): boolean {
    if (!rule.value || !rule.condition) return false;

    try {
      const stats = fs.statSync(filePath);
      const fileSize: any = stats.size;

      if (rule.condition === 'larger_than') {
        return fileSize > rule.value;
      } else if (rule.condition === 'smaller_than') {
        return fileSize < rule.value;
      }

      return false;
    } catch (e) {
      return false;
    }
  }
}

export const yukiKeepParser = YukiKeepParser.getInstance();
export const yukiKeepMatcher = new YukiKeepMatcher();
