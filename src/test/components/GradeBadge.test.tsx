import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { GradeBadge } from '@/components/GradeBadge';
import type { Grade } from '@/data/demo-data';

describe('GradeBadge', () => {
  const grades: Grade[] = ['A', 'B', 'C', 'D', 'F'];

  it.each(grades)('renders grade "%s" with correct text', (grade) => {
    render(<GradeBadge grade={grade} />);
    expect(screen.getByText(grade)).toBeInTheDocument();
  });

  it.each(grades)('applies grade-specific CSS class for "%s"', (grade) => {
    const { container } = render(<GradeBadge grade={grade} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass(`grade-${grade.toLowerCase()}`);
    expect(badge).toHaveClass('grade-badge');
  });

  it('renders as a span element', () => {
    const { container } = render(<GradeBadge grade="A" />);
    expect(container.querySelector('span')).toBeTruthy();
  });
});
