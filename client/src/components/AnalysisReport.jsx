import { useState } from 'react';
import axios from 'axios';

export default function AnalysisReport({ roomId, userName, speakingTime, audioBlob, onClose }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [transcriptId, setTranscriptId] = useState(null);

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const startAnalysis = async () => {
    try {
      setStatus('uploading');
      setMessage('Starting analysis...');
      setProgress(10);

      // Validate audio blob
      if (!audioBlob) {
        setStatus('error');
        setMessage('No audio recording found. Please ensure the discussion was recorded.');
        return;
      }

      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);

      // Check if audio is too small
      if (audioBlob.size < 1000) {
        setStatus('error');
        setMessage('Recording is too short. Please record at least a few seconds of audio.');
        return;
      }

      setMessage('Preparing audio file...');
      setProgress(15);

      // Create FormData and append the audio blob
      const formData = new FormData();
      
      // Ensure the blob has the correct type
      const audioFile = new Blob([audioBlob], { type: 'audio/webm' });
      formData.append('audio', audioFile, 'discussion-audio.webm');
      formData.append('roomId', roomId);
      formData.append('userName', userName);
      formData.append('speakingTime', speakingTime.toString());

      console.log('Uploading audio to server...');
      setMessage('Uploading audio to server...');
      setProgress(25);

      try {
        const uploadRes = await axios.post(
          `${SERVER_URL}/api/analysis/upload`,
          formData,
          {
            headers: { 
              'Content-Type': 'multipart/form-data'
            },
            timeout: 300000, // 5 minute timeout
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const adjustedProgress = 25 + (percentCompleted * 0.2); // 25% to 45%
              setProgress(adjustedProgress);
              setMessage(`Uploading audio... ${percentCompleted}%`);
            }
          }
        );

        console.log('Upload response:', uploadRes.data);

        if (!uploadRes.data.transcriptId) {
          throw new Error('No transcript ID received from server');
        }

        setTranscriptId(uploadRes.data.transcriptId);
        setStatus('processing');
        setMessage('Audio uploaded successfully. Processing transcription...');
        setProgress(50);

        // Start polling for completion
        pollTranscriptionStatus(uploadRes.data.transcriptId);

      } catch (uploadError) {
        console.error('Upload error details:', uploadError);
        
        if (uploadError.code === 'ECONNABORTED') {
          throw new Error('Upload timed out. The audio file may be too large.');
        } else if (uploadError.response) {
          throw new Error(uploadError.response.data.message || 'Server rejected the upload');
        } else if (uploadError.request) {
          throw new Error('Could not reach server. Please check your connection.');
        } else {
          throw uploadError;
        }
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to start analysis');
    }
  };

  const pollTranscriptionStatus = async (tId) => {
    const maxAttempts = 120; // 6 minutes total (120 * 3 seconds)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        console.log(`Checking status for transcript ${tId}, attempt ${attempts + 1}`);
        
        const statusRes = await axios.get(
          `${SERVER_URL}/api/analysis/status/${tId}`,
          { timeout: 30000 }
        );
        
        console.log('Status:', statusRes.data.status);

        if (statusRes.data.status === 'completed') {
          setProgress(75);
          setMessage('Transcription complete. Generating report...');
          await generateReport(tId);
        } else if (statusRes.data.status === 'error') {
          setStatus('error');
          setMessage('Transcription failed. The audio may be unclear or too short.');
        } else {
          // Still processing
          attempts++;
          const newProgress = 50 + Math.min(20, Math.floor(attempts / 3));
          setProgress(newProgress);
          setMessage(`Processing transcription... (${attempts}/${maxAttempts})`);
          
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 3000);
          } else {
            setStatus('error');
            setMessage('Transcription is taking too long. Please try again with a shorter recording.');
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
        
        // Retry on network errors
        attempts++;
        if (attempts < maxAttempts) {
          console.log('Retrying status check...');
          setTimeout(checkStatus, 3000);
        } else {
          setStatus('error');
          setMessage('Failed to check transcription status: ' + error.message);
        }
      }
    };

    checkStatus();
  };

  const generateReport = async (tId) => {
    try {
      console.log('Generating report for transcript:', tId);
      
      const reportRes = await axios.post(
        `${SERVER_URL}/api/analysis/generate-report`,
        {
          transcriptId: tId,
          userName,
          speakingTime,
          roomId
        },
        {
          timeout: 120000 // 2 minutes
        }
      );

      console.log('Report generated:', reportRes.data);

      setAnalysis(reportRes.data.analysis);
      setFeedback(reportRes.data.feedback);
      setStatus('completed');
      setProgress(100);
      setMessage('Analysis completed successfully!');

    } catch (error) {
      console.error('Report generation error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to generate report: ' + error.message);
    }
  };

  const downloadPDF = async () => {
    try {
      setMessage('Preparing PDF download...');
      
      const response = await axios.get(
        `${SERVER_URL}/api/analysis/download/${roomId}/${encodeURIComponent(userName)}`,
        { 
          responseType: 'blob',
          timeout: 60000
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Discussion_Report_${userName}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('PDF downloaded successfully!');

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Discussion Analysis</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Indicator */}
          {status !== 'idle' && status !== 'completed' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{message}</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {status === 'processing' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This may take 1-3 minutes depending on audio length
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {status === 'error' && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <p className="font-semibold mb-1">❌ Error</p>
              <p className="text-sm">{message}</p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setMessage('');
                  setProgress(0);
                  setTranscriptId(null);
                }}
                className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Analysis Results */}
          {status === 'completed' && analysis && feedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Speaking Time</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(analysis.speakingTime / 1000)}s
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Words</div>
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.totalWords}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Words/Minute</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(analysis.wordsPerMinute)}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Clarity Score</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round(analysis.averageConfidence * 100)}%
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <span className="mr-2">✓</span> Strengths
                </h3>
                {feedback.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">Keep developing your skills!</p>
                )}
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                  <span className="mr-2">→</span> Areas for Improvement
                </h3>
                {feedback.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {feedback.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">Excellent performance!</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Overall Assessment</h3>
                <p className="text-gray-700">{feedback.overall}</p>
              </div>

              {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-3">Key Discussion Points</h3>
                  <ul className="space-y-2">
                    {analysis.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="mr-2 font-semibold">{idx + 1}.</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={downloadPDF}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </button>
            </div>
          )}

          {/* Initial State */}
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-2">Ready to Analyze Your Performance?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We'll analyze your speaking patterns, clarity, sentiment, and provide personalized feedback.
                </p>
                
                {audioBlob && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700">
                      ✓ Audio recorded: {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                
                <ul className="text-left text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Speaking time and word count analysis
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Speech clarity and confidence metrics
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Sentiment analysis and key points
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Personalized improvement suggestions
                  </li>
                </ul>
              </div>
              
              <button
                onClick={startAnalysis}
                disabled={!audioBlob}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {audioBlob ? 'Start Analysis' : 'No Recording Available'}
              </button>

              {!audioBlob && (
                <p className="text-xs text-red-500">
                  ⚠ Please record the discussion first by starting a topic
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}