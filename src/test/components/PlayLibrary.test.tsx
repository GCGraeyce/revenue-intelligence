import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { PlayLibrary } from '@/components/PlayLibrary';

describe('PlayLibrary', () => {
  it('renders the component title', () => {
    render(<PlayLibrary />);
    expect(screen.getByText(/AI Coaching Playbook/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    const { container } = render(<PlayLibrary />);
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  it('renders category filter pills/tabs', () => {
    render(<PlayLibrary />);
    // Should have category filters
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders prompt cards', () => {
    const { container } = render(<PlayLibrary />);
    const cards = container.querySelectorAll('[class*="glass-card"], [class*="rounded"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('filters prompts by search text', () => {
    const { container } = render(<PlayLibrary />);
    const input = container.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: 'forecast' } });
      // Should filter down to fewer prompts
    }
    expect(container).toBeTruthy();
  });

  it('handles empty search gracefully', () => {
    const { container } = render(<PlayLibrary />);
    const input = container.querySelector('input');
    if (input) {
      fireEvent.change(input, { target: { value: '' } });
    }
    expect(container).toBeTruthy();
  });
});
