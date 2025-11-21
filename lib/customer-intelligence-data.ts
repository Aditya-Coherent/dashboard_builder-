/**
 * Customer Intelligence Data Generator
 * Generates realistic customer data for End User segments across regions
 */

export interface Customer {
  id: string
  name: string
  region: string
  endUserSegment: string
  type: 'hospital' | 'speciality' | 'research' | 'pharmacy'
}

export interface CustomerIntelligenceData {
  region: string
  endUserSegment: string
  customerCount: number
  customers: Customer[]
}

// Realistic customer name generators by type
const hospitalNames = [
  'Memorial', 'General', 'Regional', 'Medical Center', 'University Hospital',
  'Community Hospital', 'City Hospital', 'Metropolitan', 'Central', 'National'
]

const specialityNames = [
  'Oncology Center', 'Cancer Institute', 'Specialty Clinic', 'Treatment Center',
  'Care Center', 'Medical Institute', 'Health Center', 'Therapy Center'
]

const researchNames = [
  'Research Institute', 'Medical Research', 'Clinical Research', 'Biomedical Institute',
  'Cancer Research', 'Oncology Research', 'Medical Foundation', 'Research Center'
]

const pharmacyNames = [
  'Pharmacy', 'Drug Store', 'Retail Pharmacy', 'Community Pharmacy',
  'Health Pharmacy', 'Medical Pharmacy', 'Care Pharmacy', 'Wellness Pharmacy'
]

const locationSuffixes = [
  'North', 'South', 'East', 'West', 'Central', 'Metro', 'Downtown', 'Uptown',
  'Riverside', 'Parkview', 'Hillside', 'Valley', 'Coastal', 'Mountain'
]

// Region-specific prefixes
const regionPrefixes: Record<string, string[]> = {
  'North America': ['American', 'United', 'National', 'Regional', 'Metropolitan'],
  'Latin America': ['Latino', 'Americas', 'Continental', 'Regional', 'National'],
  'Europe': ['European', 'Continental', 'Regional', 'National', 'Metropolitan'],
  'Asia Pacific': ['Asia', 'Pacific', 'Regional', 'National', 'Metropolitan'],
  'Middle East': ['Middle East', 'Regional', 'National', 'Gulf', 'Continental'],
  'Africa': ['African', 'Continental', 'Regional', 'National', 'Metropolitan']
}

function generateCustomerName(region: string, endUserSegment: string, index: number): string {
  const prefixes = regionPrefixes[region] || ['Regional', 'National']
  const prefix = prefixes[index % prefixes.length]
  const location = locationSuffixes[index % locationSuffixes.length]
  
  let baseName = ''
  if (endUserSegment === 'Hospital') {
    baseName = hospitalNames[index % hospitalNames.length]
  } else if (endUserSegment === 'Speciality Center') {
    baseName = specialityNames[index % specialityNames.length]
  } else if (endUserSegment === 'Research Institute') {
    baseName = researchNames[index % researchNames.length]
  } else {
    baseName = pharmacyNames[index % pharmacyNames.length]
  }
  
  return `${prefix} ${baseName} ${location}`
}

/**
 * Generate realistic customer counts based on region and end user segment
 * Hospitals typically have more customers in developed regions
 * Research institutes are more evenly distributed
 */
// Deterministic seed function for consistent data generation
function seededRandom(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function generateCustomerCount(region: string, endUserSegment: string): number {
  // Base multipliers by region (reflecting market size)
  const regionMultipliers: Record<string, number> = {
    'North America': 1.2,
    'Europe': 1.0,
    'Asia Pacific': 1.3,
    'Latin America': 0.7,
    'Middle East': 0.6,
    'Africa': 0.5
  }
  
  // Base multipliers by end user type
  const segmentMultipliers: Record<string, number> = {
    'Hospital': 1.5,           // Most common
    'Speciality Center': 1.0,  // Medium
    'Research Institute': 0.6, // Less common
    'Retail Pharmacy': 0.8     // Medium-low
  }
  
  // Base count range
  const baseMin = 50
  const baseMax = 300
  
  const regionMulti = regionMultipliers[region] || 1.0
  const segmentMulti = segmentMultipliers[endUserSegment] || 1.0
  
  // Calculate realistic range
  const min = Math.floor(baseMin * regionMulti * segmentMulti)
  const max = Math.floor(baseMax * regionMulti * segmentMulti)
  
  // Create deterministic seed based on region and segment
  const seed = (region.charCodeAt(0) * 1000 + endUserSegment.charCodeAt(0) * 100) % 10000
  const random = seededRandom(seed)
  
  // Generate consistent count
  const count = Math.floor(random() * (max - min + 1)) + min
  
  return Math.max(10, count) // Minimum 10 customers
}

/**
 * Generate all customer intelligence data
 */
export function generateCustomerIntelligenceData(): CustomerIntelligenceData[] {
  const regions = [
    'North America',
    'Latin America',
    'Europe',
    'Asia Pacific',
    'Middle East',
    'Africa'
  ]
  
  const endUserSegments = [
    'Hospital',
    'Speciality Center',
    'Research Institute',
    'Retail Pharmacy'
  ]
  
  const data: CustomerIntelligenceData[] = []
  
  regions.forEach(region => {
    endUserSegments.forEach(endUserSegment => {
      const customerCount = generateCustomerCount(region, endUserSegment)
      const customers: Customer[] = []
      
      // Generate customer names (deterministic based on region, segment, and index)
      for (let i = 0; i < customerCount; i++) {
        customers.push({
          id: `${region}-${endUserSegment}-${i}`,
          name: generateCustomerName(region, endUserSegment, i),
          region,
          endUserSegment,
          type: endUserSegment === 'Hospital' ? 'hospital' 
                : endUserSegment === 'Speciality Center' ? 'speciality' 
                : endUserSegment === 'Research Institute' ? 'research'
                : 'pharmacy'
        })
      }
      
      data.push({
        region,
        endUserSegment,
        customerCount,
        customers
      })
    })
  })
  
  return data
}

/**
 * Get customers for a specific region and end user segment
 */
export function getCustomersForCell(
  data: CustomerIntelligenceData[],
  region: string,
  endUserSegment: string
): Customer[] {
  const cell = data.find(
    d => d.region === region && d.endUserSegment === endUserSegment
  )
  return cell?.customers || []
}

/**
 * Get customer count for a specific region and end user segment
 */
export function getCustomerCountForCell(
  data: CustomerIntelligenceData[],
  region: string,
  endUserSegment: string
): number {
  const cell = data.find(
    d => d.region === region && d.endUserSegment === endUserSegment
  )
  return cell?.customerCount || 0
}

