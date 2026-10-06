import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Order } from '../types';

interface SalesByRegionChartProps {
  orders: Order[];
}

const SalesByRegionChart: React.FC<SalesByRegionChartProps> = ({ orders }) => {
  const data = useMemo(() => {
    const regionalData: Record<string, { region: string; sales: number }> = {
      'Riyadh': { region: 'الرياض', sales: 0 },
      'Jeddah': { region: 'جدة', sales: 0 },
      'Dammam': { region: 'الدمام', sales: 0 },
      'Other': { region: 'مدن أخرى', sales: 0 }
    };

    orders.forEach(order => {
      const city = (order.city || '').toLowerCase();
      if (city.includes('رياض') || city.includes('riyadh')) regionalData['Riyadh'].sales += order.totalPrice;
      else if (city.includes('جده') || city.includes('jeddah')) regionalData['Jeddah'].sales += order.totalPrice;
      else if (city.includes('دمام') || city.includes('dammam')) regionalData['Dammam'].sales += order.totalPrice;
      else regionalData['Other'].sales += order.totalPrice;
    });

    return Object.values(regionalData);
  }, [orders]);

  return (
    <div className="bg-white border border-gray-150 p-6 rounded-2xl">
      <h3 className="font-serif text-lg text-gray-900 mb-4">المبيعات حسب المنطقة</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#DF8A9C" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesByRegionChart;
