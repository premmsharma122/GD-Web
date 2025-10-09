const express = require('express');
const router = express.Router();
const multer = require('multer');
const assemblyAIService = require('../services/assemblyAIService');
const reportService = require('../services/reportService');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/mp4'];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.includes('audio')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Store analysis results temporarily (in production, use a database)
const analysisCache = new Map();

// POST /api/analysis/upload - Upload and analyze audio
router.post('/upload', (req, res) => {
  upload.single('audio')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        message: 'File upload error: ' + err.message 
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        message: err.message || 'File upload failed' 
      });
    }

    try {
      const { roomId, userName, speakingTime } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }

      if (!roomId || !userName || !speakingTime) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      console.log(`Processing audio for ${userName} in room ${roomId}`);
      console.log(`Audio file size: ${req.file.size} bytes`);
      console.log(`Audio file type: ${req.file.mimetype}`);

      // Check if file is too small (likely empty or corrupted)
      if (req.file.size < 1000) {
        return res.status(400).json({ 
          message: 'Audio file is too small. Please ensure discussion was recorded properly.' 
        });
      }

      // Upload audio to AssemblyAI
      console.log('Uploading to AssemblyAI...');
      const audioUrl = await assemblyAIService.uploadAudio(req.file.buffer);
      console.log('Audio uploaded to AssemblyAI:', audioUrl);
      
      // Start transcription
      console.log('Starting transcription...');
      const transcriptRequest = await assemblyAIService.transcribeAudio(audioUrl, true);
      console.log('Transcription started:', transcriptRequest.id);
      
      res.json({ 
        message: 'Audio uploaded successfully. Processing...',
        transcriptId: transcriptRequest.id,
        status: 'processing'
      });

    } catch (error) {
      console.error('Error in upload handler:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: 'Failed to process audio', 
        error: error.message 
      });
    }
  });
});

// GET /api/analysis/status/:transcriptId - Check transcription status
router.get('/status/:transcriptId', async (req, res) => {
  try {
    const { transcriptId } = req.params;
    const transcript = await assemblyAIService.getTranscript(transcriptId);
    
    console.log(`Transcription status for ${transcriptId}: ${transcript.status}`);
    
    res.json({
      status: transcript.status,
      transcriptId: transcript.id
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ 
      message: 'Failed to check status', 
      error: error.message 
    });
  }
});

// POST /api/analysis/generate-report - Generate analysis report
router.post('/generate-report', async (req, res) => {
  try {
    const { transcriptId, userName, speakingTime, roomId } = req.body;

    if (!transcriptId || !userName || !roomId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log(`Generating report for ${userName}`);

    // Get completed transcript
    const transcript = await assemblyAIService.waitForTranscription(transcriptId);

    if (!transcript || !transcript.text) {
      return res.status(500).json({ 
        message: 'Transcription completed but no text was found. The audio may be too short or unclear.' 
      });
    }

    console.log('Transcription completed, text length:', transcript.text.length);

    // Analyze user performance
    const analysis = assemblyAIService.analyzeUserPerformance(
      transcript, 
      userName, 
      parseInt(speakingTime)
    );

    // Generate feedback
    const feedback = assemblyAIService.generateFeedback(analysis);

    // Store in cache
    const cacheKey = `${roomId}_${userName}`;
    analysisCache.set(cacheKey, { analysis, feedback, timestamp: Date.now() });

    console.log('Analysis completed for', userName);

    res.json({
      message: 'Analysis completed',
      analysis,
      feedback
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      message: 'Failed to generate report', 
      error: error.message 
    });
  }
});

// GET /api/analysis/download/:roomId/:userName - Download PDF report
router.get('/download/:roomId/:userName', async (req, res) => {
  try {
    const { roomId, userName } = req.params;
    const decodedUserName = decodeURIComponent(userName);
    const cacheKey = `${roomId}_${decodedUserName}`;
    
    console.log('Downloading PDF for:', cacheKey);
    
    const cached = analysisCache.get(cacheKey);
    if (!cached) {
      return res.status(404).json({ 
        message: 'Report not found. Please generate analysis first.' 
      });
    }

    const { analysis, feedback } = cached;

    console.log('Generating PDF report...');

    // Generate PDF
    const pdfBuffer = await reportService.generatePDFReport(analysis, feedback, roomId);

    console.log('PDF generated, size:', pdfBuffer.length);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Discussion_Report_${decodedUserName}_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

    console.log('PDF sent successfully');

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF', 
      error: error.message 
    });
  }
});

// DELETE /api/analysis/clear/:roomId - Clear analysis cache for a room
router.delete('/clear/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    let deletedCount = 0;

    for (const key of analysisCache.keys()) {
      if (key.startsWith(roomId)) {
        analysisCache.delete(key);
        deletedCount++;
      }
    }

    res.json({ message: `Cleared ${deletedCount} cached reports` });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ message: 'Failed to clear cache', error: error.message });
  }
});

module.exports = router;