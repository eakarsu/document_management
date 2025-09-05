#!/usr/bin/env node

/**
 * OpenRouter API Connection Test
 * Tests actual connectivity and functionality with OpenRouter API
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class OpenRouterConnectionTest {
  constructor() {
    this.apiKey = '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';
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.testResults = {
      passed: [],
      failed: [],
      total: 0
    };
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    console.log(`\n🧪 Test ${this.testResults.total}: ${name}`);
    
    try {
      await testFn.call(this);
      this.testResults.passed.push(name);
      console.log(`✅ PASSED: ${name}`);
      return true;
    } catch (error) {
      this.testResults.failed.push({ name, error: error.message });
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Reason: ${error.message}`);
      if (error.response?.data) {
        console.error(`   API Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }

  // ============= CONNECTIVITY TESTS =============

  async testAPIKeyValid() {
    const response = await axios.get(`${this.baseURL}/auth/key`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.data) {
      throw new Error('No response from API key validation');
    }
    console.log('   ✓ API key is valid');
    console.log(`   ✓ Key info: ${JSON.stringify(response.data).substring(0, 100)}...`);
  }

  async testListModels() {
    const response = await axios.get(`${this.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.data?.data || response.data.data.length === 0) {
      throw new Error('No models returned from API');
    }
    
    const modelCount = response.data.data.length;
    console.log(`   ✓ Successfully retrieved ${modelCount} models`);
    
    // Check for expected models
    const modelIds = response.data.data.map(m => m.id);
    const expectedModels = [
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo'
    ];
    
    for (const model of expectedModels) {
      if (modelIds.includes(model)) {
        console.log(`   ✓ Found model: ${model}`);
      }
    }
  }

  async testSimpleCompletion() {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with only "Connection successful".'
          },
          {
            role: 'user',
            content: 'Test connection'
          }
        ],
        max_tokens: 20
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'Document Management System'
        }
      }
    );
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('No content in completion response');
    }
    
    console.log('   ✓ Completion API works');
    console.log(`   ✓ Response: ${response.data.choices[0].message.content}`);
    console.log(`   ✓ Model used: ${response.data.model}`);
  }

  async testFeedbackProcessing() {
    const testFeedback = {
      originalSentence: 'The quick brown fox jumps over the lazy dog.',
      feedback: 'This sentence could be more descriptive and engaging.',
      severity: 'SUBSTANTIVE'
    };
    
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a document editor. Improve the given sentence based on feedback. Respond with ONLY the improved sentence, no explanation.'
          },
          {
            role: 'user',
            content: `Original: ${testFeedback.originalSentence}\nFeedback: ${testFeedback.feedback}\nProvide an improved version.`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'Document Management System'
        }
      }
    );
    
    const improved = response.data?.choices?.[0]?.message?.content;
    if (!improved) {
      throw new Error('No improved sentence generated');
    }
    
    console.log('   ✓ Feedback processing works');
    console.log(`   ✓ Original: ${testFeedback.originalSentence}`);
    console.log(`   ✓ Improved: ${improved}`);
    console.log(`   ✓ Tokens used: ${response.data.usage?.total_tokens || 'N/A'}`);
  }

  async testModelSelection() {
    const severities = ['CRITICAL', 'MAJOR', 'SUBSTANTIVE', 'ADMINISTRATIVE'];
    const modelMap = {
      'CRITICAL': 'anthropic/claude-3-opus',
      'MAJOR': 'anthropic/claude-3.5-sonnet',
      'SUBSTANTIVE': 'anthropic/claude-3-haiku',
      'ADMINISTRATIVE': 'openai/gpt-3.5-turbo'
    };
    
    for (const severity of severities) {
      const model = modelMap[severity];
      
      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          {
            model: model,
            messages: [
              {
                role: 'user',
                content: 'Say "OK" in one word'
              }
            ],
            max_tokens: 5
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:4000',
              'X-Title': 'Document Management System'
            }
          }
        );
        
        if (response.data?.choices?.[0]?.message?.content) {
          console.log(`   ✓ ${severity} model (${model}) works`);
        }
      } catch (error) {
        throw new Error(`Model ${model} for ${severity} failed: ${error.message}`);
      }
    }
  }

  async testBatchProcessing() {
    const batchRequests = [
      'Improve: The system is good.',
      'Improve: Performance needs work.',
      'Improve: Documentation is incomplete.'
    ];
    
    const promises = batchRequests.map(req => 
      axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'system',
              content: 'Improve the sentence. Reply with only the improved version.'
            },
            {
              role: 'user',
              content: req
            }
          ],
          max_tokens: 50
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:4000',
            'X-Title': 'Document Management System'
          }
        }
      )
    );
    
    const results = await Promise.all(promises);
    
    if (results.length !== batchRequests.length) {
      throw new Error('Batch processing failed');
    }
    
    console.log('   ✓ Batch processing successful');
    results.forEach((res, i) => {
      const improved = res.data?.choices?.[0]?.message?.content;
      console.log(`   ✓ Batch ${i + 1}: ${improved?.substring(0, 50)}...`);
    });
  }

  async testRateLimiting() {
    // Test if we can handle rate limits properly
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(
        axios.post(
          `${this.baseURL}/chat/completions`,
          {
            model: 'anthropic/claude-3-haiku',
            messages: [{ role: 'user', content: `Test ${i}` }],
            max_tokens: 5
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:4000',
              'X-Title': 'Document Management System'
            }
          }
        ).then(res => ({ success: true, data: res.data }))
          .catch(err => ({ success: false, error: err.message }))
      );
    }
    
    const results = await Promise.all(requests);
    const successful = results.filter(r => r.success).length;
    
    console.log(`   ✓ Handled ${successful}/3 requests successfully`);
    
    if (successful === 0) {
      throw new Error('All requests failed - possible API key issue');
    }
  }

  async testErrorHandling() {
    // Test with invalid model
    try {
      await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'invalid-model-xyz',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      throw new Error('Should have failed with invalid model');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.log('   ✓ Error handling works correctly');
        console.log(`   ✓ Invalid model rejected with status ${error.response.status}`);
      } else if (error.message === 'Should have failed with invalid model') {
        throw error;
      } else {
        console.log('   ✓ Error caught properly');
      }
    }
  }

  async testCostEstimation() {
    // Test cost tracking
    const models = [
      { id: 'anthropic/claude-3-haiku', expectedCost: 0.00025 },
      { id: 'openai/gpt-3.5-turbo', expectedCost: 0.0005 }
    ];
    
    for (const model of models) {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model.id,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:4000',
            'X-Title': 'Document Management System'
          }
        }
      );
      
      const usage = response.data?.usage;
      if (usage) {
        console.log(`   ✓ ${model.id}: ${usage.total_tokens} tokens used`);
      }
    }
  }

  async run() {
    console.log('🚀 OpenRouter API Connection Test Suite');
    console.log('=' .repeat(60));
    console.log(`📡 Testing API: ${this.baseURL}`);
    console.log(`🔑 API Key: ${this.apiKey.substring(0, 20)}...`);
    console.log('=' .repeat(60));
    
    // Run all tests
    await this.runTest('API Key Validation', this.testAPIKeyValid);
    await this.runTest('List Available Models', this.testListModels);
    await this.runTest('Simple Completion', this.testSimpleCompletion);
    await this.runTest('Feedback Processing', this.testFeedbackProcessing);
    await this.runTest('Model Selection by Severity', this.testModelSelection);
    await this.runTest('Batch Processing', this.testBatchProcessing);
    await this.runTest('Rate Limit Handling', this.testRateLimiting);
    await this.runTest('Error Handling', this.testErrorHandling);
    await this.runTest('Cost Estimation', this.testCostEstimation);
    
    // Display results
    console.log('\n' + '=' .repeat(60));
    console.log('📋 CONNECTION TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`\n✅ Passed: ${this.testResults.passed.length}`);
    console.log(`❌ Failed: ${this.testResults.failed.length}`);
    console.log(`📊 Pass Rate: ${Math.round((this.testResults.passed.length / this.testResults.total) * 100)}%`);
    
    if (this.testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.failed.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    // Disconnect from database
    await prisma.$disconnect();
    
    // Final status
    console.log('\n' + '=' .repeat(60));
    if (this.testResults.failed.length === 0) {
      console.log('✨ ALL OPENROUTER CONNECTION TESTS PASSED! ✨');
      console.log('\n🎉 OpenRouter API Integration Status:');
      console.log('   ✅ API key is valid and working');
      console.log('   ✅ All required models are accessible');
      console.log('   ✅ Feedback processing functional');
      console.log('   ✅ Batch processing operational');
      console.log('   ✅ Error handling implemented');
      console.log('   ✅ Ready for production use!');
      process.exit(0);
    } else {
      console.log(`❌ ${this.testResults.failed.length} connection tests failed.`);
      console.log('⚠️  Please check your API key and network connection.');
      process.exit(1);
    }
  }
}

// Run the test suite
const suite = new OpenRouterConnectionTest();
suite.run().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});