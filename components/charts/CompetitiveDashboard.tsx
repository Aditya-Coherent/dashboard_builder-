'use client'

import { useEffect, useState } from 'react'
import { getCompanyComparison } from '@/lib/competitive-intelligence-data'

export function CompetitiveDashboard() {
  const [comparisonData, setComparisonData] = useState<{
    headers: string[];
    rows: { label: string; values: (string | number)[] }[];
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      const data = await getCompanyComparison()
      setComparisonData(data)
    }
    loadData()
  }, [])

  if (!comparisonData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-black">Loading competitive data...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-[#168AAD] to-[#1A759F] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/90">
              Key Players Comparison - India Spices Market
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/70">Analysis Year</div>
            <div className="text-lg font-bold text-white">2024</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider min-w-[200px] border-r border-gray-200">
                Company Name
              </th>
              {comparisonData.headers.map((header, idx) => (
                <th 
                  key={header} 
                  className="px-4 py-3 text-center text-xs font-semibold text-black min-w-[150px] border-r border-gray-200"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[#168AAD] font-semibold">
                      {header.length > 20 ? header.substring(0, 20) + '...' : header}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisonData.rows.map((row, rowIdx) => (
              <tr key={row.label} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-black bg-inherit border-r border-gray-200">
                  {row.label}
                </td>
                {row.values.map((value, colIdx) => (
                  <td 
                    key={`${row.label}-${colIdx}`} 
                    className="px-4 py-3 text-sm text-black text-center border-r border-gray-200"
                  >
                    {/* Special formatting for certain rows */}
                    {row.label === "Strategies/Recent Developments" ? (
                      <div className="max-w-[200px] mx-auto">
                        <ul className="text-xs text-left space-y-1">
                          {String(value).split(', ').map((strategy, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-[#52B69A] mr-1">▸</span>
                              <span>{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : row.label === "Product/Service Portfolio" ? (
                      <div className="text-xs font-medium text-[#168AAD]">
                        {value}
                      </div>
                    ) : row.label === "Year of Establishment" ? (
                      <span className="font-semibold">
                        {value}
                      </span>
                    ) : row.label.includes("Revenue") ? (
                      <span className="font-semibold text-green-600">
                        {value}
                      </span>
                    ) : row.label === "Regional Strength" ? (
                      <div className="text-xs">
                        <div className="inline-flex flex-wrap gap-1 justify-center">
                          {String(value).split(', ').map((region, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-1 bg-[#D9ED92] text-[#184E77] rounded text-xs font-medium"
                            >
                              {region}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with insights */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-black">
            <span className="font-semibold">Market Leader:</span> {comparisonData.headers[0]} 
            {comparisonData.rows.find(r => r.label.includes('Market Share'))?.values[0] && 
              ` (${comparisonData.rows.find(r => r.label.includes('Market Share'))?.values[0]}% market share)`}
          </div>
          <div className="text-sm text-black">
            <span className="font-semibold">Total Companies Analyzed:</span> {comparisonData.headers.length}
          </div>
        </div>
      </div>
    </div>
  )
}
