/**
 * JITPhone Client Library Demo
 * Quick demonstration of the new client library and JIT conversion features
 */

const { JITPhoneClient, JITPhoneUtils } = require('./client/jitphone-client');

async function demo() {
  console.log('🚀 JITPhone Client Library Demo\n');

  const client = new JITPhoneClient({
    baseURL: 'http://localhost:3000'
  });

  try {
    // 1. Basic Health Check
    console.log('1. Health Check:');
    const health = await client.health();
    console.log('   Server Status:', health.status);
    console.log('   Capabilities:', Object.keys(health.capabilities).filter(k => health.capabilities[k]));

    // 2. Simple Compilation
    console.log('\n2. Basic Compilation:');
    const simpleResult = await client.compile('Math.sqrt(16)', {
      target: 'shortcuts',
      optimizationLevel: 'O2'
    });
    console.log('   Success:', simpleResult.success);
    console.log('   JIT Enabled:', simpleResult.result.metadata.jitEnabled);
    console.log('   Optimizations:', simpleResult.result.metadata.optimizations);

    // 3. JIT Instruction Conversion
    console.log('\n3. JIT Conversion (iOS LLVM):');
    const llvmCode = 'define i32 @add(i32 %a, i32 %b) { %result = add nsw i32 %a, %b ret i32 %result }';
    const conversion = await client.convertJITInstructions(llvmCode, 'ios-llvm');
    console.log('   Conversion Success:', conversion.success);
    console.log('   Generated JavaScript Preview:', conversion.result.code.substring(0, 100) + '...');

    // 4. Code Analysis
    console.log('\n4. Code Analysis:');
    const complexCode = `
      function processArray(arr) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = 0; j < arr.length; j++) {
            if (arr[i] > arr[j]) {
              let temp = arr[i];
              arr[i] = arr[j];
              arr[j] = temp;
            }
          }
        }
        return arr;
      }
    `;
    
    const analysis = await client.getOptimizationSuggestions(complexCode);
    console.log('   Complexity Score:', analysis.result.complexity.cyclomaticComplexity);
    console.log('   Performance Hotspots:', analysis.result.performance.hotspots.length);
    console.log('   iOS Compatible:', analysis.result.iosCompatibility.compatible);
    console.log('   Security Score:', analysis.result.security.score);

    // 5. Performance Test
    console.log('\n5. Performance Testing:');
    const perfCode = JITPhoneUtils.generatePerformanceTest('Math.random() * 100', 1000);
    const perfResult = await client.run(perfCode);
    console.log('   Performance Test Duration:', perfResult.result, 'ms');

    // 6. Client Statistics
    console.log('\n6. Client Statistics:');
    const stats = client.getStats();
    console.log('   Total Requests:', stats.requests);
    console.log('   Cache Hit Rate:', stats.cacheHitRate.toFixed(1) + '%');
    console.log('   Average Latency:', stats.averageLatency.toFixed(1) + 'ms');

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
demo().catch(console.error); 