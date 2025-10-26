
import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const mockPlates = [
  { plate: 'AB 123 CD', time: '10:45:12', image: 'https://picsum.photos/id/1078/150/100' },
  { plate: 'EF 456 GH', time: '10:45:05', image: 'https://picsum.photos/id/1079/150/100' },
  { plate: 'IJ 789 KL', time: '10:44:58', image: 'https://picsum.photos/id/1080/150/100' },
  { plate: 'MN 012 OP', time: '10:44:51', image: 'https://picsum.photos/id/1081/150/100' },
];

const LprPage = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">{t('lpr_data_title')}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">Plate</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">Time</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">Image</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {mockPlates.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-4 px-6 font-mono text-lg">{item.plate}</td>
                                <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{item.time}</td>
                                <td className="py-4 px-6">
                                    <img src={item.image} alt={`Plate ${item.plate}`} className="rounded-md shadow-md" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LprPage;
