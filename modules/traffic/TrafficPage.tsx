
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';

const data = [
  { name: '-60m', cars: 65, trucks: 28 },
  { name: '-50m', cars: 59, trucks: 22 },
  { name: '-40m', cars: 80, trucks: 31 },
  { name: '-30m', cars: 81, trucks: 35 },
  { name: '-20m', cars: 56, trucks: 18 },
  { name: '-10m', cars: 95, trucks: 40 },
  { name: 'Now', cars: 110, trucks: 45 },
];

const TrafficPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">{t('traffic_data_title')}</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" stroke={tickColor}/>
                        <YAxis stroke={tickColor} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                border: `1px solid ${gridColor}`
                            }}
                        />
                        <Legend />
                        <Bar dataKey="cars" fill="#3b82f6" name="Cars" />
                        <Bar dataKey="trucks" fill="#10b981" name="Trucks" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrafficPage;
