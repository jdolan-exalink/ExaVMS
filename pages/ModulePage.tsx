
import React, { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modules } from '../modules';
import { useTranslation } from '../hooks/useTranslation';

const Spinner = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
    </div>
);

const ModulePage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { t } = useTranslation();
  const module = modules.find(m => m.id === moduleId);

  if (!module) {
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold">Module not found</h2>
            <Link to="/" className="text-primary-600 hover:underline mt-4 inline-block">{t('go_back')}</Link>
        </div>
    );
  }

  const ModuleComponent = module.component;

  const isSpecialLayout = ['liveview', 'server-config'].includes(module.id);
  const containerClasses = isSpecialLayout
    ? "h-full"
    : "p-4 sm:p-6 lg:p-8 h-full";


  return (
    <div className={containerClasses}>
        <Suspense fallback={<Spinner />}>
            <ModuleComponent />
        </Suspense>
    </div>
  );
};

export default ModulePage;
