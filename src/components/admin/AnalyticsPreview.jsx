import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useResidents } from "../../hooks/useResidents"; //
import { useAlerts } from "../../hooks/useAlerts";       //
import { Users, MapPin, Bell, AlertTriangle, Loader2 } from "lucide-react";

// --- COLORS FOR CHARTS ---
const COLORS = ["#3B82F6", "#E5E7EB"]; // Blue (Mapped), Gray (Unmapped)
const ALERT_COLORS = {
  News: "#3B82F6",    // Blue
  Event: "#10B981",   // Green
  Advisory: "#F59E0B",// Amber
  Emergency: "#EF4444"// Red
};

const AnalyticsPreview = () => {
  // 1. Fetch Data
  const { residents, isLoading: loadingResidents } = useResidents();
  const { alerts, isLoading: loadingAlerts } = useAlerts();

  // 2. Compute Stats (Memoized for performance)
  const stats = useMemo(() => {
    if (loadingResidents || loadingAlerts) return null;

    // A. Resident Stats
    const totalResidents = residents.length;
    const mappedResidents = residents.filter(r => r.latitude && r.longitude).length;
    const unmappedResidents = totalResidents - mappedResidents;
    const mappingPercentage = totalResidents > 0
      ? Math.round((mappedResidents / totalResidents) * 100)
      : 0;

    // B. Alert Stats
    // Group alerts by Category for the Bar Chart
    const alertsByCategory = alerts.reduce((acc, curr) => {
      const cat = curr.category || "News";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const chartDataAlerts = Object.keys(alertsByCategory).map(key => ({
      name: key,
      count: alertsByCategory[key],
      fill: ALERT_COLORS[key] || "#9CA3AF"
    }));

    // C. Pie Chart Data
    const chartDataMapping = [
      { name: "Mapped", value: mappedResidents },
      { name: "Unmapped", value: unmappedResidents },
    ];

    // D. Active Emergencies
    const activeEmergencies = alerts.filter(a => a.is_urgent).length;

    return {
      totalResidents,
      mappedResidents,
      mappingPercentage,
      totalAlerts: alerts.length,
      activeEmergencies,
      chartDataAlerts,
      chartDataMapping
    };
  }, [residents, alerts, loadingResidents, loadingAlerts]);

  if (loadingResidents || loadingAlerts) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* --- ROW 1: KEY METRICS CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Residents"
          value={stats.totalResidents}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Mapped Households"
          value={`${stats.mappedResidents} (${stats.mappingPercentage}%)`}
          icon={MapPin}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Total Alerts"
          value={stats.totalAlerts}
          icon={Bell}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Active Emergencies"
          value={stats.activeEmergencies}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* --- ROW 2: CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CHART 1: RESIDENT MAPPING STATUS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-gray-700 font-bold mb-4">Mapping Coverage</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartDataMapping}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartDataMapping.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            Residents with vs. without GPS location
          </p>
        </div>

        {/* CHART 2: ALERT DISTRIBUTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-gray-700 font-bold mb-4">Alert Distribution by Type</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartDataAlerts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            Historical breakdown of all announcements
          </p>
        </div>

      </div>
    </div>
  );
};

// --- SMALL REUSABLE COMPONENT FOR CARDS ---
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
    </div>
  </div>
);

export default AnalyticsPreview;
