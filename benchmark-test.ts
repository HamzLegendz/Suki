// This is a file for benchmark testing. You can ignore it. However, don't delete it if you don't know what you're doing.

import { ButtonResponseBenchmark } from "./libs/benchmarkTest";

async function main() {
  console.log("🚀 Button Response Performance Benchmark\n");
  console.log("Testing with different plugin counts...\n");
  
  for (const pluginCount of [10, 50, 100, 200, 500]) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing with ${pluginCount} plugins`);
    console.log('='.repeat(60));
    
    const results = await ButtonResponseBenchmark.runComparison(1000);
    console.log(ButtonResponseBenchmark.formatResults(results));
  }
}

if (import.meta.main) {
    main();
}