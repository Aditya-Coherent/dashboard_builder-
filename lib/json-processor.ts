/**
 * Dynamic JSON Processor
 * Processes any market JSON structure and converts it to ComparisonData format
 */

import type { ComparisonData, DataRecord, Metadata, GeographyDimension, SegmentDimension, SegmentHierarchy } from './types'
import fs from 'fs/promises'
import path from 'path'

interface RawJsonData {
  [geography: string]: {
    [segmentType: string]: {
      [key: string]: any
    }
  }
}

interface YearData {
  [year: string]: number | string | boolean | null | undefined
}

/**
 * Generator function for async path extraction (memory efficient)
 * This version only yields paths that have year data (for value/volume files)
 */
function* extractPathsGenerator(
  obj: any,
  currentPath: string[] = [],
  depth: number = 0
): Generator<{ path: string[]; data?: YearData }> {
  if (depth > 20 || !obj || typeof obj !== 'object') {
    return
  }

  const keys = Object.keys(obj)
  const hasYearData = keys.some(key => /^\d{4}$/.test(key) || key === 'CAGR')
  
  // If this node has year data, yield it (could be a leaf node or an aggregation node)
  if (hasYearData) {
    const yearData: YearData = {}
    keys.forEach(key => {
      if (/^\d{4}$/.test(key) || key === 'CAGR' || key === '_aggregated' || key === '_level') {
        yearData[key] = obj[key]
      }
    })
    yield { path: currentPath, data: yearData }
    
    // IMPORTANT: Don't return here - continue traversing child objects
    // This allows us to extract both aggregation nodes (with year data) AND their child leaf nodes
    // Aggregations have year data at the same level as child objects, so we need to traverse both
  }

  // Continue traversing child objects (non-year, non-metadata keys)
  for (const key of keys) {
    // Skip year keys and metadata keys - we've already processed them above
    if (/^\d{4}$/.test(key) || key === 'CAGR' || key === '_aggregated' || key === '_level') {
      continue
    }
    
    try {
      yield* extractPathsGenerator(obj[key], [...currentPath, key], depth + 1)
    } catch (error) {
      console.error(`Error extracting path at ${currentPath.join(' > ')} > ${key}:`, error)
    }
  }
}

/**
 * Generator function for extracting ALL paths from structure (even empty objects)
 * This is used for segmentation JSON which may have empty objects at leaf nodes
 */
function* extractStructurePathsGenerator(
  obj: any,
  currentPath: string[] = [],
  depth: number = 0
): Generator<{ path: string[] }> {
  if (depth > 20 || !obj || typeof obj !== 'object') {
    return
  }

  const keys = Object.keys(obj)
  
  // Check if this is a leaf node (empty object or has year data)
  const hasYearData = keys.some(key => /^\d{4}$/.test(key) || key === 'CAGR')
  const isEmptyObject = keys.length === 0
  
  // If it's a leaf node (has year data OR is empty), yield the path
  if (hasYearData || isEmptyObject) {
    yield { path: currentPath }
    return
  }

  // Continue traversing for non-leaf nodes
  for (const key of keys) {
    try {
      yield* extractStructurePathsGenerator(obj[key], [...currentPath, key], depth + 1)
    } catch (error) {
      console.error(`Error extracting structure path at ${currentPath.join(' > ')} > ${key}:`, error)
    }
  }
}

/**
 * Async function to collect paths in chunks (yields control periodically)
 */
async function collectPathsAsync(
  generator: Generator<{ path: string[]; data?: YearData }>,
  chunkSize: number = 1000
): Promise<Array<{ path: string[]; data?: YearData }>> {
  const paths: Array<{ path: string[]; data?: YearData }> = []
  let count = 0
  
  for (const path of generator) {
    paths.push(path)
    count++
    
    // Yield control periodically to avoid blocking
    if (count % chunkSize === 0) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }
  
  return paths
}

/**
 * Extract years asynchronously (yields control periodically)
 */
