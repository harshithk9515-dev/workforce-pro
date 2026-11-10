import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTaskStatusMeta, TASK_STATUS_META } from '../../utils/statusStyles';

const COLOR_HEX = {
  todo: '#94A3B8',
  'in-progress': '#3D6FB4',
  review: '#C8772D',
  completed: '#1F8F6B',
};

const StatusDistributionChart = ({ distribution }) => {
  const data = Object.keys(TASK_STATUS_META)
    .map((key) => ({
      key,
      name: getTaskStatusMeta(key).label,
      value: distribution?.[key] || 0,
    }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-ink-faint">
        No task data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLOR_HEX[entry.key]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 6,
            border: '1px solid #E3E5EC',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-ink-muted">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default StatusDistributionChart;
