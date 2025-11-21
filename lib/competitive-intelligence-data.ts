/**
 * Competitive Intelligence Data Generator
 * Generates data for competitive dashboard and market share analysis
 * Last updated: 2024
 */

export interface CompanyData {
  id: string
  name: string
  headquarters: string
  ceo: string
  yearEstablished: number
  portfolio: string
  strategies: string[]
  regionalStrength: string
  overallRevenue: number // in USD Mn
  segmentalRevenue: number // in USD Mn for 2024
  marketShare: number // percentage
}

export interface MarketShareData {
  company: string
  marketShare: number
  color: string
}

export interface CompetitiveIntelligenceData {
  metadata: {
    market: string
    year: number
    currency: string
    revenue_unit: string
    total_companies: number
  }
  companies: CompanyData[]
  market_share_data: MarketShareData[]
}

let cachedData: CompetitiveIntelligenceData | null = null

/**
 * Load competitive intelligence data from API
 */
export async function loadCompetitiveIntelligenceData(): Promise<CompetitiveIntelligenceData | null> {
  if (cachedData) {
    return cachedData
  }

  try {
    // Return null - no data in clean version
    return null
  } catch (error) {
    console.error('Error loading competitive intelligence data:', error)
    return null
  }
}

// Top pharmaceutical companies in head and neck cancer drugs market
const companies = [
  'Gaudron Bedstar',
  'Kandeltam',
  'Hebei Xing Chemical',
  'Hubei Jingchan Chutkan',
  'Vishno Barium (V.C.)',
  'Jiaxinxi Anheng Jianghua',
  'Nippon Chemical Industrial',
  'Sakai Chemical Industry',
  'Others'
]

// Company colors using the enterprise palette
const companyColors: Record<string, string> = {
  'Gaudron Bedstar': '#52B69A',      // Teal
  'Kandeltam': '#34A0A4',             // Medium Teal
  'Hebei Xing Chemical': '#D9ED92',   // Yellow Green
  'Hubei Jingchan Chutkan': '#184E77', // Navy Blue
  'Vishno Barium (V.C.)': '#B5E48C',  // Light Lime
  'Jiaxinxi Anheng Jianghua': '#1E6091', // Deep Blue
  'Nippon Chemical Industrial': '#168AAD', // Deep Teal
  'Sakai Chemical Industry': '#1A759F', // Blue Teal
  'Others': '#99D98C'                 // Medium Green
}

// Headquarters locations
const headquarters: Record<string, string> = {
  'Gaudron Bedstar': 'New York, USA',
  'Kandeltam': 'London, UK',
  'Hebei Xing Chemical': 'Hebei, China',
  'Hubei Jingchan Chutkan': 'Hubei, China',
  'Vishno Barium (V.C.)': 'Mumbai, India',
  'Jiaxinxi Anheng Jianghua': 'Jiangsu, China',
  'Nippon Chemical Industrial': 'Tokyo, Japan',
  'Sakai Chemical Industry': 'Osaka, Japan',
  'Others': 'Various'
}

// CEOs (simulated names)
const ceos: Record<string, string> = {
  'Gaudron Bedstar': 'Michael Anderson',
  'Kandeltam': 'Sarah Williams',
  'Hebei Xing Chemical': 'Zhang Wei',
  'Hubei Jingchan Chutkan': 'Li Ming',
  'Vishno Barium (V.C.)': 'Rajesh Kumar',
  'Jiaxinxi Anheng Jianghua': 'Wang Xiaoping',
  'Nippon Chemical Industrial': 'Takeshi Yamamoto',
  'Sakai Chemical Industry': 'Hiroshi Tanaka',
  'Others': 'Multiple'
}

// Year established
const yearEstablished: Record<string, number> = {
  'Gaudron Bedstar': 1985,
  'Kandeltam': 1992,
  'Hebei Xing Chemical': 2001,
  'Hubei Jingchan Chutkan': 1998,
  'Vishno Barium (V.C.)': 1987,
  'Jiaxinxi Anheng Jianghua': 2003,
  'Nippon Chemical Industrial': 1978,
  'Sakai Chemical Industry': 1982,
  'Others': 0
}

