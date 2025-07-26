import { motion } from 'framer-motion';
import { Brain, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface AccuracyIndicatorProps {
  accuracyScore: number;
  corrections: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
  isProcessing: boolean;
}

export function AccuracyIndicator({ accuracyScore, corrections, isProcessing }: AccuracyIndicatorProps) {
  const getAccuracyColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getAccuracyLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">AI Speech Accuracy</span>
        {isProcessing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-blue-500" />
          </motion.div>
        )}
      </div>

      {/* Accuracy Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {accuracyScore >= 0.8 ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          )}
          <span className={`text-sm font-medium ${getAccuracyColor(accuracyScore)}`}>
            {getAccuracyLabel(accuracyScore)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getAccuracyBgColor(accuracyScore)} ${getAccuracyColor(accuracyScore).replace('text-', 'bg-')}`}
              initial={{ width: 0 }}
              animate={{ width: `${accuracyScore * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-gray-500 min-w-[3rem]">
            {Math.round(accuracyScore * 100)}%
          </span>
        </div>
      </div>

      {/* Recent Corrections */}
      {corrections.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600">Recent AI Corrections:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {corrections.slice(-3).map((correction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs bg-gray-50 rounded px-2 py-1"
              >
                <span className="text-red-600 line-through">{correction.original}</span>
                <span className="mx-1">→</span>
                <span className="text-green-600">{correction.corrected}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="text-xs text-blue-600 flex items-center gap-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
          Processing speech for accuracy improvements...
        </div>
      )}
    </div>
  );
}