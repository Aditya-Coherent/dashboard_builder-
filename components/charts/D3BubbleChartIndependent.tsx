'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import * as d3 from 'd3'
import { useDashboardStore } from '@/lib/store'
import { getChartColor } from '@/lib/chart-theme'
import { filterData } from '@/lib/data-processor'
import { GeographyMultiSelect } from '@/components/filters/GeographyMultiSelect'
import { AggregationLevelSelector } from '@/components/filters/AggregationLevelSelector'
import { CascadeFilter } from '@/components/filters/CascadeFilter'
import { BusinessTypeFilter } from '@/components/filters/BusinessTypeFilter'
import { Layers, ChevronDown, X, Tag, Plus } from 'lucide-react'
import type { DataRecord } from '@/lib/types'

// Wrapper components for opportunity matrix filters
function OpportunityGeographyMultiSelect() {
  const { data, opportunityFilters, updateOpportunityFilters } = useDashboardStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const shouldHide = opportunityFilters.segmentType === 'By Region' || opportunityFilters.segmentType === 'By State'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const geographyOptions = useMemo(() => {
    if (!data || !data.dimensions?.geographies) return []
    const allGeographies = data.dimensions.geographies.all_geographies || []
    if (!searchTerm) return allGeographies
    const search = searchTerm.toLowerCase()
    return allGeographies.filter(geo => geo.toLowerCase().includes(search))
  }, [data, searchTerm])

  if (shouldHide) return null

  const selectedCount = opportunityFilters.geographies.length

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white flex items-center justify-between"
      >
        <span className="text-black">
          {selectedCount === 0 ? 'Select geographies...' : `${selectedCount} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 text-black transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search geographies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
            />
          </div>
          <div className="p-2 space-y-1">
            {geographyOptions.map(geo => {
              const isSelected = opportunityFilters.geographies.includes(geo)
              return (
                <label key={geo} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const current = opportunityFilters.geographies
                      const updated = e.target.checked
                        ? [...current, geo]
                        : current.filter(g => g !== geo)
                      updateOpportunityFilters({ geographies: updated })
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-black">{geo}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function OpportunityAggregationLevelSelector() {
  const { opportunityFilters, updateOpportunityFilters } = useDashboardStore()

  const handleLevelChange = (level: number | null) => {
    updateOpportunityFilters({ aggregationLevel: level })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black flex items-center gap-2">
        <Layers className="h-4 w-4" />
        Aggregation Level
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleLevelChange(null)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            opportunityFilters.aggregationLevel === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          All Levels
        </button>
        {[1, 2, 3, 4, 5, 6].map(level => (
          <button
            key={level}
            type="button"
            onClick={() => handleLevelChange(level)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              opportunityFilters.aggregationLevel === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Level {level}
          </button>
        ))}
      </div>
    </div>
  )
}

function OpportunityBusinessTypeFilter() {
  const { opportunityFilters, updateOpportunityFilters } = useDashboardStore()

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black">
        Business Type
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updateOpportunityFilters({ businessType: undefined })}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
            opportunityFilters.businessType === undefined
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => updateOpportunityFilters({ businessType: 'B2B' })}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
            opportunityFilters.businessType === 'B2B'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          B2B
        </button>
        <button
          type="button"
          onClick={() => updateOpportunityFilters({ businessType: 'B2C' })}
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
            opportunityFilters.businessType === 'B2C'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-black hover:bg-gray-200'
          }`}
        >
          B2C
        </button>
      </div>
    </div>
  )
}

interface BubbleChartProps {
  title?: string
  height?: number
}

interface BubbleDataPoint {
  name: string
  x: number // Will be overwritten by D3 force simulation with pixel position
  y: number // Will be overwritten by D3 force simulation with pixel position
  z: number // Incremental Opportunity Index for bubble size
  radius: number // Calculated radius for visualization
  geography: string
  segment: string
  segmentType: string
  currentValue: number
  cagr: number
  marketShare: number
  absoluteGrowth: number
  color: string
  // Store original index values separately since D3 will overwrite x,y with pixel positions
  xIndex: number       // CAGR Index (0-100)
  yIndex: number       // Market Share Index (0-100)
  zIndex: number       // Incremental Opportunity Index (0-100)
}

interface SelectedSegmentItem {
  type: string
  segment: string
  id: string
}

