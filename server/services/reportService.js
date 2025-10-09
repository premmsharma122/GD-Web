const PDFDocument = require('pdfkit');

class ReportService {
  generatePDFReport(userAnalysis, feedback, roomId) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).fillColor('#2563eb').text('Group Discussion Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#6b7280').text(`Room ID: ${roomId}`, { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Participant Info
        doc.fontSize(18).fillColor('#1f2937').text('Participant Information');
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#374151');
        doc.text(`Name: ${userAnalysis.userName}`);
        doc.text(`Speaking Time: ${Math.round(userAnalysis.speakingTime / 1000)} seconds`);
        doc.text(`Total Words: ${userAnalysis.totalWords}`);
        doc.text(`Utterances: ${userAnalysis.utteranceCount}`);
        doc.text(`Words per Minute: ${Math.round(userAnalysis.wordsPerMinute)}`);
        doc.moveDown(1.5);

        // Performance Metrics
        doc.fontSize(18).fillColor('#1f2937').text('Performance Metrics');
        doc.moveDown(0.5);
        
        // Speaking confidence
        const confidencePercent = Math.round(userAnalysis.averageConfidence * 100);
        doc.fontSize(12).fillColor('#374151');
        doc.text(`Speech Clarity: ${confidencePercent}%`);
        this.drawProgressBar(doc, confidencePercent, '#10b981');
        doc.moveDown(1);

        // Sentiment analysis
        doc.text('Sentiment Distribution:');
        doc.moveDown(0.3);
        const sentiments = userAnalysis.sentimentDistribution;
        Object.entries(sentiments).forEach(([sentiment, count]) => {
          const percentage = Math.round((count / userAnalysis.utteranceCount) * 100);
          doc.fontSize(11).text(`  ${sentiment}: ${percentage}%`);
        });
        doc.moveDown(1.5);

        // Key Points
        if (userAnalysis.keyPoints && userAnalysis.keyPoints.length > 0) {
          doc.fontSize(18).fillColor('#1f2937').text('Key Discussion Points');
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor('#374151');
          userAnalysis.keyPoints.forEach((point, idx) => {
            doc.text(`${idx + 1}. ${point}`, { indent: 20 });
            doc.moveDown(0.3);
          });
          doc.moveDown(1);
        }

        // Strengths
        doc.addPage();
        doc.fontSize(18).fillColor('#059669').text('✓ Strengths');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#374151');
        if (feedback.strengths.length > 0) {
          feedback.strengths.forEach(strength => {
            doc.text(`• ${strength}`, { indent: 20 });
            doc.moveDown(0.5);
          });
        } else {
          doc.text('Continue developing your discussion skills!', { indent: 20 });
        }
        doc.moveDown(1.5);

        // Areas for Improvement
        doc.fontSize(18).fillColor('#dc2626').text('→ Areas for Improvement');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#374151');
        if (feedback.improvements.length > 0) {
          feedback.improvements.forEach(improvement => {
            doc.text(`• ${improvement}`, { indent: 20 });
            doc.moveDown(0.5);
          });
        } else {
          doc.text('Great job! Keep up the excellent work!', { indent: 20 });
        }
        doc.moveDown(1.5);

        // Overall Feedback
        doc.fontSize(18).fillColor('#1f2937').text('Overall Assessment');
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#374151');
        doc.text(feedback.overall, { align: 'justify' });
        doc.moveDown(2);

        // Recommendations
        doc.fontSize(16).fillColor('#2563eb').text('Recommendations for Next Discussion');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#374151');
        const recommendations = this.generateRecommendations(userAnalysis, feedback);
        recommendations.forEach(rec => {
          doc.text(`• ${rec}`, { indent: 20 });
          doc.moveDown(0.5);
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#9ca3af').text(
          'This report is generated automatically based on AI analysis.',
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  drawProgressBar(doc, percentage, color) {
    const barWidth = 300;
    const barHeight = 15;
    const x = doc.x;
    const y = doc.y;

    // Background
    doc.rect(x, y, barWidth, barHeight).fillAndStroke('#e5e7eb', '#d1d5db');

    // Progress
    const progressWidth = (barWidth * percentage) / 100;
    doc.rect(x, y, progressWidth, barHeight).fillAndStroke(color, color);

    doc.moveDown(1);
  }

  generateRecommendations(analysis, feedback) {
    const recommendations = [];

    if (analysis.speakingTime < 60000) {
      recommendations.push('Prepare more points to contribute during discussions');
    }

    if (analysis.wordsPerMinute > 180) {
      recommendations.push('Practice speaking at a moderate pace with deliberate pauses');
    } else if (analysis.wordsPerMinute < 100) {
      recommendations.push('Work on maintaining consistent speaking flow');
    }

    if (analysis.averageConfidence < 0.7) {
      recommendations.push('Practice speaking clearly and articulating your thoughts');
    }

    if (feedback.improvements.length > feedback.strengths.length) {
      recommendations.push('Record yourself and practice with peers to build confidence');
    }

    recommendations.push('Continue participating actively in group discussions');

    return recommendations;
  }
}

module.exports = new ReportService();