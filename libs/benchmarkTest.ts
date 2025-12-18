// This is a file for benchmark testing. You can ignore it. However, don't delete it if you don't know what you're doing.

interface BenchmarkResult {
  approach: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

class ButtonResponseBenchmark {
  static oldApproach(command: string, plugins: Record<string, any>, prefix: string): boolean {
    const startTime = performance.now();
    
    let isIdMessage = false;
    const id = `${prefix}${command}`;
    
    for (let name in plugins) {
      let plugin = plugins[name];
      if (!plugin) continue;
      if (plugin.disabled) continue;
      if (typeof plugin.exec !== 'function') continue;
      
      const str2Regex = (str: string) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
      let _prefix = prefix;
      
      let match = [[new RegExp(str2Regex(_prefix)).exec(id), new RegExp(str2Regex(_prefix))]].find(p => p[1]);
      
      if (match && match[0] && match[0][0]) {
        let usedPrefix = match[0][0];
        let noPrefix = id.replace(usedPrefix, '');
        let [cmd] = noPrefix.trim().split(' ').filter(v => v);
        cmd = (cmd || '').toLowerCase();
        
        let isId = plugin.cmd instanceof RegExp ? 
          plugin.cmd.test(cmd) : 
          Array.isArray(plugin.cmd) ? 
            plugin.cmd.some((c: any) => c instanceof RegExp ? c.test(cmd) : c === cmd) : 
            typeof plugin.cmd === 'string' ? plugin.cmd === cmd : false;
        
        if (isId) {
          isIdMessage = true;
          break;
        }
      }
    }
    
    const endTime = performance.now();
    return isIdMessage;
  }
  
  static newApproach(command: string, cache: Map<string, any>): boolean {
    const startTime = performance.now();
    
    const normalized = command.toLowerCase().trim();
    const found = cache.has(normalized);
    
    const endTime = performance.now();
    return found;
  }
  
  static async runComparison(iterations: number = 1000): Promise<{
    old: BenchmarkResult;
    new: BenchmarkResult;
    speedup: number;
  }> {
    console.log(`\n🔬 Starting benchmark with ${iterations} iterations...\n`);
    
    const plugins = this.generateMockPlugins(100);
    const cache = this.buildMockCache(plugins);
    const testCommands = ['ping', 'help', 'menu', 'info', 'start', 'test'];

    const oldTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const cmd = testCommands[i % testCommands.length];
      const start = performance.now();
      this.oldApproach(cmd, plugins, '.');
      const end = performance.now();
      oldTimes.push(end - start);
    }
    
    const newTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const cmd = testCommands[i % testCommands.length];
      const start = performance.now();
      this.newApproach(cmd, cache);
      const end = performance.now();
      newTimes.push(end - start);
    }
    
    const oldResult: BenchmarkResult = {
      approach: 'Old (Loop All Plugins)',
      iterations,
      totalTime: oldTimes.reduce((a, b) => a + b, 0),
      avgTime: oldTimes.reduce((a, b) => a + b, 0) / oldTimes.length,
      minTime: Math.min(...oldTimes),
      maxTime: Math.max(...oldTimes),
      opsPerSecond: 1000 / (oldTimes.reduce((a, b) => a + b, 0) / oldTimes.length)
    };
    
    const newResult: BenchmarkResult = {
      approach: 'New (Cache Lookup)',
      iterations,
      totalTime: newTimes.reduce((a, b) => a + b, 0),
      avgTime: newTimes.reduce((a, b) => a + b, 0) / newTimes.length,
      minTime: Math.min(...newTimes),
      maxTime: Math.max(...newTimes),
      opsPerSecond: 1000 / (newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
    };
    
    const speedup = oldResult.avgTime / newResult.avgTime;
    
    return { old: oldResult, new: newResult, speedup };
  }
  
  /**
   * Generate mock plugins for testing
   */
  private static generateMockPlugins(count: number): Record<string, any> {
    const plugins: Record<string, any> = {};
    const commands = ['ping', 'help', 'menu', 'info', 'start', 'test', 'profile', 'stats', 'about', 'version'];
    
    for (let i = 0; i < count; i++) {
      const cmd = commands[i % commands.length] + (i > commands.length ? i : '');
      plugins[`plugin${i}`] = {
        name: `Plugin ${i}`,
        disabled: false,
        cmd: [cmd],
        exec: async () => {}
      };
    }
    
    return plugins;
  }
  
  private static buildMockCache(plugins: Record<string, any>): Map<string, any> {
    const cache = new Map();
    
    for (let name in plugins) {
      const plugin = plugins[name];
      if (!plugin || plugin.disabled) continue;
      
      const commands = Array.isArray(plugin.cmd) ? plugin.cmd : [plugin.cmd];
      commands.forEach((cmd: string) => {
        cache.set(cmd.toLowerCase(), { plugin, pluginName: name, command: cmd });
      });
    }
    
    return cache;
  }
  
  static formatResults(results: { old: BenchmarkResult; new: BenchmarkResult; speedup: number }): string {
    const { old, new: newRes, speedup } = results;
    
    const output = `
╔════════════════════════════════════════════════════════════════╗
║                    BENCHMARK RESULTS                           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  📊 OLD APPROACH (Loop All Plugins)                            ║
║  ────────────────────────────────────────────────────────────  ║
║  Total Time:      ${old.totalTime.toFixed(2).padStart(10)} ms                                ║
║  Avg Time:        ${old.avgTime.toFixed(4).padStart(10)} ms                                ║
║  Min Time:        ${old.minTime.toFixed(4).padStart(10)} ms                                ║
║  Max Time:        ${old.maxTime.toFixed(4).padStart(10)} ms                                ║
║  Ops/Second:      ${old.opsPerSecond.toFixed(0).padStart(10)}                                   ║
║                                                                ║
║  ⚡ NEW APPROACH (Cache Lookup)                                ║
║  ────────────────────────────────────────────────────────────  ║
║  Total Time:      ${newRes.totalTime.toFixed(2).padStart(10)} ms                                ║
║  Avg Time:        ${newRes.avgTime.toFixed(4).padStart(10)} ms                                ║
║  Min Time:        ${newRes.minTime.toFixed(4).padStart(10)} ms                                ║
║  Max Time:        ${newRes.maxTime.toFixed(4).padStart(10)} ms                                ║
║  Ops/Second:      ${newRes.opsPerSecond.toFixed(0).padStart(10)}                                   ║
║                                                                ║
║  🚀 PERFORMANCE IMPROVEMENT                                    ║
║  ────────────────────────────────────────────────────────────  ║
║  Speedup:         ${speedup.toFixed(2)}x faster                                ║
║  Time Saved:      ${((old.avgTime - newRes.avgTime) / old.avgTime * 100).toFixed(1)}% reduction                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

💡 With ${old.iterations} iterations on 100 plugins
`;
    
    return output;
  }
}

export { ButtonResponseBenchmark, type BenchmarkResult };