// Product portfolios
const portfolios: Record<string, string> = {
  'Gaudron Bedstar': 'Immunotherapy, Targeted Therapy',
  'Kandeltam': 'Chemotherapy, Clinical Trials',
  'Hebei Xing Chemical': 'Generic Drugs, APIs',
  'Hubei Jingchan Chutkan': 'Traditional Medicine, Oncology',
  'Vishno Barium (V.C.)': 'Biosimilars, Generics',
  'Jiaxinxi Anheng Jianghua': 'APIs, Intermediates',
  'Nippon Chemical Industrial': 'Innovative Drugs, Biologics',
  'Sakai Chemical Industry': 'Specialty Chemicals, Oncology',
  'Others': 'Various Products'
}

// Regional strengths
const regionalStrengths: Record<string, string> = {
  'Gaudron Bedstar': 'North America, Europe',
  'Kandeltam': 'Europe, Asia Pacific',
  'Hebei Xing Chemical': 'China, Southeast Asia',
  'Hubei Jingchan Chutkan': 'China, Latin America',
  'Vishno Barium (V.C.)': 'India, Middle East',
  'Jiaxinxi Anheng Jianghua': 'China, Africa',
  'Nippon Chemical Industrial': 'Japan, North America',
  'Sakai Chemical Industry': 'Japan, Europe',
  'Others': 'Global'
}

// Market share percentages (must sum to 100)
const marketShares: Record<string, number> = {
  'Gaudron Bedstar': 25.0,
  'Kandeltam': 8.0,
  'Hebei Xing Chemical': 42.0,
  'Hubei Jingchan Chutkan': 3.0,
  'Vishno Barium (V.C.)': 5.0,
  'Jiaxinxi Anheng Jianghua': 4.0,
  'Nippon Chemical Industrial': 2.0,
  'Sakai Chemical Industry': 1.0,
  'Others': 10.0
}

// Generate strategies based on company type
function generateStrategies(company: string): string[] {
  const strategyMap: Record<string, string[]> = {
    'Gaudron Bedstar': ['Innovation Focus', 'M&A Strategy', 'Digital Health'],
    'Kandeltam': ['Clinical Excellence', 'Partnership Model', 'EU Expansion'],
    'Hebei Xing Chemical': ['Cost Leadership', 'Volume Growth', 'API Integration'],
    'Hubei Jingchan Chutkan': ['Traditional Integration', 'Local Markets', 'R&D Investment'],
    'Vishno Barium (V.C.)': ['Biosimilar Development', 'Emerging Markets', 'Affordability'],
    'Jiaxinxi Anheng Jianghua': ['Supply Chain', 'Manufacturing Scale', 'Export Focus'],
    'Nippon Chemical Industrial': ['Technology Innovation', 'Quality Excellence', 'Global Partnerships'],
    'Sakai Chemical Industry': ['Niche Markets', 'Specialty Focus', 'Research Collaboration'],
    'Others': ['Diverse Strategies', 'Regional Focus', 'Market Specific']
  }
  
  return strategyMap[company] || ['Market Development', 'Product Innovation', 'Strategic Partnerships']
}

// Generate revenue based on market share
function generateRevenue(marketShare: number): { overall: number, segmental: number } {
  // Total market size approximately 5000 USD Mn
  const totalMarketSize = 5000
  const segmentalRevenue = (marketShare / 100) * totalMarketSize
  
  // Overall revenue is typically 3-5x the segmental revenue (company has other products)
  const multiplier = 3 + Math.random() * 2
  const overallRevenue = segmentalRevenue * multiplier
  
  return {
    overall: Math.round(overallRevenue),
    segmental: Math.round(segmentalRevenue)
  }
}

/**
 * Generate competitive intelligence data for all companies
 * Now loads from JSON file, with fallback to hardcoded data
 */
