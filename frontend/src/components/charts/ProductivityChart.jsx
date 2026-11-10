import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/**
 * data shape: [{ name: 'Karan Mehta', completed: 8, pending: 3 }, ...]
 */
const ProductivityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-ink-faint">
        No productivity data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke="#E3E5EC" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#5B6472', fontFamily: 'Inter' }}
          axisLine={{ stroke: '#E3E5EC' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#5B6472', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: '#F4F5F9' }}
          contentStyle={{
            borderRadius: 6,
            border: '1px solid #E3E5EC',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <Bar dataKey="completed" name="Completed" fill="#1F8F6B" radius={[3, 3, 0, 0]} />
        <Bar dataKey="pending" name="Pending" fill="#94A3B8" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProductivityChart;
