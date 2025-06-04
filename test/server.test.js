const request = require('supertest');
const app = require('../server');

describe('JITPhone Server', () => {
  
  describe('Health Check', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body.capabilities).toHaveProperty('jit', true);
    });
  });

  describe('JIT Info', () => {
    test('GET /jit/info should return engine information', async () => {
      const response = await request(app)
        .get('/jit/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('engine', 'V8');
      expect(response.body).toHaveProperty('jit_enabled', true);
      expect(response.body).toHaveProperty('optimizations');
    });
  });

  describe('JIT Compilation', () => {
    test('POST /jit/compile should compile simple JavaScript', async () => {
      const code = 'function add(a, b) { return a + b; } add(2, 3);';
      
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          optimizationLevel: 'O2',
          target: 'shortcuts'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('compiled');
      expect(response.body.result).toHaveProperty('metadata');
    });

    test('POST /jit/compile should handle optimization levels', async () => {
      const code = 'let x = 5 + 3; x * 2;';
      
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          optimizationLevel: 'O3',
          target: 'shortcuts'
        })
        .expect(200);
      
      expect(response.body.result.metadata).toHaveProperty('optimizationLevel', 'O3');
    });

    test('POST /jit/compile should reject empty code', async () => {
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: '',
          optimizationLevel: 'O2'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid input');
    });

    test('POST /jit/compile should handle invalid JavaScript', async () => {
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: 'function invalid( { syntax error',
          optimizationLevel: 'O2'
        })
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Code Execution', () => {
    test('POST /jit/execute should execute simple code', async () => {
      const compiledCode = `
        (function() {
          'use strict';
          var result = input.a + input.b;
          return result;
        })();
      `;
      
      const response = await request(app)
        .post('/jit/execute')
        .send({
          compiledCode: compiledCode,
          input: { a: 5, b: 3 },
          timeout: 5000
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result', 8);
    });

    test('POST /jit/execute should handle execution errors', async () => {
      const compiledCode = 'throw new Error("Test error");';
      
      const response = await request(app)
        .post('/jit/execute')
        .send({
          compiledCode: compiledCode,
          input: {}
        })
        .expect(500);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /jit/execute should require compiled code', async () => {
      const response = await request(app)
        .post('/jit/execute')
        .send({
          input: { test: true }
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid input');
    });
  });

  describe('iOS Translation Features', () => {
    test('Should translate arrow functions for iOS compatibility', async () => {
      const code = 'const add = (a, b) => a + b; add(1, 2);';
      
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          target: 'shortcuts',
          optimizationLevel: 'O1'
        })
        .expect(200);
      
      // Should not contain arrow functions in the result
      expect(response.body.result.compiled).not.toContain('=>');
    });

    test('Should add iOS polyfills', async () => {
      const code = 'console.log("Hello iOS");';
      
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          target: 'shortcuts'
        })
        .expect(200);
      
      // Should contain polyfills
      expect(response.body.result.compiled).toContain('iOS Polyfills');
    });

    test('Should adapt for different targets', async () => {
      const code = 'Math.sqrt(16);';
      
      const shortcutsResponse = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          target: 'shortcuts'
        })
        .expect(200);
      
      const webviewResponse = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          target: 'webview'
        })
        .expect(200);
      
      // Different targets should produce different adaptations
      expect(shortcutsResponse.body.result.compiled)
        .not.toEqual(webviewResponse.body.result.compiled);
    });
  });

  describe('Performance and Optimization', () => {
    test('Should apply constant folding optimization', async () => {
      const code = 'let result = 5 + 3 * 2; result;';
      
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: code,
          optimizationLevel: 'O2'
        })
        .expect(200);
      
      expect(response.body.result.metadata).toHaveProperty('optimizations');
      expect(response.body.result.metadata.optimizations).toContain('const-fold');
    });

    test('Should cache compilation results', async () => {
      const code = 'function test() { return 42; }';
      
      // First request
      const start1 = Date.now();
      await request(app)
        .post('/jit/compile')
        .send({ code: code })
        .expect(200);
      const time1 = Date.now() - start1;
      
      // Second request (should be faster due to caching)
      const start2 = Date.now();
      await request(app)
        .post('/jit/compile')
        .send({ code: code })
        .expect(200);
      const time2 = Date.now() - start2;
      
      // Second request should generally be faster
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Security Features', () => {
    test('Should handle large code safely', async () => {
      const largeCode = 'let x = 0;\n'.repeat(10000) + 'x;';
      
      const response = await request(app)
        .post('/jit/compile')
        .send({
          code: largeCode
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Code too large');
    });

    test('Should sandbox execution', async () => {
      const maliciousCode = `
        try {
          require('fs').readFileSync('/etc/passwd');
        } catch(e) {
          return 'sandboxed';
        }
      `;
      
      const compileResponse = await request(app)
        .post('/jit/compile')
        .send({
          code: maliciousCode,
          target: 'shortcuts'
        })
        .expect(200);
      
      const executeResponse = await request(app)
        .post('/jit/execute')
        .send({
          compiledCode: compileResponse.body.result.compiled,
          input: {}
        })
        .expect(200);
      
      // Should be sandboxed and not have access to require
      expect(executeResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('Should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Not found');
    });

    test('Should validate Content-Type for POST requests', async () => {
      const response = await request(app)
        .post('/jit/compile')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('Fibonacci Example Integration', () => {
    test('Should optimize Fibonacci function', async () => {
      const fibonacciCode = `
        function fibonacci(n) {
          if (n <= 0) return 0;
          if (n === 1) return 1;
          let a = 0;
          let b = 1;
          let temp;
          for (let i = 2; i <= n; i++) {
            temp = a + b;
            a = b;
            b = temp;
          }
          return b;
        }
        fibonacci(input.n || 10);
      `;
      
      const compileResponse = await request(app)
        .post('/jit/compile')
        .send({
          code: fibonacciCode,
          optimizationLevel: 'O2',
          target: 'shortcuts'
        })
        .expect(200);
      
      expect(compileResponse.body.success).toBe(true);
      expect(compileResponse.body.result.metadata.jitEnabled).toBe(true);
      
      const executeResponse = await request(app)
        .post('/jit/execute')
        .send({
          compiledCode: compileResponse.body.result.compiled,
          input: { n: 10 }
        })
        .expect(200);
      
      expect(executeResponse.body.success).toBe(true);
      expect(executeResponse.body.result).toBe(55); // fibonacci(10) = 55
    });
  });

}); 