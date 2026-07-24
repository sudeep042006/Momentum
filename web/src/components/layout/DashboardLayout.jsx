import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-momentum-bg overflow-hidden text-momentum-text-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
