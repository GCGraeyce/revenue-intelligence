import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { RoleToggle } from '@/components/RoleToggle';

describe('RoleToggle', () => {
  it('renders all 4 role buttons', () => {
    render(<RoleToggle />);
    expect(screen.getByText('Rep')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Exec')).toBeInTheDocument();
    expect(screen.getByText('RevOps')).toBeInTheDocument();
  });

  it('renders coaching mode toggle (HITL / Agentic)', () => {
    render(<RoleToggle />);
    expect(screen.getByText('HITL')).toBeInTheDocument();
    expect(screen.getByText('Agentic')).toBeInTheDocument();
  });

  it('renders Explain mode button', () => {
    render(<RoleToggle />);
    expect(screen.getByText('Explain')).toBeInTheDocument();
  });

  it('switches role on click', () => {
    render(<RoleToggle />);
    const repBtn = screen.getByText('Rep');
    fireEvent.click(repBtn);
    // After clicking Rep, the button should have active styling
    const repParent = repBtn.closest('button');
    expect(repParent?.className).toContain('bg-primary');
  });

  it('toggles coaching mode', () => {
    render(<RoleToggle />);
    const agenticBtn = screen.getByText('Agentic');
    fireEvent.click(agenticBtn);
    // After clicking Agentic, should have active styling
    const agenticParent = agenticBtn.closest('button');
    expect(agenticParent?.className).toContain('bg-card');
  });

  it('toggles explain mode', () => {
    render(<RoleToggle />);
    const explainBtn = screen.getByText('Explain');
    fireEvent.click(explainBtn);
    // Should show active state
    const parent = explainBtn.closest('button');
    expect(parent?.className).toContain('bg-primary');
  });
});