export function D3BubbleChartIndependent({ title, height = 500 }: BubbleChartProps) {
  const { data, filters, opportunityFilters, updateFilters, updateOpportunityFilters, selectedChartGroup } = useDashboardStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height })
  const [tooltipData, setTooltipData] = useState<BubbleDataPoint | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [maxBubbles, setMaxBubbles] = useState(50) // Slider for bubble count
  
  // Use opportunity filters when in coherent-opportunity mode, otherwise use regular filters
  const isOpportunityMode = selectedChartGroup === 'coherent-opportunity'
  const activeFilters = isOpportunityMode ? opportunityFilters : filters
  const updateActiveFilters = isOpportunityMode ? updateOpportunityFilters : updateFilters
  
  // For opportunity mode: Simple geography and segment type selection
  // For regular mode: Keep existing logic
  const selectedGeography = activeFilters.geographies.length > 0 ? activeFilters.geographies[0] : 
    (data?.dimensions?.geographies?.all_geographies?.[0] || '')
  const selectedSegmentType = activeFilters.segmentType || 
    (data?.dimensions?.segments ? Object.keys(data.dimensions.segments)[0] : '')

  // Get hierarchy for cascade filter (for opportunity mode)
  const segmentDimension = data?.dimensions?.segments?.[selectedSegmentType]
  const hasB2BSegmentation = segmentDimension && (
    (segmentDimension.b2b_hierarchy && Object.keys(segmentDimension.b2b_hierarchy).length > 0) ||
    (segmentDimension.b2c_hierarchy && Object.keys(segmentDimension.b2c_hierarchy).length > 0) ||
    (segmentDimension.b2b_items && segmentDimension.b2b_items.length > 0) ||
    (segmentDimension.b2c_items && segmentDimension.b2c_items.length > 0)
  )
  
  let hierarchy = segmentDimension?.hierarchy || {}
  if (hasB2BSegmentation && isOpportunityMode) {
    if (activeFilters.businessType === 'B2B' && segmentDimension?.b2b_hierarchy) {
      hierarchy = segmentDimension.b2b_hierarchy
    } else if (activeFilters.businessType === 'B2C' && segmentDimension?.b2c_hierarchy) {
      hierarchy = segmentDimension.b2c_hierarchy
    }
  }
  
  // Cascade filter state for opportunity mode
  const [cascadePath, setCascadePath] = useState<string[]>([])
  const [selectedSegments, setSelectedSegments] = useState<SelectedSegmentItem[]>([])
  
  // Initialize selectedSegments from store filters when data loads (opportunity mode)
  useEffect(() => {
    if (isOpportunityMode && data && activeFilters.segments && activeFilters.segments.length > 0 && activeFilters.segmentType) {
      const seen = new Set<string>()
      const segmentsFromStore: SelectedSegmentItem[] = []
      
      activeFilters.segments.forEach((segment) => {
        const id = `${activeFilters.segmentType}::${segment}`
        if (!seen.has(id)) {
          seen.add(id)
          segmentsFromStore.push({
            type: activeFilters.segmentType,
            segment: segment,
            id: id
          })
        }
      })
      
      setSelectedSegments(segmentsFromStore)
    }
  }, [data, activeFilters.segments, activeFilters.segmentType, isOpportunityMode])
  
  // Clear segments when segment type or business type changes (opportunity mode)
  useEffect(() => {
    if (isOpportunityMode && hasB2BSegmentation && selectedSegments.length > 0) {
      setSelectedSegments([])
      setCascadePath([])
      updateActiveFilters({ segments: [], advancedSegments: [] } as any)
    }
  }, [activeFilters.businessType, selectedSegmentType, hasB2BSegmentation, isOpportunityMode, selectedSegments.length, updateActiveFilters])
  
  // Handle cascade filter selection (opportunity mode)
  const handleCascadeSelection = (path: string[]) => {
    setCascadePath(path)
  }
  
  // Add segment from cascade (opportunity mode)
  const handleAddSegment = () => {
    if (!isOpportunityMode || cascadePath.length === 0) return
    
    const segmentToAdd = cascadePath[cascadePath.length - 1]
    const id = `${selectedSegmentType}::${segmentToAdd}`
    const exists = selectedSegments.find(s => s.id === id)
    
    if (!exists) {
      const newSegment: SelectedSegmentItem = {
        type: selectedSegmentType,
        segment: segmentToAdd,
        id: id
      }
      const updated = [...selectedSegments, newSegment]
      setSelectedSegments(updated)
      
      updateActiveFilters({ 
        segments: updated.map(s => s.segment) || [],
        advancedSegments: updated || [],
      } as any)
    }
    
    // Clear selections after adding
    setCascadePath([])
  }
  
  // Remove a segment (opportunity mode)
  const handleRemoveSegment = (id: string) => {
    if (!isOpportunityMode) return
    const updated = selectedSegments.filter(s => s.id !== id)
    setSelectedSegments(updated)
    updateActiveFilters({ 
      segments: updated.map(s => s.segment) || [],
      advancedSegments: updated || [],
    } as any)
  }
  
  // Clear all segments (opportunity mode)
  const handleClearAllSegments = () => {
    if (!isOpportunityMode) return
    setSelectedSegments([])
    setCascadePath([])
    updateActiveFilters({ 
      segments: [], 
      advancedSegments: [],
    } as any)
  }

  // Calculate chart data based on selected filters
  const chartData = useMemo(() => {
    if (!data) {
      return { bubbles: [], xLabel: '', yLabel: '', totalBubbles: 0 }
    }

    // For opportunity mode: Simple Geography x Segment Type matrix using CAGR from JSON
    if (isOpportunityMode) {
      const dataset = activeFilters.dataType === 'value'
        ? data.data.value.geography_segment_matrix
        : data.data.volume.geography_segment_matrix

      // Get all geographies and segment types
      const allGeographies = data.dimensions.geographies.all_geographies || []
      const allSegmentTypes = Object.keys(data.dimensions.segments) || []
      
      // Filter geographies if selected
      const geographiesToShow = activeFilters.geographies.length > 0 
        ? activeFilters.geographies 
        : allGeographies
      
      // Filter segment types if selected
      const segmentTypesToShow = activeFilters.segmentType 
        ? [activeFilters.segmentType]
        : allSegmentTypes

      // Get records at the selected aggregation level
      // If aggregation level is null, use Level 1 (total aggregation)
      const targetLevel = activeFilters.aggregationLevel !== null && activeFilters.aggregationLevel !== undefined
        ? activeFilters.aggregationLevel
        : 1

      // Filter records by aggregation level, geography, and segment type
      let filteredRecords = dataset.filter(record => 
        record.aggregation_level === targetLevel &&
        geographiesToShow.includes(record.geography) &&
        segmentTypesToShow.includes(record.segment_type)
      )

      // For Level 1, segment should be '__ALL_SEGMENTS__' (unless segments are selected)
      if (targetLevel === 1 && (!activeFilters.segments || activeFilters.segments.length === 0)) {
        filteredRecords = filteredRecords.filter(record => record.segment === '__ALL_SEGMENTS__')
      }
      
      // If segments are selected, filter by those segments
      if (activeFilters.segments && activeFilters.segments.length > 0) {
        filteredRecords = filteredRecords.filter(record => 
          activeFilters.segments.includes(record.segment)
        )
      }

      // Build matrix: Geography x Segment Type with CAGR from JSON
      const bubbles: BubbleDataPoint[] = []
      const [startYear, endYear] = activeFilters.yearRange
      
      // Calculate max values for normalization
      let maxCAGR = 0
      let maxValue = 0
      
      filteredRecords.forEach(record => {
        const cagr = record.cagr || 0
        const value = record.time_series[endYear] || 0
        maxCAGR = Math.max(maxCAGR, Math.abs(cagr))
        maxValue = Math.max(maxValue, value)
      })

      filteredRecords.forEach((record, index) => {
        const cagr = record.cagr || 0 // Use CAGR directly from JSON
        const value = record.time_series[endYear] || 0
        const baseValue = record.time_series[startYear] || 0
        
        // Normalize to 0-100 scale
        const cagrIndex = maxCAGR > 0 ? (Math.abs(cagr) / maxCAGR) * 100 : 0
        const valueIndex = maxValue > 0 ? (value / maxValue) * 100 : 0
        
        // For Level 1, use segment_type as the segment name
        // For other levels, use the actual segment name
        const segmentName = targetLevel === 1 ? record.segment_type : record.segment
        
        bubbles.push({
          name: `${record.geography} - ${segmentName}`,
          x: cagrIndex,
          y: valueIndex,
          z: cagrIndex, // Use CAGR index for bubble size
          radius: 0, // Will be calculated
          geography: record.geography,
          segment: segmentName,
          segmentType: record.segment_type,
          currentValue: value,
          cagr: cagr, // CAGR from JSON
          marketShare: 0,
          absoluteGrowth: value - baseValue,
          color: getChartColor(index % 10),
          xIndex: cagrIndex,
          yIndex: valueIndex,
          zIndex: cagrIndex
        })
      })

      const limitedBubbles = bubbles.slice(0, maxBubbles)
      return { 
        bubbles: limitedBubbles, 
        xLabel: 'CAGR Index (from JSON)', 
        yLabel: 'Market Size Index', 
        totalBubbles: bubbles.length 
      }
    }

    // Regular mode: Keep existing logic
    if (!selectedGeography || !selectedSegmentType) {
      return { bubbles: [], xLabel: '', yLabel: '', totalBubbles: 0 }
    }

    const dataset = activeFilters.dataType === 'value'
      ? data.data.value.geography_segment_matrix
      : data.data.volume.geography_segment_matrix

    // Use filterData to apply all filters (geography, segment type, aggregation level, segments, etc.)
    const filteredRecords = filterData(dataset, {
      ...activeFilters,
      geographies: [selectedGeography], // Use single geography for bubble chart
      advancedSegments: activeFilters.advancedSegments || [] as any
    })

    if (filteredRecords.length === 0) {
      return { bubbles: [], xLabel: '', yLabel: '', totalBubbles: 0 }
    }

    // Group records by segment for aggregation
    const segmentGroups = new Map<string, DataRecord[]>()
    
    filteredRecords.forEach(record => {
      const segmentKey = record.segment
      if (!segmentGroups.has(segmentKey)) {
        segmentGroups.set(segmentKey, [])
      }
      segmentGroups.get(segmentKey)!.push(record)
    })
    
    const segmentsToProcess = Array.from(segmentGroups.keys())

    // Calculate metrics for each segment
    const [startYear, endYear] = activeFilters.yearRange
    const forecastYear = endYear
    const baseYear = startYear
    
    // Calculate total market value for market share calculation
    const leafRecords = filteredRecords.filter(record => record.is_aggregated === false)
    let totalMarketValue2024 = 0
    leafRecords.forEach(record => {
      const value = record.time_series[baseYear] || 0
      totalMarketValue2024 += value
    })

    // Calculate metrics for each segment group
    const segmentData: Array<{
      segment: string
      baseValue: number
      forecastValue: number
      cagr: number
      marketShare2024: number
      absoluteGrowth: number
      index: number
    }> = []
    
    segmentsToProcess.forEach((segment, index) => {
      const segmentRecords = segmentGroups.get(segment) || []
      
      if (segmentRecords.length === 0) return
      
      // Aggregate values across all records in this segment group
      let forecastValue = 0
      let baseValue = 0
      
      segmentRecords.forEach(record => {
        const base = record.time_series[baseYear] || 0
        const forecast = record.time_series[forecastYear] || 0
        forecastValue += forecast
        baseValue += base
      })
      
      // Calculate market share based on base year values
      const marketShare2024 = totalMarketValue2024 > 0 ? (baseValue / totalMarketValue2024) * 100 : 0
      
      // Use CAGR from JSON if available (prefer aggregated records)
      let calculatedCAGR = 0
      const aggregatedRecord = segmentRecords.find(r => r.is_aggregated && r.cagr)
      if (aggregatedRecord && aggregatedRecord.cagr !== undefined && aggregatedRecord.cagr !== null) {
        // cagr is defined as number in DataRecord, but JSON might have it as string
        const cagrValue: number | string = aggregatedRecord.cagr as any
        if (typeof cagrValue === 'string') {
          calculatedCAGR = parseFloat(cagrValue.replace('%', '').trim()) || 0
        } else {
          calculatedCAGR = cagrValue
        }
      } else if (baseValue > 0 && forecastValue > 0) {
        // Fallback: Calculate from aggregated values
        const years = forecastYear - baseYear
        if (years > 0) {
          const growthRatio = Math.min(forecastValue / baseValue, 100)
          calculatedCAGR = (Math.pow(growthRatio, 1 / years) - 1) * 100
          calculatedCAGR = Math.min(calculatedCAGR, 100)
        }
      }
      
      const absoluteGrowth = forecastValue - baseValue
      
      if (forecastValue > 0 && baseValue > 0 && !isNaN(marketShare2024) && !isNaN(calculatedCAGR)) {
        segmentData.push({
          segment,
          baseValue,
          forecastValue,
          cagr: Math.max(0, calculatedCAGR),
          marketShare2024,
          absoluteGrowth,
          index
        })
      }
    })
    
    // Find maximum values for index calculations
    const maxCAGR = Math.max(...segmentData.map(d => d.cagr))
    const maxMarketShare2024 = Math.max(...segmentData.map(d => d.marketShare2024))
    const maxAbsoluteGrowth = Math.max(...segmentData.map(d => d.absoluteGrowth))
    
    // Debug: Log all segment data to understand the values
    console.log('Segment Data for Index Calculation:', segmentData.map(d => ({
      segment: d.segment,
      baseValue: d.baseValue.toFixed(2),
      forecastValue: d.forecastValue.toFixed(2),
      marketShare2024: d.marketShare2024.toFixed(2) + '%',
      absoluteGrowth: d.absoluteGrowth.toFixed(2),
      cagr: d.cagr.toFixed(2) + '%',
      growthMultiple: (d.forecastValue / d.baseValue).toFixed(2) + 'x'
    })))
    
    console.log('Max Values:', {
      maxCAGR: maxCAGR.toFixed(2) + '%',
      maxMarketShare2024: maxMarketShare2024.toFixed(2) + '%',
      maxAbsoluteGrowth: maxAbsoluteGrowth.toFixed(2)
    })
    
    // Check correlation between market share and absolute growth
    const correlationCheck = segmentData.map(d => ({
      segment: d.segment,
      shareRatio: (d.marketShare2024 / maxMarketShare2024).toFixed(3),
      growthRatio: (d.absoluteGrowth / maxAbsoluteGrowth).toFixed(3),
      difference: Math.abs((d.marketShare2024 / maxMarketShare2024) - (d.absoluteGrowth / maxAbsoluteGrowth)).toFixed(4)
    }))
    
    console.log('Correlation Check (Share vs Growth ratios):', correlationCheck)
    
    // Second pass: Calculate indices and create bubble data
    const bubbles: BubbleDataPoint[] = []
    
    segmentData.forEach(data => {
      // Calculate indices (0-100 scale)
      // Cap all indices at 100 to ensure they never exceed the maximum
      const cagrIndex = maxCAGR > 0 ? Math.min(100, (data.cagr / maxCAGR) * 100) : 0
      const marketShareIndex = maxMarketShare2024 > 0 ? Math.min(100, (data.marketShare2024 / maxMarketShare2024) * 100) : 0
      const incrementalOpportunityIndex = maxAbsoluteGrowth > 0 ? Math.min(100, (data.absoluteGrowth / maxAbsoluteGrowth) * 100) : 0
      
      // Debug each segment's indices
      console.log(`Indices for ${data.segment}:`, {
        marketShare: data.marketShare2024.toFixed(2),
        marketShareIndex: marketShareIndex.toFixed(1),
        absoluteGrowth: data.absoluteGrowth.toFixed(2),
        incrementalOpportunityIndex: incrementalOpportunityIndex.toFixed(1),
        cagr: data.cagr.toFixed(2),
        cagrIndex: cagrIndex.toFixed(1)
      })
      
      bubbles.push({
        name: data.segment,
        x: cagrIndex,                        // Will be overwritten by D3
        y: marketShareIndex,                 // Will be overwritten by D3
        z: incrementalOpportunityIndex,      // Incremental Opportunity Index for bubble size
        radius: 0, // Will be calculated later
        geography: selectedGeography,
        segment: data.segment,
        segmentType: selectedSegmentType,
        currentValue: data.forecastValue,
        cagr: data.cagr,                    // Store actual CAGR for tooltip
        marketShare: data.marketShare2024,   // Store actual market share for tooltip
        absoluteGrowth: data.absoluteGrowth, // Store actual growth for tooltip
        color: getChartColor(data.index % 10),
        // Store index values separately
        xIndex: cagrIndex,                   // CAGR Index (0-100)
        yIndex: marketShareIndex,            // Market Share Index (0-100)
        zIndex: incrementalOpportunityIndex  // Incremental Opportunity Index (0-100)
      })
    })
    
    // Sort by incremental opportunity index for better visualization
    bubbles.sort((a, b) => b.z - a.z)
    
    // Limit bubbles based on slider
    const limitedBubbles = bubbles.slice(0, maxBubbles)

    const xLabel = 'CAGR Index'
    const yLabel = 'Market Share Index (2024)'

    return { bubbles: limitedBubbles, xLabel, yLabel, totalBubbles: bubbles.length }
  }, [data, activeFilters, selectedGeography, selectedSegmentType, maxBubbles, isOpportunityMode])

  // Update dimensions on container resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setDimensions({ width: Math.max(width, 400), height })
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [height])

  // D3 chart rendering
  useEffect(() => {
    if (!svgRef.current || chartData.bubbles.length === 0) return

    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Calculate domains - Now working with 0-100 indices
    const xExtent = d3.extent(chartData.bubbles, d => d.x) as [number, number]
    const yExtent = d3.extent(chartData.bubbles, d => d.y) as [number, number]
    const zExtent = d3.extent(chartData.bubbles, d => d.z) as [number, number]

    // Calculate bubble sizes - Scale based on Incremental Opportunity Index (0-100)
    const maxBubbleRadius = Math.min(width, height) / 8
    const minBubbleRadius = 20

    const radiusScale = d3.scaleSqrt()
      .domain([0, 100]) // Index is 0-100
      .range([minBubbleRadius, maxBubbleRadius])

    // Update bubble radii
    chartData.bubbles.forEach(bubble => {
      bubble.radius = radiusScale(bubble.z)
    })

    const maxRadius = Math.max(...chartData.bubbles.map(b => b.radius))
    const padding = maxRadius * 0.8

    // X scale - CAGR Index (0-100)
    const xScale = d3.scaleLinear()
      .domain([0, 110]) // Fixed 0-110 for index (with 10% padding)
      .range([padding, width - padding])

    // Y scale - Market Share Index (0-100)
    const yScale = d3.scaleLinear()
      .domain([0, 110]) // Fixed 0-110 for index (with 10% padding)
      .range([height - padding, padding])

    // Add grid lines
    const xGrid = d3.axisBottom(xScale)
      .tickSize(-height + padding * 2)
      .tickFormat(() => '')

    const yGrid = d3.axisLeft(yScale)
      .tickSize(-width + padding * 2)
      .tickFormat(() => '')

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - padding})`)
      .call(xGrid)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${padding},0)`)
      .call(yGrid)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)

    // Add X axis - CAGR Index
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${(d as number).toFixed(0)}`)

    g.append('g')
      .attr('transform', `translate(0,${height - padding})`)
      .call(xAxis)
      .style('font-size', '10px')
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#000000')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .text(chartData.xLabel)

    // Add Y axis - Market Share Index
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${(d as number).toFixed(0)}`)

    g.append('g')
      .attr('transform', `translate(${padding},0)`)
      .call(yAxis)
      .style('font-size', '10px')
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', '#000000')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .text(chartData.yLabel)

    // Create force simulation - use xIndex and yIndex for positioning
    const simulation = d3.forceSimulation(chartData.bubbles as any)
      .force('x', d3.forceX<BubbleDataPoint>(d => xScale(d.xIndex)).strength(1))
      .force('y', d3.forceY<BubbleDataPoint>(d => yScale(d.yIndex)).strength(1))
      .force('collide', d3.forceCollide<BubbleDataPoint>(d => d.radius + 3))
      .stop()

    // Run simulation
    for (let i = 0; i < 120; ++i) {
      simulation.tick()
      
      chartData.bubbles.forEach((d: any) => {
        d.x = Math.max(xScale.range()[0] + d.radius, 
              Math.min(xScale.range()[1] - d.radius, d.x))
        d.y = Math.max(yScale.range()[1] + d.radius,
              Math.min(yScale.range()[0] - d.radius, d.y))
      })
    }

    // Add bubbles
    const bubbles = g.append('g')
      .selectAll('circle')
      .data(chartData.bubbles)
      .enter()
      .append('circle')
      .attr('cx', d => (d as any).x || xScale(d.xIndex))
      .attr('cy', d => (d as any).y || yScale(d.yIndex))
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', 0.9)
          .attr('stroke-width', 3)

        setTooltipData(d)
        const [mouseX, mouseY] = d3.pointer(event, svg.node())
        setTooltipPosition({ x: mouseX, y: mouseY })
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', 0.7)
          .attr('stroke-width', 2)

        setTooltipData(null)
      })

    // Add labels for larger bubbles
    const labels = g.append('g')
      .selectAll('text')
      .data(chartData.bubbles.filter(d => d.radius > 25))
      .enter()
      .append('text')
      .attr('x', d => (d as any).x || xScale(d.x))
      .attr('y', d => (d as any).y || yScale(d.y))
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name)

    // Add legend note
    svg.append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', dimensions.height - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#000000')
      .style('font-style', 'italic')
      .text(`Bubble size represents 2032 market size in ${selectedGeography} | All values projected to 2032`)

  }, [chartData, dimensions, selectedGeography])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-black">Loading data...</p>
        </div>
      </div>
    )
  }

  const unit = filters.dataType === 'value'
    ? `${data.metadata.currency} ${data.metadata.value_unit}`
    : data.metadata.volume_unit

  return (
    <div className="w-full min-w-0 overflow-hidden" ref={containerRef}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-black">{title}</h3>
      )}
      
      {/* Filters - Same as Market Analysis */}
      <div className="mb-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Geography Filter */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Geography
            </label>
            {isOpportunityMode ? (
              <OpportunityGeographyMultiSelect />
            ) : (
              <GeographyMultiSelect />
            )}
          </div>
          
          {/* Product Type (Segment Type) - Use store filters */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              {isOpportunityMode ? 'Product Type' : 'Segment Type'}
            </label>
            <select
              value={activeFilters.segmentType || ''}
              onChange={(e) => {
                const newSegmentType = e.target.value
                // Clear cascade path and selected segments when segment type changes
                if (isOpportunityMode) {
                  setCascadePath([])
                  setSelectedSegments([])
                  updateActiveFilters({ 
                    segmentType: newSegmentType,
                    segments: [],
                    advancedSegments: []
                  } as any)
                } else {
                  updateActiveFilters({ segmentType: newSegmentType })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
            >
              {isOpportunityMode && (
                <option value="">All Product Types</option>
              )}
              {data?.dimensions?.segments ? Object.keys(data.dimensions.segments).map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              )) : null}
            </select>
          </div>
        </div>
        
        {/* Data Type - Only for opportunity mode */}
        {isOpportunityMode && (
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Data Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateActiveFilters({ dataType: 'value' })}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeFilters.dataType === 'value'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                Value
              </button>
              <button
                onClick={() => updateActiveFilters({ dataType: 'volume' })}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeFilters.dataType === 'volume'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                Volume
              </button>
            </div>
          </div>
        )}
        
        {/* Business Type Filter - Only for opportunity mode with B2B/B2C segmentation */}
        {isOpportunityMode && hasB2BSegmentation && (
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Business Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateActiveFilters({ businessType: 'B2B', segments: [], advancedSegments: [] } as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilters.businessType === 'B2B'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                B2B
              </button>
              <button
                onClick={() => updateActiveFilters({ businessType: 'B2C', segments: [], advancedSegments: [] } as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilters.businessType === 'B2C'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                B2C
              </button>
            </div>
          </div>
        )}
        
        {/* Cascade Filter - Only for opportunity mode when segment type is selected and has hierarchy */}
        {isOpportunityMode && selectedSegmentType && selectedSegmentType !== '' && Object.keys(hierarchy).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Segment Selection (Cascade)
            </label>
            <CascadeFilter
              hierarchy={hierarchy}
              selectedPath={cascadePath}
              onSelectionChange={handleCascadeSelection}
              maxLevels={5}
              placeholder="Select Level 1..."
            />
            
            {/* Add Button - Only show if a path is selected */}
            {cascadePath.length > 0 && (
              <button
                onClick={handleAddSegment}
                className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Selected Segment</span>
              </button>
            )}
            
            {/* Selected Segments Display */}
            {selectedSegments.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-xs font-medium text-blue-900">
                    <Tag className="h-3 w-3 mr-1" />
                    Selected Segments ({selectedSegments.length})
                  </div>
                  <button
                    onClick={handleClearAllSegments}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedSegments.map(seg => (
                    <span
                      key={seg.id}
                      className="inline-flex items-center px-2 py-1 text-xs bg-white text-blue-800 rounded border border-blue-200"
                    >
                      {seg.segment}
                      <button
                        onClick={() => handleRemoveSegment(seg.id)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Aggregation Level Selector - To see CAGR at different levels */}
        <div>
          {isOpportunityMode ? (
            <OpportunityAggregationLevelSelector />
          ) : (
            <AggregationLevelSelector />
          )}
        </div>
        
        {/* Bubble Count Slider */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Maximum Bubbles to Display: {maxBubbles}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={maxBubbles}
            onChange={(e) => setMaxBubbles(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-black mt-1">
            <span>10</span>
            <span>200</span>
          </div>
          {chartData.totalBubbles && chartData.totalBubbles > maxBubbles && (
            <p className="text-xs text-amber-600 mt-1">
              Showing {maxBubbles} of {chartData.totalBubbles} bubbles. Increase slider to see more.
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        <svg ref={svgRef} className="w-full" />
        
        {/* Custom Tooltip */}
        {tooltipData && (
          <div
            className="absolute bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[280px] z-50 pointer-events-none"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: tooltipPosition.x > dimensions.width / 2 ? 'translateX(-100%)' : 'none'
            }}
          >
            <p className="font-semibold text-black mb-3 pb-2 border-b border-gray-200">
              {tooltipData.name}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Geography:</span>
                <span className="text-sm font-medium text-black">
                  {tooltipData.geography}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-black">Segment Type:</span>
                <span className="text-sm font-medium text-black">
                  {tooltipData.segmentType}
                </span>
              </div>
              
              {/* Index Values Section */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-black mb-2">INDEX VALUES</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">CAGR Index:</span>
                  <span className="text-sm font-bold text-purple-600">
                    {tooltipData.xIndex.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Market Share Index (2024):</span>
                  <span className="text-sm font-bold text-purple-600">
                    {tooltipData.yIndex.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Incremental Opportunity Index:</span>
                  <span className="text-sm font-bold text-purple-600">
                    {tooltipData.zIndex.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {/* Actual Values Section */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-black mb-2">ACTUAL VALUES</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Market Size (2032):</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-black">
                      {tooltipData.currentValue.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                    <span className="text-xs text-black ml-1">{unit}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Market Share (2024):</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {tooltipData.marketShare.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">CAGR (2024-2032):</span>
                  <span className={`text-sm font-semibold ${
                    tooltipData.cagr > 0 ? 'text-green-600' : tooltipData.cagr < 0 ? 'text-red-600' : 'text-black'
                  }`}>
                    {tooltipData.cagr > 0 ? '+' : ''}{tooltipData.cagr.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">Growth (2024-2032):</span>
                  <span className={`text-sm font-semibold ${
                    tooltipData.absoluteGrowth > 0 ? 'text-green-600' : tooltipData.absoluteGrowth < 0 ? 'text-red-600' : 'text-black'
                  }`}>
                    {tooltipData.absoluteGrowth > 0 ? '+' : ''}
                    {tooltipData.absoluteGrowth.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} {unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-black mb-3">Chart Dimensions (Index Scale 0-100)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-xs">X</span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">CAGR Index</p>
                <p className="text-xs text-black">
                  {isOpportunityMode 
                    ? 'CAGR from JSON (attractiveness indicator)'
                    : 'Growth rate relative to max'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-xs">Y</span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">
                  {isOpportunityMode ? 'Market Size Index' : 'Market Share Index (2024)'}
                </p>
                <p className="text-xs text-black">
                  {isOpportunityMode 
                    ? 'Market size relative to max'
                    : 'Current position relative to leader'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold text-xs">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">
                  {isOpportunityMode ? 'CAGR Index (Size)' : 'Incremental Opportunity Index'}
                </p>
                <p className="text-xs text-black">
                  {isOpportunityMode 
                    ? 'Bubble size represents CAGR attractiveness'
                    : 'Absolute growth potential (bubble size)'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-black">
            {isOpportunityMode ? (
              <>
                Showing {chartData.bubbles.length} geography × product type combinations
                {chartData.totalBubbles && chartData.totalBubbles > chartData.bubbles.length && ` (${chartData.totalBubbles} total available)`}
              </>
            ) : (
              <>
                Showing {chartData.bubbles.length} {selectedSegmentType} segments in {selectedGeography}
                {chartData.totalBubbles && chartData.totalBubbles > chartData.bubbles.length && ` (${chartData.totalBubbles} total available)`}
              </>
            )}
          </p>
          <p className="text-xs text-black mt-1">
            {isOpportunityMode 
              ? 'Attractiveness matrix: Geography × Product Type. CAGR values from JSON aggregations. Use aggregation level to view CAGR at different hierarchy levels.'
              : 'Hover over bubbles for detailed metrics'}
          </p>
        </div>
      </div>
    </div>
  )
}
