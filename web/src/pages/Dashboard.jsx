import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Heatmap from '../components/dashboard/Heatmap';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Header />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-2 pb-10">
        {/* Main Content Area (Heatmap + Today's Plan) */}
        <div className="xl:col-span-2 space-y-6">
          <Heatmap />
          
          {/* Today's Plan Placeholder */}
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 min-h-[300px] flex items-center justify-center text-momentum-text-secondary">
             Today's Plan Widget Coming Soon
          </div>

           {/* Deep Work Placeholder */}
           <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 min-h-[150px] flex items-center justify-center text-momentum-text-secondary">
             Deep Work Timer Coming Soon
          </div>
        </div>

        {/* Right Sidebar Area (Today Overview + Stats) */}
        <div className="space-y-6">
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 min-h-[300px] flex items-center justify-center text-momentum-text-secondary">
             Today Overview Ring Coming Soon
          </div>
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl p-6 min-h-[400px] flex items-center justify-center text-momentum-text-secondary">
             Key Stats Widget Coming Soon
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
