import { render, screen } from '@testing-library/react';
import AnalysisResult from '../AnalysisResult';
import type { AnalysisResult as AnalysisResultType } from '@/lib/analyzer';

const mockResult: AnalysisResultType = {
  silhouetteType: "X",
  upperBodyBalance: "標準",
  deviationScore: 58,
  aiConfidence: 28,
  atmosphere: "balanced",
  cupSize: "C",
  percentile: 42,
};

describe('AnalysisResult', () => {
  it('全てのフィールドが表示されること', () => {
    render(<AnalysisResult result={mockResult} />);

    expect(screen.getByText('Xタイプ')).toBeInTheDocument();
    expect(screen.getByTestId('deviation-score')).toHaveTextContent('58');
    expect(screen.getByTestId('percentile')).toBeInTheDocument();
    expect(screen.getByTestId('upper-body-balance')).toHaveTextContent('標準');
    expect(screen.getByTestId('atmosphere')).toHaveTextContent('バランス型');
    expect(screen.getByTestId('cup-size')).toHaveTextContent('C');
    expect(screen.getByTestId('ai-confidence')).toHaveTextContent('28%');
  });

  it('偏差値が正しく表示されること', () => {
    render(<AnalysisResult result={mockResult} />);
    expect(screen.getByTestId('deviation-score')).toHaveTextContent('58');
  });

  it('パーセンタイルが "上位 XX%" 形式で表示されること', () => {
    render(<AnalysisResult result={mockResult} />);
    expect(screen.getByTestId('percentile')).toHaveTextContent('上位 42%');
  });

  it('AI信頼度のプログレスバーが表示されること', () => {
    render(<AnalysisResult result={mockResult} />);
    expect(screen.getByTestId('confidence-bar')).toBeInTheDocument();
  });
});
