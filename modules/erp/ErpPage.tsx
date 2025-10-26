
import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const mockInvoices = [
  { id: 'INV-00123', amount: '$1,250.00', status: 'Paid', date: '2023-10-26' },
  { id: 'INV-00124', amount: '$875.50', status: 'Pending', date: '2023-10-27' },
  { id: 'INV-00125', amount: '$2,500.00', status: 'Paid', date: '2023-10-27' },
  { id: 'INV-00126', amount: '$450.00', status: 'Overdue', date: '2023-09-15' },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colorClasses = {
        Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        Overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

const ErpPage = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">{t('erp_data_title')}</h3>
            <ul className="space-y-4">
                {mockInvoices.map((invoice) => (
                    <li key={invoice.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-primary-600 dark:text-primary-400">{invoice.id}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.date}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-lg">{invoice.amount}</p>
                           <StatusBadge status={invoice.status} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ErpPage;