async function extractYearsAsync(data: RawJsonData): Promise<number[]> {
  const years = new Set<number>()
  
  const traverse = async (obj: any, depth: number = 0): Promise<void> => {
    if (depth > 15 || !obj || typeof obj !== 'object') return
    
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      
      if (/^\d{4}$/.test(key)) {
        const year = parseInt(key, 10)
        if (year >= 1900 && year <= 2100) {
          years.add(year)
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        await traverse(obj[key], depth + 1)
      }
      
      // Yield control every 100 keys
      if (i % 100 === 0) {
        await new Promise(resolve => setImmediate(resolve))
      }
    }
  }
  
  try {
    const geographies = Object.values(data)
    for (const geography of geographies) {
      if (geography && typeof geography === 'object') {
        const segmentTypes = Object.values(geography)
        for (const segmentType of segmentTypes) {
          if (segmentType && typeof segmentType === 'object') {
            await traverse(segmentType)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting years:', error)
    throw new Error(`Failed to extract years: ${error instanceof Error ? error.message : String(error)}`)
  }
  
  const yearArray = Array.from(years).sort((a, b) => a - b)
  if (yearArray.length === 0) {
    throw new Error('No valid years found in data')
  }
  
  return yearArray
}

/**
 * Determine if a path segment is a geography
 */
function isGeography(segment: string, allGeographies: Set<string>): boolean {
  return allGeographies.has(segment)
}

/**
 * Build segment hierarchy from path
 */
function buildSegmentHierarchy(
  path: string[],
  geographyIndex: number,
  segmentTypeIndex: number
): SegmentHierarchy {
  const segmentParts = path.slice(segmentTypeIndex + 1)
  
  return {
    level_1: segmentParts[0] || '',
    level_2: segmentParts[1] || '',
    level_3: segmentParts[2] || '',
    level_4: segmentParts[3] || '',
  }
}

/**
 * Determine segment level (parent or leaf)
 */
function getSegmentLevel(
  path: string[],
  allPaths: Array<{ path: string[] }>,
  segmentTypeIndex: number
): 'parent' | 'leaf' {
  const segmentPath = path.slice(segmentTypeIndex + 1)
  
  // Check if any other path has this as a parent
  const hasChildren = allPaths.some(otherPath => {
    if (otherPath.path.length <= path.length) return false
    const otherSegmentPath = otherPath.path.slice(segmentTypeIndex + 1)
    return otherSegmentPath.slice(0, segmentPath.length).join('|') === segmentPath.join('|')
  })
  
  return hasChildren ? 'parent' : 'leaf'
}

/**
 * Process segment type asynchronously
 */
async function processSegmentTypeAsync(
  structureData: RawJsonData,
  valueData: RawJsonData | null,
  volumeData: RawJsonData | null,
  segmentType: string,
  geographies: string[],
  allYears: number[],
  segmentTypeIndex: number
): Promise<{
  segmentDimension: SegmentDimension
  records: DataRecord[]
}> {
  const allPaths: Array<{ path: string[]; data?: YearData }> = []
  
  // Extract paths directly from valueData to capture ALL data nodes including aggregations
  // This ensures we get aggregations that might not be in structure data
  if (valueData) {
    for (let i = 0; i < geographies.length; i++) {
      const geography = geographies[i]
      
      if (valueData[geography]?.[segmentType]) {
        // Use extractPathsGenerator directly on valueData to get all paths with year data
        // This will capture both leaf nodes and aggregation nodes
        const valueDataGenerator = extractPathsGenerator(
          valueData[geography][segmentType],
          [geography, segmentType]
        )
        
        // Collect all paths with data from valueData
        let count = 0
        for (const pathObj of valueDataGenerator) {
          if (pathObj.data) {
            allPaths.push(pathObj)
            count++
            if (count % 1000 === 0) {
              await new Promise(resolve => setImmediate(resolve))
            }
          }
        }
      }
      
      // Yield control every 5 geographies
      if ((i + 1) % 5 === 0) {
        await new Promise(resolve => setImmediate(resolve))
      }
    }
  } else {
    // Fallback: Extract paths from structure data if valueData is not available
    // Then look up actual data from valueData/volumeData
    for (let i = 0; i < geographies.length; i++) {
      const geography = geographies[i]
      
      // Get structure from segmentation data
      if (structureData[geography]?.[segmentType]) {
        // Extract paths from structure using structure generator (handles empty objects)
        const structureGenerator = extractStructurePathsGenerator(
          structureData[geography][segmentType],
          [geography, segmentType]
        )
        // Collect structure paths (handles empty objects at leaf nodes)
        const structurePaths: Array<{ path: string[] }> = []
        let count = 0
        for (const pathObj of structureGenerator) {
          structurePaths.push(pathObj)
          count++
          if (count % 1000 === 0) {
            await new Promise(resolve => setImmediate(resolve))
          }
        }
        
        // For each path from structure, try to find matching data in valueData
        for (const structurePath of structurePaths) {
          // Try to find matching data in valueData using the same path
          let data: YearData | undefined = undefined
          
          if (valueData && valueData[geography]?.[segmentType]) {
            // Navigate to the same path in valueData
            // The path structure is: [geography, segmentType, ...segmentPath]
            // We need to navigate: valueData[geography][segmentType][...segmentPath]
            let currentValueData: any = valueData[geography][segmentType]
            const segmentPath = structurePath.path.slice(segmentTypeIndex + 1) // Remove geography and segmentType
            
            // Navigate through the segment path
            for (const segmentKey of segmentPath) {
              if (currentValueData && typeof currentValueData === 'object' && currentValueData[segmentKey] !== undefined) {
                currentValueData = currentValueData[segmentKey]
              } else {
                currentValueData = null
                break
              }
            }
            
            // If we found the data, extract year values and aggregation metadata
            if (currentValueData && typeof currentValueData === 'object') {
              const keys = Object.keys(currentValueData)
              const hasYearData = keys.some(key => /^\d{4}$/.test(key) || key === 'CAGR')
              if (hasYearData) {
                data = {}
                keys.forEach(key => {
                  if (/^\d{4}$/.test(key) || key === 'CAGR' || key === '_aggregated' || key === '_level') {
                    data![key] = currentValueData[key]
                  }
                })
              }
            }
          }
          
          // Only add paths that have data (skip structure-only paths without numeric data)
          if (data) {
            allPaths.push({ path: structurePath.path, data })
          }
        }
      }
      
      // Yield control every 5 geographies
      if ((i + 1) % 5 === 0) {
        await new Promise(resolve => setImmediate(resolve))
      }
    }
  }
  
  // Build segment hierarchy and records
  // IMPORTANT: Extract segments from structure FIRST (even without data) to populate filter options
  const segmentItems: string[] = []
  const hierarchy: Record<string, string[]> = {}
  const b2bHierarchy: Record<string, string[]> = {}
  const b2cHierarchy: Record<string, string[]> = {}
  const b2bItems: string[] = []
  const b2cItems: string[] = []
  const records: DataRecord[] = []
  
  // First pass: Extract ALL segments from structure (segmentation JSON) to build complete segment list
  // This ensures segments are available in filters even if they don't have matching data in value/volume files
  // Use extractStructurePathsGenerator which handles empty objects at leaf nodes
  for (let geoIdx = 0; geoIdx < geographies.length; geoIdx++) {
    const geography = geographies[geoIdx]
    if (structureData[geography]?.[segmentType]) {
      // Use structure generator that handles empty objects
      const structureGenerator = extractStructurePathsGenerator(
        structureData[geography][segmentType],
        [geography, segmentType]
      )
      // Collect structure paths (no data, just paths)
      const structurePaths: Array<{ path: string[] }> = []
      let count = 0
      for (const pathObj of structureGenerator) {
        structurePaths.push(pathObj)
        count++
        if (count % 1000 === 0) {
          await new Promise(resolve => setImmediate(resolve))
        }
      }
      
      // Build segment items and hierarchy from structure (not just paths with data)
      structurePaths.forEach(({ path: pathArray }) => {
        const segmentPath = pathArray.slice(segmentTypeIndex + 1)
        
        // Build hierarchy from structure
        segmentPath.forEach((seg, index) => {
          if (index === 0) {
            segmentItems.push(seg) // Add all segments from structure
            if (!hierarchy[seg]) hierarchy[seg] = []
          } else {
            const parent = segmentPath[index - 1]
            if (!hierarchy[parent]) hierarchy[parent] = []
            hierarchy[parent].push(seg)
          }
        })
        
        // Check for B2B/B2C
        const level1 = segmentPath[0] || ''
        if (level1 === 'B2B' || level1 === 'B2C') {
          const segment = segmentPath[segmentPath.length - 1] || ''
          if (level1 === 'B2B') {
            if (!b2bHierarchy[segmentPath[1] || '']) {
              b2bHierarchy[segmentPath[1] || ''] = []
            }
            b2bItems.push(segment)
          } else {
            if (!b2cHierarchy[segmentPath[1] || '']) {
              b2cHierarchy[segmentPath[1] || ''] = []
            }
            b2cItems.push(segment)
          }
        }
      })
      
      console.log(`Extracted ${structurePaths.length} structure paths for ${geography} > ${segmentType}`)
      if (structurePaths.length > 0) {
        console.log(`Sample structure paths:`, structurePaths.slice(0, 3).map(p => p.path.join(' > ')))
      }
    }
  }
  
  console.log(`Total segment items extracted: ${segmentItems.length}`)
  console.log(`Sample segment items:`, segmentItems.slice(0, 10))
  console.log(`Hierarchy keys count: ${Object.keys(hierarchy).length}`, Object.keys(hierarchy).slice(0, 10))
  
  // Second pass: Process paths with data to create records
  const batchSize = 1000
  for (let i = 0; i < allPaths.length; i += batchSize) {
    const batch = allPaths.slice(i, i + batchSize)
    
    for (const { path: pathArray, data } of batch) {
      if (!data) continue // Skip paths without numeric data
      
      const geography = pathArray[0]
      const segmentPath = pathArray.slice(segmentTypeIndex + 1)
      
      // Extract aggregation metadata from JSON first
      const isAggregated = data._aggregated === true
      const aggregationLevel = data._level !== undefined && data._level !== null ? Number(data._level) : null
      
      // Determine segment name based on aggregation level
      // JSON structure:
      // - Level 1: Path = [geography, segmentType] - no segments (total aggregation)
      // - Level 2: Path = [geography, segmentType, segment1] - first segment level
      // - Level 3: Path = [geography, segmentType, segment1, segment2] - second segment level
      // - etc.
      let segment: string
      if (isAggregated && aggregationLevel !== null && aggregationLevel > 0) {
        if (aggregationLevel === 1) {
          // Level 1: No segments in path, this is the total aggregation
          // Use special marker
          segment = '__ALL_SEGMENTS__'
        } else {
          // Level 2+: segmentPath[0] is Level 2, segmentPath[1] is Level 3, etc.
          // aggregationLevel 2 -> segmentPath[0]
          // aggregationLevel 3 -> segmentPath[1]
          // aggregationLevel N -> segmentPath[N-2]
          const levelIndex = aggregationLevel - 2
          if (levelIndex >= 0 && levelIndex < segmentPath.length && segmentPath[levelIndex]) {
            segment = segmentPath[levelIndex]
          } else if (segmentPath.length > 0) {
            // Fallback: use last segment in path if available
            segment = segmentPath[segmentPath.length - 1] || ''
          } else {
            // If segmentPath is empty, this shouldn't happen but handle it gracefully
            console.warn(`Empty segmentPath for aggregated record at level ${aggregationLevel}, path:`, pathArray)
            segment = ''
          }
        }
      } else {
        // For leaf records (not aggregated), use the last segment in the path
        segment = segmentPath[segmentPath.length - 1] || ''
      }
      
      // Build time series
      const timeSeries: Record<number, number> = {}
      allYears.forEach(year => {
        const yearStr = year.toString()
        timeSeries[year] = data[yearStr] !== null && data[yearStr] !== undefined ? (data[yearStr] as number) : 0
      })
      
      // Parse CAGR - it might be a string like "5.2%" or a number
      let cagr = 0
      if (data.CAGR !== null && data.CAGR !== undefined) {
        if (typeof data.CAGR === 'string') {
          // Extract number from string like "5.2%" or "5.2"
          const cagrStr = data.CAGR.replace('%', '').trim()
          cagr = parseFloat(cagrStr) || 0
        } else if (typeof data.CAGR === 'number') {
          cagr = data.CAGR
        }
      }
      
      records.push({
        geography,
        geography_level: 'country',
        parent_geography: null,
        segment_type: segmentType,
        segment,
        segment_level: getSegmentLevel(pathArray, allPaths, segmentTypeIndex),
        segment_hierarchy: buildSegmentHierarchy(pathArray, 0, segmentTypeIndex),
        time_series: timeSeries,
        cagr,
        market_share: 0,
        is_aggregated: isAggregated,
        aggregation_level: aggregationLevel
      })
    }
    
    // Yield control between batches
    await new Promise(resolve => setImmediate(resolve))
  }
  
  return {
    segmentDimension: {
      type: 'hierarchical',
      items: segmentItems,
      hierarchy,
      b2b_hierarchy: Object.keys(b2bHierarchy).length > 0 ? b2bHierarchy : undefined,
      b2c_hierarchy: Object.keys(b2cHierarchy).length > 0 ? b2cHierarchy : undefined,
      b2b_items: b2bItems.length > 0 ? b2bItems : undefined,
      b2c_items: b2cItems.length > 0 ? b2cItems : undefined,
    },
    records
  }
}

/**
 * Process raw JSON data into ComparisonData format (Async version)
 */
export async function processJsonDataAsync(
  valueData: RawJsonData,
  volumeData: RawJsonData | null,
  segmentationData: RawJsonData | null
): Promise<ComparisonData> {
  try {
    console.log('Starting async processJsonData...')
    
    // Use segmentationData for structure (geographies and segments)
    // Use valueData/volumeData for numeric data (years, values, CAGR)
    const structureData = segmentationData || valueData
    
    if (!structureData) {
      throw new Error('No structure data available (need segmentation or value data)')
    }
    
    // Extract all years asynchronously from value data (or volume if value not available)
    console.log('Extracting years...')
    const dataForYears = valueData || volumeData
    let allYears: number[] = []
    if (dataForYears) {
      allYears = await extractYearsAsync(dataForYears)
    }
    if (allYears.length === 0) {
      // Fallback: try to extract from structure data
      console.warn('No years found in value/volume data, trying structure data...')
      allYears = await extractYearsAsync(structureData)
    }
    if (allYears.length === 0) {
      throw new Error('No years found in any data source')
    }
    const startYear = Math.min(...allYears)
    const forecastYear = Math.max(...allYears)
    const baseYear = Math.floor((startYear + forecastYear) / 2)
    console.log(`Years: ${startYear} to ${forecastYear}, base: ${baseYear}`)
    
    // Extract geographies from segmentation data (first level keys)
    // This is truly dynamic - works with any structure (global, country, region, etc.)
    console.log('Extracting geographies from segmentation data...')
    let geographies: string[] = []
    
    if (structureData && typeof structureData === 'object') {
      geographies = Object.keys(structureData).filter(key => {
        // Filter out any non-string keys or invalid entries
        const value = structureData[key]
        return value && typeof value === 'object' && !Array.isArray(value)
      })
    }
    
    if (geographies.length === 0) {
      // Fallback: try to extract from value data if segmentation doesn't have geographies
      console.warn('No geographies found in segmentation data, trying value data...')
      if (valueData && typeof valueData === 'object') {
        geographies = Object.keys(valueData).filter(key => {
          const value = valueData[key]
          return value && typeof value === 'object' && !Array.isArray(value)
        })
      }
    }
    
    if (geographies.length === 0) {
      throw new Error('No geographies found in any data source. Please check your JSON structure.')
    }
    
    console.log(`Found ${geographies.length} geographies:`, geographies)
    const geographySet = new Set(geographies)
    
    // Extract segment types from segmentation data (second level keys)
    console.log('Extracting segment types from segmentation data...')
    const segmentTypes = new Set<string>()
    Object.values(structureData).forEach(geography => {
      if (geography && typeof geography === 'object') {
        Object.keys(geography).forEach(segType => {
          segmentTypes.add(segType)
        })
      }
    })
    if (segmentTypes.size === 0) {
      throw new Error('No segment types found in segmentation data')
    }
    console.log(`Found ${segmentTypes.size} segment types:`, Array.from(segmentTypes))
    
    // Build geography dimension - truly dynamic, no assumptions about structure
    // All geographies go into all_geographies, regardless of whether they're global, regions, or countries
    const geographyDimension: GeographyDimension = {
      global: geographies.length === 1 ? geographies : [], // If only one geography, treat as global
      regions: [], // Will be populated dynamically if needed
      countries: {}, // Will be populated dynamically if needed
      all_geographies: geographies // All geographies from the data
    }
    
    console.log(`Geography dimension built with ${geographies.length} geographies:`, geographies)
    
    // Process each segment type asynchronously
    const segments: Record<string, SegmentDimension> = {}
    const valueRecords: DataRecord[] = []
    const volumeRecords: DataRecord[] = []
    const segmentTypeIndex = 1
    
    for (const segmentType of segmentTypes) {
      console.log(`Processing segment type: ${segmentType}`)
      const { segmentDimension, records } = await processSegmentTypeAsync(
        structureData, // Use segmentation data for structure
        valueData,     // Use value data for numeric values
        volumeData,    // Use volume data for volume values
        segmentType,
        geographies,
        allYears,
        segmentTypeIndex
      )
      segments[segmentType] = segmentDimension
      valueRecords.push(...records)
      
      // Yield control between segment types
      await new Promise(resolve => setImmediate(resolve))
    }
    
    // Process volume data separately if available
    if (volumeData) {
      console.log('Processing volume data...')
      for (const segmentType of segmentTypes) {
        const { records: volumeRecs } = await processSegmentTypeAsync(
          structureData,
          volumeData,  // Use volume data for numeric values
          null,
          segmentType,
          geographies,
          allYears,
          segmentTypeIndex
        )
        volumeRecords.push(...volumeRecs)
      }
    }
    
    // Process volume data if available (simplified for now)
    if (volumeData) {
      console.log('Processing volume data...')
      // Similar async processing for volume data can be added here
    }
    
    // Calculate market share for each record
    const calculateMarketShare = (records: DataRecord[], year: number) => {
      const yearTotal = records.reduce((sum, r) => sum + (r.time_series[year] || 0), 0)
      records.forEach(record => {
        const value = record.time_series[year] || 0
        record.market_share = yearTotal > 0 ? (value / yearTotal) * 100 : 0
      })
    }
    
    // Calculate market share for base year
    calculateMarketShare(valueRecords, baseYear)
    if (volumeRecords.length > 0) {
      calculateMarketShare(volumeRecords, baseYear)
    }
    
    // Build metadata
    const metadata: Metadata = {
      market_name: geographies.join(', ') || 'Unknown Market',
      market_type: 'Market Analysis',
      industry: 'General',
      years: allYears,
      start_year: startYear,
      base_year: baseYear,
      forecast_year: forecastYear,
      historical_years: allYears.filter(y => y <= baseYear),
      forecast_years: allYears.filter(y => y > baseYear),
      currency: 'USD',
      value_unit: 'Million',
      volume_unit: 'Units',
      has_value: valueRecords.length > 0,
      has_volume: volumeRecords.length > 0,
    }
    
    console.log(`Async processing complete. Records: ${valueRecords.length} value, ${volumeRecords.length} volume`)
    
    return {
      metadata,
      dimensions: {
        geographies: geographyDimension,
        segments,
      },
      data: {
        value: {
          geography_segment_matrix: valueRecords,
        },
        volume: {
          geography_segment_matrix: volumeRecords,
        },
      },
    }
  } catch (error) {
    console.error('Error in processJsonDataAsync:', error)
    throw new Error(
      `Failed to process JSON data: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Synchronous version (kept for backward compatibility)
 * Note: This is a wrapper that calls the async version
 * For better performance, use processJsonDataAsync directly
 */
export function processJsonData(
  valueData: RawJsonData,
  volumeData: RawJsonData | null,
  segmentationData: RawJsonData | null
): ComparisonData {
  // This should not be called in the new async flow
  // But kept for any legacy code that might still use it
  throw new Error('Synchronous processJsonData is deprecated. Use processJsonDataAsync instead.')
}

/**
 * Load and process JSON files
 */
export async function loadAndProcessJsonFiles(
  valueJsonPath: string,
  volumeJsonPath: string | null = null,
  segmentationJsonPath: string | null = null
): Promise<ComparisonData> {
  try {
    console.log('Loading JSON files asynchronously...')
    
    // Read files in parallel using async fs
    const readPromises = [
      fs.readFile(valueJsonPath, 'utf-8'),
      volumeJsonPath ? fs.readFile(volumeJsonPath, 'utf-8').catch(() => null) : Promise.resolve(null),
      segmentationJsonPath ? fs.readFile(segmentationJsonPath, 'utf-8').catch(() => null) : Promise.resolve(null)
    ]
    
    const [valueContent, volumeContent, segmentationContent] = await Promise.all(readPromises)
    
    if (!valueContent) {
      throw new Error('Value JSON file is required but was not found')
    }
    
    console.log(`Value JSON size: ${(valueContent.length / 1024 / 1024).toFixed(2)} MB`)
    
    // Parse JSON asynchronously (using setImmediate to yield)
    let valueData: RawJsonData
    await new Promise<void>(resolve => {
      setImmediate(() => {
        try {
          valueData = JSON.parse(valueContent)
          console.log('Value JSON parsed successfully')
          resolve()
        } catch (error) {
          throw new Error(`Failed to parse value JSON: ${error instanceof Error ? error.message : String(error)}`)
        }
      })
    })
    
    let volumeData: RawJsonData | null = null
    if (volumeContent) {
      await new Promise<void>(resolve => {
        setImmediate(() => {
          try {
            volumeData = JSON.parse(volumeContent)
            console.log('Volume JSON parsed successfully')
          } catch (error) {
            console.warn(`Failed to parse volume JSON: ${error instanceof Error ? error.message : String(error)}`)
          }
          resolve()
        })
      })
    }
    
    let segmentationData: RawJsonData = valueData!
    if (segmentationContent) {
      await new Promise<void>(resolve => {
        setImmediate(() => {
          try {
            segmentationData = JSON.parse(segmentationContent)
            console.log('Segmentation JSON parsed successfully')
          } catch (error) {
            console.warn(`Failed to parse segmentation JSON: ${error instanceof Error ? error.message : String(error)}. Using value data.`)
            segmentationData = valueData!
          }
          resolve()
        })
      })
    } else {
      console.log('Using value data structure for segmentation')
    }
    
    // Process asynchronously
    console.log('Processing JSON data asynchronously...')
    const result = await processJsonDataAsync(valueData!, volumeData, segmentationData)
    console.log('JSON data processed successfully')
    
    return result
  } catch (error) {
    console.error('Error in loadAndProcessJsonFiles:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    throw new Error(
      `Failed to load/process JSON files: ${errorMessage}${errorStack ? `\nStack: ${errorStack}` : ''}`
    )
  }
}

