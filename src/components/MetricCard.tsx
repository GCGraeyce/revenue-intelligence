import { ReactNode } from 'react';
import { TrendSparkline, generateTrendData } from './TrendSparkline';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
  /** Numeric value for sparkline trend (auto-generates 8-week trend data) */
  sparklineValue?: number;
}
const variantStyles = {
  default: 'glass-card',
  primary: 'glass-card border-primary/30 bg-gradient-to-br from-primary/[0.04] to-transparent',
  warning: 'glass-card border-[hsl(var(--grade-c))]/30 bg-gradient-to-br from-[hsl(var(--grade-c)/.04)] to-transparent',
  danger: 'glass-card border-destructive/30 bg-gradient-to-br from-destructive/[0.04] to-transparent',
  success: 'glass-card border-[hsl(var(--grade-a))]/30 bg-gradient-to-br from-[hsl(var(--grade-a)/.04)] to-transparent',
};
const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]',
  danger: 'bg-destructive/10 text-destructive',
  success: 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]',
};
const sparklineColors: Record<string, 'primary' | 'grade-a' | 'grade-c' | 'grade-f'> = {
  default: 'primary',
  primary: 'primary',
  warning: 'grade-c',
  danger: 'grade-f',
  success: 'grade-a',
};
export function MetricCard({ label, value, subValue, icon, variant = 'default', sparklineValue }: MetricCardProps) {
  return (
    <div className={`${variantStyles[variant]} p-5 animate-fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{label}</span>
        {icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconVariantStyles[variant]}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="metric-value text-foreground">{value}</div>
        {sparklineValue != null && sparklineValue > 0 && (
          <TrendSparkline
            data={generateTrendData(sparklineValue, 8, 0.12)}
            width={48}
            height={16}
            color={sparklineColors[variant] || 'primary'}
          />
        )}
      </div>
      {subValue && <div className="text-xs text-muted-foreground mt-1.5 font-mono">{subValue}</div>}
    </div>
  );
}
