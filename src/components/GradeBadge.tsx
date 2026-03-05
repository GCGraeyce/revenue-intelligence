import { Grade } from '@/data/demo-data';
export function GradeBadge({ grade }: { grade: Grade }) {
  const cls = `grade-badge grade-${grade.toLowerCase()}`;
  return <span className={cls}>{grade}</span>;
}
