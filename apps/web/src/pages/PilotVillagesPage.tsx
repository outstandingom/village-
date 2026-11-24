import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import type { Village } from '@betul/shared-types';
import { apiRequest } from '../services/api';

interface VillageWithMetrics extends Village {
  metrics?: {
    totalRecords: number;
    verifiedRecords: number;
    pendingRecords: number;
    completionPercent: number;
  };
}

export function PilotVillagesPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['villages', 'pilot'],
    queryFn: () => apiRequest<{ villages: VillageWithMetrics[] }>('/villages?pilot=true'),
  });

  const villages = data?.villages ?? [];

  useEffect(() => {
    if (!mapRef.current || villages.length === 0) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([21.88, 77.9], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);
    }

    const map = leafletMap.current;
    const markers: L.CircleMarker[] = [];

    villages.forEach((v) => {
      const marker = L.circleMarker([v.latitude, v.longitude], {
        radius: 9,
        color: '#0f2942',
        fillColor: '#f59e0b',
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(
          `<strong>${v.nameEn} (${v.nameHi})</strong><br/>LGD Code: ${v.lgdCode}<br/>Block: ${v.blockName}`,
        );
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [villages]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Betul 5-Village Pilot</h2>
        <p className="text-sm text-slate-600 mt-1">
          Pilot villages identified by LGD codes. Marked as Demonstration Data until official census/department imports.
        </p>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div ref={mapRef} className="h-72 w-full z-0" />
      </div>

      {/* Responsive Village Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading pilot villages...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3">LGD Code</th>
                <th className="px-4 py-3">Block / Tehsil</th>
                {villages[0]?.metrics && (
                  <>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Progress</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {villages.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{v.nameEn}</div>
                    <div className="text-xs text-slate-500">{v.nameHi}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{v.lgdCode}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {v.blockName} / {v.tehsilName}
                  </td>
                  {v.metrics && (
                    <>
                      <td className="px-4 py-3 font-medium text-emerald-700">
                        {v.metrics.verifiedRecords}
                      </td>
                      <td className="px-4 py-3 font-medium text-amber-700">
                        {v.metrics.pendingRecords}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0f2942]"
                              style={{ width: `${v.metrics.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{v.metrics.completionPercent}%</span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
