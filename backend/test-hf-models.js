import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testHuggingFaceModels = async () => {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  console.log('Testing Hugging Face API access...');
  console.log('API Key (first 10 chars):', HF_API_KEY?.substring(0, 10) + '...');
  
  // List of models to test
  const modelsToTest = [
    'gpt2',
    'microsoft/DialoGPT-small',
    'microsoft/DialoGPT-medium',
    'bigscience/bloom-560m',
    'EleutherAI/gpt-neo-125M',
    'facebook/blenderbot-400M-distill',
    'google/flan-t5-small',
    'mistralai/Mistral-7B-Instruct-v0.3'
  ];
  
  for (const model of modelsToTest) {
    try {
      console.log(`\n🔄 Testing model: ${model}`);
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: "Hello, this is a test.",
          parameters: {
            max_new_tokens: 50,
            temperature: 0.7
          },
          options: {
            wait_for_model: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log(`✅ ${model} - SUCCESS`);
      console.log(`   Response type:`, typeof response.data);
      
    } catch (error) {
      console.log(`❌ ${model} - FAILED`);
      console.log(`   Status: ${error.response?.status || 'No status'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
  }
};

testHuggingFaceModels().catch(console.error);