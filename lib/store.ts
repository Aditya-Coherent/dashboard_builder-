import { create } from 'zustand'
import type { FilterState, ComparisonData } from './types'
import type { ChartGroupId } from './chart-groups'
import { DEFAULT_CHART_GROUP } from './chart-groups'

interface DashboardStore {
  data: ComparisonData | null
  filteredData: any[] // Will hold filtered records
  filters: FilterState // Market analysis filters
  opportunityFilters: FilterState // Opportunity matrix filters (separate)
  isLoading: boolean
  error: string | null
  selectedChartGroup: ChartGroupId
  defaultFiltersLoaded: boolean // Track if default filters are loaded
  opportunityFiltersLoaded: boolean // Track if opportunity filters are loaded
  geographyFiltersBySegmentType: Record<string, string[]> // Store geography filters per segment type
  
  // Actions
  setData: (data: ComparisonData) => void
  updateFilters: (filters: Partial<FilterState>) => void
  updateOpportunityFilters: (filters: Partial<FilterState>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetFilters: () => void
  resetOpportunityFilters: () => void
  setSelectedChartGroup: (groupId: ChartGroupId) => void
  loadDefaultFilters: () => void // Load default filters based on data
  loadDefaultOpportunityFilters: () => void // Load default opportunity filters
  saveGeographyFiltersForSegmentType: (segmentType: string, geographies: string[]) => void
  getGeographyFiltersForSegmentType: (segmentType: string) => string[] | undefined
}

// Helper function to check if data has B2B/B2C segmentation
export function hasB2BSegmentation(data: ComparisonData | null, segmentType: string): boolean {
  if (!data || !segmentType) return false
  const segmentDimension = data.dimensions.segments[segmentType]
  return !!(segmentDimension && (
    (segmentDimension.b2b_hierarchy && Object.keys(segmentDimension.b2b_hierarchy).length > 0) ||
    (segmentDimension.b2c_hierarchy && Object.keys(segmentDimension.b2c_hierarchy).length > 0) ||
    (segmentDimension.b2b_items && segmentDimension.b2b_items.length > 0) ||
    (segmentDimension.b2c_items && segmentDimension.b2c_items.length > 0)
  ))
}

// Helper function to get default filters based on data
function getDefaultFilters(data: ComparisonData | null): FilterState {
  if (!data) {
    return {
      geographies: [],
      segments: [],
      segmentType: '',
      yearRange: [2020, 2024],
      dataType: 'value',
      viewMode: 'segment-mode',
      businessType: undefined,
      aggregationLevel: null,
    }
  }

  const firstSegmentType = Object.keys(data.dimensions.segments)[0] || ''
  const startYear = data.metadata.start_year
  const baseYear = data.metadata.base_year
  const forecastYear = data.metadata.forecast_year
  
  // Get first geography for default view
  const firstGeography = data.dimensions.geographies.all_geographies?.[0] || ''
  
  // Get first few segments from the first segment type (for default view)
  const segmentDimension = data.dimensions.segments[firstSegmentType]
  const firstSegments = segmentDimension?.items?.slice(0, 3) || []
  
  // Set default business type only if B2B/B2C exists
  let defaultBusinessType: 'B2B' | 'B2C' | undefined = undefined
  if (hasB2BSegmentation(data, firstSegmentType)) {
    defaultBusinessType = 'B2B'
  }

  return {
    geographies: firstGeography ? [firstGeography] : [],
    segments: firstSegments,
    segmentType: firstSegmentType,
    yearRange: [baseYear, Math.min(baseYear + 4, forecastYear)],
    dataType: 'value',
    viewMode: 'segment-mode',
    businessType: defaultBusinessType,
    aggregationLevel: null, // Show all levels by default
  }
}

// Helper function to get default opportunity matrix filters
// These are optimized for CAGR-based opportunity analysis
function getDefaultOpportunityFilters(data: ComparisonData | null): FilterState {
  if (!data) {
    return {
      geographies: [],
      segments: [],
      segmentType: '',
      yearRange: [2024, 2032], // Focus on forecast period for CAGR analysis
      dataType: 'value',
      viewMode: 'segment-mode',
      businessType: undefined,
      aggregationLevel: null, // Show all levels to see opportunities at different aggregation levels
    }
  }

  const firstSegmentType = Object.keys(data.dimensions.segments)[0] || ''
  const baseYear = data.metadata.base_year
  const forecastYear = data.metadata.forecast_year
  
  // For opportunity matrix, default to first geography (usually India or global)
  const firstGeography = data.dimensions.geographies.all_geographies?.[0] || ''
  
  // Get all segments from the first segment type (to see all opportunities)
  const segmentDimension = data.dimensions.segments[firstSegmentType]
  const allSegments = segmentDimension?.items || []
  
  // Set default business type only if B2B/B2C exists
  let defaultBusinessType: 'B2B' | 'B2C' | undefined = undefined
  if (hasB2BSegmentation(data, firstSegmentType)) {
    defaultBusinessType = 'B2B'
  }

  return {
    geographies: firstGeography ? [firstGeography] : [],
    segments: allSegments, // Show all segments by default for opportunity analysis
    segmentType: firstSegmentType,
    yearRange: [baseYear, forecastYear], // Full forecast range for CAGR calculation
    dataType: 'value',
    viewMode: 'segment-mode',
    businessType: defaultBusinessType,
    aggregationLevel: null, // Show all aggregation levels
  }
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  data: null,
  filteredData: [],
  filters: getDefaultFilters(null),
  opportunityFilters: getDefaultOpportunityFilters(null),
  isLoading: false,
  error: null,
  selectedChartGroup: DEFAULT_CHART_GROUP,
  defaultFiltersLoaded: false,
  opportunityFiltersLoaded: false,
  geographyFiltersBySegmentType: {},
  
  setData: (data) => {
    const defaultFilters = getDefaultFilters(data)
    const defaultOpportunityFilters = getDefaultOpportunityFilters(data)
    set({ 
      data, 
      error: null,
      filters: defaultFilters,
      opportunityFilters: defaultOpportunityFilters,
      defaultFiltersLoaded: true,
      opportunityFiltersLoaded: true
    })
  },
  
  loadDefaultFilters: () => {
    console.log('🔧 Store: loadDefaultFilters called')
    const currentData = get().data
    if (currentData && !get().defaultFiltersLoaded) {
      const currentFilters = get().filters
      const defaultFilters = getDefaultFilters(currentData)
      // Preserve aggregationLevel if it was already set
      const preservedFilters = {
        ...defaultFilters,
        aggregationLevel: currentFilters.aggregationLevel !== null && currentFilters.aggregationLevel !== undefined 
          ? currentFilters.aggregationLevel 
          : defaultFilters.aggregationLevel
      }
      console.log('🔧 Store: loadDefaultFilters - preserving aggregationLevel:', preservedFilters.aggregationLevel)
      set({ 
        filters: preservedFilters,
        defaultFiltersLoaded: true
      })
    }
  },
  
  updateFilters: (newFilters) => {
    console.log('🔧 Store: updateFilters called with:', newFilters)
    set((state) => {
      // If segmentType is changing, save current geographies and restore for new type
      if (newFilters.segmentType !== undefined && newFilters.segmentType !== state.filters.segmentType) {
        const oldSegmentType = state.filters.segmentType
        const newSegmentType = newFilters.segmentType
        
        // Save current geography filters for the old segment type
        if (oldSegmentType && state.filters.geographies.length > 0) {
          state.geographyFiltersBySegmentType[oldSegmentType] = [...state.filters.geographies]
        }
        
        // Determine if we should clear or restore geographies for the new segment type
        const shouldClearGeographies = newSegmentType === 'By Region' || newSegmentType === 'By State'
        const savedGeographies = state.geographyFiltersBySegmentType[newSegmentType]
        
        // If it's "By Application VS By Type" and we have saved geographies, restore them
        // Otherwise, if it's "By Region" or "By State", clear geographies
        // Otherwise, use saved geographies if available, or keep current if not changing geographies explicitly
        let newGeographies: string[] = []
        if (shouldClearGeographies) {
          newGeographies = []
        } else if (newSegmentType === 'By Application VS By Type' && savedGeographies) {
          newGeographies = savedGeographies
        } else if (savedGeographies) {
          newGeographies = savedGeographies
        } else if (newFilters.geographies !== undefined) {
          newGeographies = newFilters.geographies || []
        } else {
          newGeographies = state.filters.geographies
        }
        
        // Preserve existing values - don't allow null/undefined to overwrite unless explicitly set
        const updatedFilters: FilterState = {
          ...state.filters,
          // Only update aggregationLevel if it's explicitly provided (including null)
          ...(newFilters.aggregationLevel !== undefined && { aggregationLevel: newFilters.aggregationLevel }),
          // For other filters, merge but preserve existing values
          geographies: newGeographies,
          ...(newFilters.segments !== undefined && { segments: newFilters.segments || [] }),
          segmentType: newSegmentType,
          ...(newFilters.yearRange !== undefined && { yearRange: newFilters.yearRange || [2020, 2024] }),
          ...(newFilters.dataType !== undefined && { dataType: newFilters.dataType || 'value' }),
          ...(newFilters.viewMode !== undefined && { viewMode: newFilters.viewMode || 'segment-mode' }),
          ...(newFilters.businessType !== undefined && { businessType: newFilters.businessType }),
          // Preserve aggregationLevel if not explicitly changed
          aggregationLevel: newFilters.aggregationLevel !== undefined ? newFilters.aggregationLevel : state.filters.aggregationLevel
        }
        
        console.log('🔧 Store: Segment type changed, saved/restored geographies:', {
          oldSegmentType,
          newSegmentType,
          savedForOld: oldSegmentType ? state.geographyFiltersBySegmentType[oldSegmentType] : undefined,
          restoredForNew: newGeographies,
          shouldClear: shouldClearGeographies
        })
        
        return {
          filters: updatedFilters,
          geographyFiltersBySegmentType: { ...state.geographyFiltersBySegmentType }
        }
      }
      
      // Normal filter update (no segment type change)
      // If geographies are being updated, also save them for current segment type
      if (newFilters.geographies !== undefined && state.filters.segmentType) {
        state.geographyFiltersBySegmentType[state.filters.segmentType] = [...(newFilters.geographies || [])]
      }
      
      // Preserve existing values - don't allow null/undefined to overwrite unless explicitly set
      const updatedFilters: FilterState = {
        ...state.filters,
        // Only update aggregationLevel if it's explicitly provided (including null)
        ...(newFilters.aggregationLevel !== undefined && { aggregationLevel: newFilters.aggregationLevel }),
        // For other filters, merge but preserve existing values
        ...(newFilters.geographies !== undefined && { geographies: newFilters.geographies || [] }),
        ...(newFilters.segments !== undefined && { segments: newFilters.segments || [] }),
        ...(newFilters.segmentType !== undefined && { segmentType: newFilters.segmentType || '' }),
        ...(newFilters.yearRange !== undefined && { yearRange: newFilters.yearRange || [2020, 2024] }),
        ...(newFilters.dataType !== undefined && { dataType: newFilters.dataType || 'value' }),
        ...(newFilters.viewMode !== undefined && { viewMode: newFilters.viewMode || 'segment-mode' }),
        ...(newFilters.businessType !== undefined && { businessType: newFilters.businessType }),
        // Preserve aggregationLevel if not explicitly changed
        aggregationLevel: newFilters.aggregationLevel !== undefined ? newFilters.aggregationLevel : state.filters.aggregationLevel
      }
      console.log('🔧 Store: Updated filters:', {
        ...updatedFilters,
        aggregationLevel: updatedFilters.aggregationLevel
      })
      return {
        filters: updatedFilters,
        geographyFiltersBySegmentType: { ...state.geographyFiltersBySegmentType }
      }
    })
  },
  
  saveGeographyFiltersForSegmentType: (segmentType: string, geographies: string[]) => {
    set((state) => ({
      geographyFiltersBySegmentType: {
        ...state.geographyFiltersBySegmentType,
        [segmentType]: [...geographies]
      }
    }))
  },
  
  getGeographyFiltersForSegmentType: (segmentType: string) => {
    return get().geographyFiltersBySegmentType[segmentType]
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  resetFilters: () => {
    console.log('🔧 Store: resetFilters called')
    const currentData = get().data
    const defaultFilters = getDefaultFilters(currentData)
    // Reset aggregationLevel to null when resetting
    set({ 
      filters: {
        ...defaultFilters,
        aggregationLevel: null // Explicitly reset to null on reset
      },
      defaultFiltersLoaded: true
    })
  },
  
  setSelectedChartGroup: (groupId) => {
    set({ selectedChartGroup: groupId })
    // Load default opportunity filters when switching to opportunity matrix
    if (groupId === 'coherent-opportunity' && !get().opportunityFiltersLoaded) {
      const currentData = get().data
      if (currentData) {
        const defaultOpportunityFilters = getDefaultOpportunityFilters(currentData)
        set({ 
          opportunityFilters: defaultOpportunityFilters,
          opportunityFiltersLoaded: true
        })
      }
    }
  },
  
  updateOpportunityFilters: (newFilters) => {
    set((state) => {
      const updatedFilters: FilterState = {
        ...state.opportunityFilters,
        ...(newFilters.geographies !== undefined && { geographies: newFilters.geographies || [] }),
        ...(newFilters.segments !== undefined && { segments: newFilters.segments || [] }),
        ...(newFilters.segmentType !== undefined && { segmentType: newFilters.segmentType || '' }),
        ...(newFilters.yearRange !== undefined && { yearRange: newFilters.yearRange || [2024, 2032] }),
        ...(newFilters.dataType !== undefined && { dataType: newFilters.dataType || 'value' }),
        ...(newFilters.viewMode !== undefined && { viewMode: newFilters.viewMode || 'segment-mode' }),
        ...(newFilters.businessType !== undefined && { businessType: newFilters.businessType }),
        ...(newFilters.aggregationLevel !== undefined && { aggregationLevel: newFilters.aggregationLevel }),
      }
      return { opportunityFilters: updatedFilters }
    })
  },
  
  resetOpportunityFilters: () => {
    const currentData = get().data
    const defaultOpportunityFilters = getDefaultOpportunityFilters(currentData)
    set({ 
      opportunityFilters: defaultOpportunityFilters,
      opportunityFiltersLoaded: true
    })
  },
  
  loadDefaultOpportunityFilters: () => {
    const currentData = get().data
    if (currentData && !get().opportunityFiltersLoaded) {
      const defaultOpportunityFilters = getDefaultOpportunityFilters(currentData)
      set({ 
        opportunityFilters: defaultOpportunityFilters,
        opportunityFiltersLoaded: true
      })
    }
  },
}))

