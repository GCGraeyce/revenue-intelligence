import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { AITrustCenter } from '@/components/AITrustCenter';

describe('AITrustCenter', () => {
  it('renders main title', () => {
    render(<AITrustCenter />);
    expect(screen.getByText('AI Trust Center')).toBeInTheDocument();
  });

  it('renders section tabs', () => {
    render(<AITrustCenter />);
    expect(screen.getByText('Bias Validation')).toBeInTheDocument();
    expect(screen.getByText('Security & Compliance')).toBeInTheDocument();
    expect(screen.getByText('Explainability')).toBeInTheDocument();
  });

  it('shows bias validation metrics by default', () => {
    render(<AITrustCenter />);
    expect(screen.getByText('Segment Parity')).toBeInTheDocument();
    expect(screen.getByText('Rep Fairness')).toBeInTheDocument();
  });

  it('switches to Security & Compliance tab', () => {
    render(<AITrustCenter />);
    fireEvent.click(screen.getByText('Security & Compliance'));
    expect(screen.getByText(/SOC 2/i)).toBeInTheDocument();
  });

  it('switches to Explainability tab', () => {
    render(<AITrustCenter />);
    // "Explainability" appears in both the subtitle text and the tab button.
    // Find the button element specifically.
    const tabs = screen.getAllByText(/Explainability/);
    const tabButton = tabs.find(el => el.closest('button'));
    expect(tabButton).toBeTruthy();
    fireEvent.click(tabButton!);
    expect(screen.getByText(/Scoring Explainability/)).toBeInTheDocument();
  });

  it('renders numeric metric values', () => {
    const { container } = render(<AITrustCenter />);
    const scores = container.querySelectorAll('.font-mono');
    expect(scores.length).toBeGreaterThan(0);
  });
});