export async function generateCompetitiveData(): Promise<CompanyData[]> {
  const jsonData = await loadCompetitiveIntelligenceData()
  
  if (jsonData && jsonData.companies) {
    return jsonData.companies
  }
  
  // Fallback to hardcoded data
  return companies.map(company => {
    const revenue = generateRevenue(marketShares[company])
    
    return {
      id: company.toLowerCase().replace(/\s+/g, '-'),
      name: company,
      headquarters: headquarters[company],
      ceo: ceos[company],
      yearEstablished: yearEstablished[company],
      portfolio: portfolios[company],
      strategies: generateStrategies(company),
      regionalStrength: regionalStrengths[company],
      overallRevenue: revenue.overall,
      segmentalRevenue: revenue.segmental,
      marketShare: marketShares[company],
      color: companyColors[company]
    }
  })
}

/**
 * Generate market share data for pie chart
 * Now loads from JSON file, with fallback to hardcoded data
 * Groups smaller companies into "Others" to reduce clutter
 */
export async function generateMarketShareData(showTopN: number = 10): Promise<MarketShareData[]> {
  const jsonData = await loadCompetitiveIntelligenceData()
  
  let allData: MarketShareData[]
  
  if (jsonData && jsonData.market_share_data) {
    allData = jsonData.market_share_data
  } else {
    // Fallback to hardcoded data
    allData = companies.map(company => ({
      company,
      marketShare: marketShares[company],
      color: companyColors[company]
    }))
  }
  
  // Sort by market share (descending)
  const sorted = [...allData].sort((a, b) => b.marketShare - a.marketShare)
  
  // Take top N companies
  const topCompanies = sorted.slice(0, showTopN)
  
  // Group the rest into "Others"
  const othersShare = sorted.slice(showTopN).reduce((sum, c) => sum + c.marketShare, 0)
  
  if (othersShare > 0) {
    topCompanies.push({
      company: 'Others',
      marketShare: othersShare,
      color: '#94a3b8' // Gray color for Others
    })
  }
  
  return topCompanies
}

/**
 * Get top companies by market share
 */
export async function getTopCompanies(limit: number = 5): Promise<CompanyData[]> {
  const allCompanies = await generateCompetitiveData()
  return allCompanies
    .filter(c => c.name !== 'Others')
    .sort((a, b) => b.marketShare - a.marketShare)
    .slice(0, limit)
}

/**
 * Calculate market concentration (HHI - Herfindahl-Hirschman Index)
 */
export function calculateMarketConcentration(): { hhi: number; concentration: string } {
  const shares = Object.values(marketShares)
  const hhi = shares.reduce((sum, share) => sum + Math.pow(share, 2), 0)
  
  let concentration = 'Competitive'
  if (hhi < 1500) {
    concentration = 'Competitive'
  } else if (hhi < 2500) {
    concentration = 'Moderately Concentrated'
  } else {
    concentration = 'Highly Concentrated'
  }
  
  return { hhi: Math.round(hhi), concentration }
}

/**
 * Get company comparison data for competitive dashboard
 */
export async function getCompanyComparison(): Promise<{
  headers: string[];
  rows: { label: string; values: (string | number)[] }[];
}> {
  const companies = (await generateCompetitiveData()).slice(0, 10) // Top 10 companies
  
  const headers = companies.map(c => c.name)
  
  const rows = [
    {
      label: "Headquarters",
      values: companies.map(c => c.headquarters)
    },
    {
      label: "Key Management (CEO)",
      values: companies.map(c => c.ceo)
    },
    {
      label: "Year of Establishment",
      values: companies.map(c => c.yearEstablished || 'N/A')
    },
    {
      label: "Product/Service Portfolio",
      values: companies.map(c => c.portfolio)
    },
    {
      label: "Strategies/Recent Developments",
      values: companies.map(c => c.strategies.join(', '))
    },
    {
      label: "Regional Strength",
      values: companies.map(c => c.regionalStrength)
    },
    {
      label: "Overall Revenue (Cr INR)",
      values: companies.map(c => c.overallRevenue.toLocaleString())
    },
    {
      label: "Segmental Revenue (Cr INR), 2024",
      values: companies.map(c => c.segmentalRevenue.toLocaleString())
    },
    {
      label: "Market Share (%)",
      values: companies.map(c => c.marketShare.toFixed(1) + '%')
    }
  ]
  
  return { headers, rows }
}
