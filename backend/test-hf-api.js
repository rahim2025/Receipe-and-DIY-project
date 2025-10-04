import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testHuggingFaceAPI = async () => {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  
  console.log('Testing Hugging Face API connectivity...');
  console.log(HF_API_KEY);
  
  try {
    // Test 1: Check if API key is valid by accessing user info
    console.log('\n1. Testing API key validity...');
    const userResponse = await axios.get('https://huggingface.co/api/whoami', {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`
      }
    });
    console.log('✅ API Key is valid');
    console.log('User:', userResponse.data.name);
    console.log('Token type:', userResponse.data.auth?.type);
    
    // Test 2: List available models
    console.log('\n2. Testing model listing...');
    const modelsResponse = await axios.get('https://huggingface.co/api/models?pipeline_tag=text-generation&limit=10', {
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`
      }
    });
    console.log('✅ Can access models list');
    console.log('Available models:');
    modelsResponse.data.forEach((model, i) => {
      if (i < 5) console.log(`  - ${model.modelId}`);
    });
    
    // Test 3: Try inference with a simple model
    console.log('\n3. Testing inference with gpt2...');
    const inferenceResponse = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        inputs: "The recipe for",
        parameters: {
          max_length: 30,
          do_sample: true,
          temperature: 0.7
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Inference works!');
    console.log('Response:', inferenceResponse.data);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
  }
};

testHuggingFaceAPI().catch(console.error);