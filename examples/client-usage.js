/**
 * JITPhone Client Library Usage Examples
 * These examples show how to use the JavaScript client library
 */

// Import the client library
const { JITPhoneClient, JITPhoneUtils } = require('../client/jitphone-client');

// Example 1: Basic Usage
async function basicExample() {
  console.log('=== Basic JITPhone Client Usage ===');
  
  const client = new JITPhoneClient({
    baseURL: 'http://localhost:3000',
    timeout: 30000
  });

  try {
    // Simple compilation and execution
    const code = `
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n-1) + fibonacci(n-2);
      }
      fibonacci(input.n);
    `;

    const result = await client.run(code, { n: 10 });
    console.log('Fibonacci(10):', result.result);
    console.log('Performance:', result.metadata);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: JIT Instruction Conversion
async function jitConversionExample() {
  console.log('\n=== JIT Instruction Conversion ===');
  
  const client = new JITPhoneClient();

  try {
    // Example iOS LLVM IR
    const llvmCode = `
      define i32 @add(i32 %a, i32 %b) #0 {
      entry:
        %result = add nsw i32 %a, %b
        ret i32 %result
      }
    `;

    const conversion = await client.convertJITInstructions(
      llvmCode,
      'ios-llvm',
      { optimizationLevel: 'O2' }
    );

    console.log('Converted JavaScript:');
    console.log(conversion.result.code);
    console.log('Optimizations:', conversion.result.optimizations);

  } catch (error) {
    console.error('Conversion error:', error.message);
  }
}

// Example 3: Code Analysis
async function codeAnalysisExample() {
  console.log('\n=== Code Analysis ===');
  
  const client = new JITPhoneClient();

  try {
    const complexCode = `
      function complexFunction(data) {
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].length; j++) {
            if (data[i][j] > 100) {
              for (let k = 0; k < 10; k++) {
                data[i][j] = Math.sqrt(data[i][j]);
              }
            }
          }
        }
        return data;
      }
    `;

    const analysis = await client.getOptimizationSuggestions(complexCode);
    
    console.log('Complexity Analysis:', analysis.result.complexity);
    console.log('Optimization Suggestions:', analysis.result.optimizationSuggestions);
    console.log('iOS Compatibility:', analysis.result.iosCompatibility);
    console.log('Security Analysis:', analysis.result.security);

  } catch (error) {
    console.error('Analysis error:', error.message);
  }
}

// Example 4: Batch Processing
async function batchProcessingExample() {
  console.log('\n=== Batch Processing ===');
  
  const client = new JITPhoneClient();

  const codeSnippets = [
    'Math.sqrt(16)',
    'function square(x) { return x * x; } square(5)',
    'let arr = [1,2,3]; arr.map(x => x * 2)',
    'function isPrime(n) { if(n<=1) return false; for(let i=2; i<n; i++) if(n%i===0) return false; return true; } isPrime(17)'
  ];

  try {
    const results = await client.batchCompile(codeSnippets, {
      optimizationLevel: 'O2',
      target: 'shortcuts'
    });

    results.forEach((result, index) => {
      console.log(`\nSnippet ${index + 1}:`);
      if (result.success) {
        console.log('  Compiled successfully');
        console.log('  Size:', result.data.result.metadata.compiledSize, 'bytes');
      } else {
        console.log('  Error:', result.error);
      }
    });

  } catch (error) {
    console.error('Batch processing error:', error.message);
  }
}

// Example 5: Streaming Compilation for Large Codebases
async function streamingExample() {
  console.log('\n=== Streaming Compilation ===');
  
  const client = new JITPhoneClient();

  const codeChunks = [
    'function module1() { return "Module 1"; }',
    'function module2() { return "Module 2"; }',
    'function module3() { return "Module 3"; }',
    'function main() { return module1() + module2() + module3(); }'
  ];

  try {
    console.log('Streaming compilation results:');
    
    for await (const result of client.streamCompile(codeChunks)) {
      if (result.success) {
        console.log(`  Chunk ${result.index}: Compiled (${result.result.result.metadata.compiledSize} bytes)`);
      } else {
        console.log(`  Chunk ${result.index}: Error - ${result.error}`);
      }
    }

  } catch (error) {
    console.error('Streaming error:', error.message);
  }
}

// Example 6: Performance Testing
async function performanceTestingExample() {
  console.log('\n=== Performance Testing ===');
  
  const client = new JITPhoneClient();

  // Create a performance test
  const testCode = JITPhoneUtils.generatePerformanceTest(
    'Math.pow(Math.random(), 2)',
    10000
  );

  try {
    const result = await client.run(testCode);
    console.log('Performance test result:', result.result, 'ms');
    
    // Get client statistics
    const stats = client.getStats();
    console.log('Client statistics:', stats);

  } catch (error) {
    console.error('Performance test error:', error.message);
  }
}

// Example 7: iOS Shortcuts Optimization
async function iosOptimizationExample() {
  console.log('\n=== iOS Shortcuts Optimization ===');
  
  const client = new JITPhoneClient();

  const modernCode = `
    const processData = (items) => {
      return items
        .filter(item => item.active)
        .map(item => ({
          ...item,
          processed: true
        }))
        .reduce((acc, item) => acc + item.value, 0);
    };
  `;

  // Optimize for iOS Shortcuts
  const optimizedCode = JITPhoneUtils.optimizeForShortcuts(modernCode);
  console.log('Original code length:', modernCode.length);
  console.log('Optimized code length:', optimizedCode.length);
  
  try {
    const result = await client.compile(optimizedCode, {
      target: 'shortcuts',
      optimizationLevel: 'O2'
    });

    console.log('iOS compatibility:', result.result.execution.canExecute);
    console.log('Requirements:', result.result.execution.requirements);

  } catch (error) {
    console.error('iOS optimization error:', error.message);
  }
}

// Example 8: WebAssembly to Node.js Conversion
async function wasmConversionExample() {
  console.log('\n=== WebAssembly to Node.js Conversion ===');
  
  const client = new JITPhoneClient();

  const wasmCode = `
    (module
      (func $add (param $a i32) (param $b i32) (result i32)
        local.get $a
        local.get $b
        i32.add)
      (export "add" (func $add)))
  `;

  try {
    const conversion = await client.convertJITInstructions(
      wasmCode,
      'wasm',
      { 
        optimizationLevel: 'O3',
        preserveSemantics: true 
      }
    );

    console.log('Converted WASM to JavaScript:');
    console.log(conversion.result.code);

  } catch (error) {
    console.error('WASM conversion error:', error.message);
  }
}

// Example 9: Error Handling and Retry Logic
async function errorHandlingExample() {
  console.log('\n=== Error Handling and Retry ===');
  
  const client = new JITPhoneClient({
    baseURL: 'http://localhost:3000',
    retries: 3,
    timeout: 5000
  });

  try {
    // Deliberately cause an error
    const result = await client.compile('invalid javascript code {{{');
    
  } catch (error) {
    console.log('Caught expected error:', error.code);
    console.log('Error message:', error.message);
    console.log('Timestamp:', error.timestamp);
    
    if (error.originalError) {
      console.log('Original error:', error.originalError.message);
    }
  }
}

// Example 10: Health Check and Server Info
async function serverInfoExample() {
  console.log('\n=== Server Information ===');
  
  const client = new JITPhoneClient();

  try {
    const health = await client.health();
    console.log('Server health:', health);

    const info = await client.info();
    console.log('JIT engine info:', info);

  } catch (error) {
    console.error('Server info error:', error.message);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 JITPhone Client Library Examples\n');
  
  try {
    await basicExample();
    await jitConversionExample();
    await codeAnalysisExample();
    await batchProcessingExample();
    await streamingExample();
    await performanceTestingExample();
    await iosOptimizationExample();
    await wasmConversionExample();
    await errorHandlingExample();
    await serverInfoExample();
    
    console.log('\n✅ All examples completed!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
  }
}

// Browser usage example
function browserExample() {
  console.log('\n=== Browser Usage Example ===');
  
  // This code would run in a browser environment
  const browserCode = `
    // Include the client library via script tag:
    // <script src="jitphone-client.js"></script>
    
    const client = new JITPhoneClient({
      baseURL: 'https://your-jitphone-server.com'
    });
    
    // Use in a web application
    async function optimizeUserCode() {
      const userCode = document.getElementById('code-input').value;
      
      try {
        const result = await client.compile(userCode, {
          target: 'shortcuts',
          optimizationLevel: 'O2'
        });
        
        document.getElementById('output').textContent = result.result.compiled;
        
      } catch (error) {
        console.error('Compilation failed:', error);
        document.getElementById('error').textContent = error.message;
      }
    }
    
    // Performance monitoring
    setInterval(() => {
      const stats = client.getStats();
      console.log('Client performance:', stats);
    }, 10000);
  `;
  
  console.log('Browser example code:');
  console.log(browserCode);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicExample,
    jitConversionExample,
    codeAnalysisExample,
    batchProcessingExample,
    streamingExample,
    performanceTestingExample,
    iosOptimizationExample,
    wasmConversionExample,
    errorHandlingExample,
    serverInfoExample,
    runAllExamples,
    browserExample
  };
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
} 