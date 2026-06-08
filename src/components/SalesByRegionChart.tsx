import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Order } from '../types';

interface SalesByRegionChartProps {
  orders: Order[];
}

const SalesByRegionChart: React.FC<SalesByRegionChartProps> = ({ orders }) => {
  const data = useMemo(() => {
    const regionalData: Record<string, { region: string; sales: number }> = {
      'Egypt': { region: 'Egypt (EGP)', sales: 0 },
      'Saudi Arabia': { region: 'Saudi (SAR)', sales: 0 }
    };

    orders.forEach(order => {
      // Assuming 'region' or 'country' is in order data or we can infer it
      // Based on the prompt "السعودية مقابل مصر", I will look for SAR vs EGP currencies or shipping info
      if (order.currency === 'SAR') {
        regionalData['Saudi Arabia'].sales += order.totalPrice;
      } else if (order.currency === 'EGP') {
        regionalData['Egypt'].sales += order.totalPrice;
      }
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
