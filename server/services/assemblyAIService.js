
const axios = require('axios');

const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

class AssemblyAIService {
  constructor() {
    // Don't cache the API key in constructor
    console.log('AssemblyAI service created');
  }

  // Get API key dynamically each time
  getApiKey() {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    console.log('Getting API key from process.env...');
    console.log('API key exists:', !!apiKey);
    console.log('API key value:', apiKey ? apiKey.substring(0, 8) + '...' : 'undefined');
    
    if (!apiKey || apiKey === 'your_actual_assemblyai_api_key_here') {
      console.error('⚠️  AssemblyAI API key not found in process.env');
      console.error('All env vars:', Object.keys(process.env).filter(k => k.includes('ASSEMBLY')));
      return null;
    }
    return apiKey;
  }

  // Upload audio file to AssemblyAI
  async uploadAudio(audioBuffer) {
    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey) {
        throw new Error('AssemblyAI API key is not configured. Please check your .env file.');
      }

      console.log('Uploading audio buffer, size:', audioBuffer.length, 'bytes');
      console.log('Using API key starting with:', apiKey.substring(0, 8) + '...');
      
      const response = await axios.post(
        `${ASSEMBLYAI_BASE_URL}/upload`,
        audioBuffer,
        {
          headers: {
            authorization: apiKey,
            'content-type': 'application/octet-stream',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000, // 2 minutes timeout
        }
      );
      
      console.log('Upload successful, URL:', response.data.upload_url);
      return response.data.upload_url;
    } catch (error) {
      console.error('❌ Error uploading audio to AssemblyAI:');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Error Data:', error.response?.data);
      console.error('Error Message:', error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid AssemblyAI API key. Please check your configuration.');
      } else if (error.response?.status === 413) {
        throw new Error('Audio file is too large. Maximum size is 100MB.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. The file may be too large or connection is slow.');
      } else {
        throw new Error(`AssemblyAI upload failed: ${error.message}`);
      }
    }
  }

  // Start transcription with sentiment analysis
  async transcribeAudio(audioUrl, speakerLabels = true) {
    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey) {
        throw new Error('AssemblyAI API key is not configured');
      }

      console.log('Starting transcription for URL:', audioUrl);
      
      const response = await axios.post(
        `${ASSEMBLYAI_BASE_URL}/transcript`,
        {
          audio_url: audioUrl,
          speaker_labels: speakerLabels,
          sentiment_analysis: true,
          auto_highlights: true,
          entity_detection: true,
          iab_categories: true,
        },
        {
          headers: {
            authorization: apiKey,
            'content-type': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      console.log('Transcription request created, ID:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error starting transcription:');
      console.error('Status:', error.response?.status);
      console.error('Error Data:', error.response?.data);
      console.error('Error Message:', error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid AssemblyAI API key.');
      } else {
        throw new Error(`Transcription start failed: ${error.message}`);
      }
    }
  }

  // Poll for transcription result
  async getTranscript(transcriptId) {
    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey) {
        throw new Error('AssemblyAI API key is not configured');
      }

      const response = await axios.get(
        `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
        {
          headers: {
            authorization: apiKey,
          },
          timeout: 30000,
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting transcript:', error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid AssemblyAI API key.');
      } else if (error.response?.status === 404) {
        throw new Error('Transcript not found.');
      } else {
        throw new Error(`Failed to get transcript: ${error.message}`);
      }
    }
  }

  // Wait for transcription to complete
  async waitForTranscription(transcriptId, maxAttempts = 60) {
    console.log(`Waiting for transcription ${transcriptId} to complete...`);
    
    for (let i = 0; i < maxAttempts; i++) {
      const transcript = await this.getTranscript(transcriptId);
      
      console.log(`Attempt ${i + 1}/${maxAttempts} - Status: ${transcript.status}`);
      
      if (transcript.status === 'completed') {
        console.log('✅ Transcription completed successfully');
        return transcript;
      } else if (transcript.status === 'error') {
        console.error('❌ Transcription failed:', transcript.error);
        throw new Error('Transcription failed: ' + transcript.error);
      }
      
      // Wait 3 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    throw new Error('Transcription timeout - took longer than expected');
  }

  // Analyze user performance
  analyzeUserPerformance(transcript, userName, speakingTime) {
    console.log('Analyzing performance for:', userName);
    
    if (!transcript || !transcript.text) {
      console.warn('No transcript text available for analysis');
      return {
        userName,
        speakingTime,
        totalWords: 0,
        utteranceCount: 0,
        averageConfidence: 0,
        sentimentDistribution: {},
        keyPoints: [],
        wordsPerMinute: 0,
      };
    }

    const userUtterances = transcript.utterances?.filter(
      u => u.speaker === userName || u.text.toLowerCase().includes(userName.toLowerCase())
    ) || [];

    const totalWords = userUtterances.reduce(
      (sum, u) => sum + (u.words?.length || 0),
      0
    );

    const sentiments = userUtterances
      .filter(u => u.sentiment)
      .map(u => u.sentiment);

    const avgConfidence = userUtterances.length > 0
      ? userUtterances.reduce((sum, u) => sum + (u.confidence || 0), 0) / userUtterances.length
      : 0;

    // Calculate sentiment distribution
    const sentimentCounts = sentiments.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    // Extract key points from auto highlights
    const keyPoints = transcript.auto_highlights_result?.results
      ?.slice(0, 5)
      .map(h => h.text) || [];

    const analysis = {
      userName,
      speakingTime,
      totalWords,
      utteranceCount: userUtterances.length,
      averageConfidence: avgConfidence,
      sentimentDistribution: sentimentCounts,
      keyPoints,
      wordsPerMinute: speakingTime > 0 ? (totalWords / (speakingTime / 60000)) : 0,
    };

    console.log('Analysis completed:', analysis);
    return analysis;
  }

  // Generate feedback based on analysis
  generateFeedback(analysis) {
    const feedback = {
      strengths: [],
      improvements: [],
      overall: '',
    };

    // Speaking time feedback
    if (analysis.speakingTime > 60000) {
      feedback.strengths.push('Good participation with substantial speaking time');
    } else if (analysis.speakingTime < 30000) {
      feedback.improvements.push('Try to participate more actively in discussions');
    }

    // Words per minute feedback
    if (analysis.wordsPerMinute >= 120 && analysis.wordsPerMinute <= 160) {
      feedback.strengths.push('Excellent speaking pace - clear and easy to follow');
    } else if (analysis.wordsPerMinute > 180) {
      feedback.improvements.push('Consider slowing down your speaking pace for better clarity');
    } else if (analysis.wordsPerMinute < 100 && analysis.wordsPerMinute > 0) {
      feedback.improvements.push('Try to maintain a slightly faster pace to keep engagement');
    }

    // Confidence feedback
    if (analysis.averageConfidence > 0.8) {
      feedback.strengths.push('Spoke clearly with high confidence');
    } else if (analysis.averageConfidence < 0.6) {
      feedback.improvements.push('Work on speaking more clearly and confidently');
    }

    // Sentiment feedback
    const sentiments = analysis.sentimentDistribution;
    const totalSentiments = Object.values(sentiments).reduce((sum, count) => sum + count, 0);
    const positiveRatio = totalSentiments > 0 ? (sentiments.POSITIVE || 0) / totalSentiments : 0;
    
    if (positiveRatio > 0.6) {
      feedback.strengths.push('Maintained a positive and constructive tone');
    } else if (totalSentiments > 0 && (sentiments.NEGATIVE || 0) / totalSentiments > 0.4) {
      feedback.improvements.push('Try to maintain a more positive and constructive tone');
    }

    // Overall summary
    const strengthCount = feedback.strengths.length;
    const improvementCount = feedback.improvements.length;

    if (strengthCount > improvementCount) {
      feedback.overall = 'Great performance! You demonstrated strong communication skills.';
    } else if (strengthCount === improvementCount) {
      feedback.overall = 'Good effort! With some improvements, you can excel further.';
    } else {
      feedback.overall = 'Keep practicing! Focus on the improvement areas to enhance your skills.';
    }

    return feedback;
  }
}

module.exports = new AssemblyAIService();