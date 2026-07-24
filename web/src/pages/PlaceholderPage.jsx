import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';

export default function PlaceholderPage({ title }) {
  return (
    <DashboardLayout>
      <Header />
      <div className="flex flex-col items-center justify-center h-[60vh] bg-momentum-panel border border-momentum-border rounded-2xl">
        <h2 className="text-3xl font-bold text-momentum-text-primary mb-4">{title}</h2>
        <p className="text-momentum-text-secondary text-lg">This module is coming soon.</p>
      </div>
    </DashboardLayout>
  );
}
