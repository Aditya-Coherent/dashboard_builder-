'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet, Eye, Users, Building2, ArrowRight, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { useDashboardStore } from '@/lib/store'
import type { ComparisonData } from '@/lib/types'
import type { IntelligenceType } from '@/components/dashboard-builder/IntelligenceDataInput'
import { IntelligenceDataInput } from '@/components/dashboard-builder/IntelligenceDataInput'

export default function DashboardBuilderPage() {
  const router = useRouter()
  const { 
    setData, 
    setLoading, 
    setError, 
    clearData,
    setIntelligenceType,
    setCustomerIntelligenceData,
    setDistributorIntelligenceData,
    setParentHeaders,
    setRawIntelligenceData,
    setProposition2Data,
    setProposition3Data,
    setCompetitiveIntelligenceData,
    setDashboardName,
    setCurrency
  } = useDashboardStore()
  
  // Section 1: Market Intelligence
  const [dashboardNameInput, setDashboardNameInput] = useState('India Market Analysis')
  const [currencyInput, setCurrencyInput] = useState<'USD' | 'INR'>('USD')
  const [valueFile, setValueFile] = useState<File | null>(null)
  const [volumeFile, setVolumeFile] = useState<File | null>(null)
  const [isProcessingMarket, setIsProcessingMarket] = useState(false)
  const [marketStatus, setMarketStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [marketStatusMessage, setMarketStatusMessage] = useState('')
  const [processedData, setProcessedData] = useState<ComparisonData | null>(null)
  
  // Section 2: Intelligence Data (Optional)
  const [intelligenceType, setLocalIntelligenceType] = useState<IntelligenceType>('customer')
  const [intelligenceFile, setIntelligenceFile] = useState<File | null>(null)
  const [proposition2File, setProposition2File] = useState<File | null>(null)
  const [proposition3File, setProposition3File] = useState<File | null>(null)
  const [isProcessingIntelligence, setIsProcessingIntelligence] = useState(false)
  const [intelligenceStatus, setIntelligenceStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [intelligenceStatusMessage, setIntelligenceStatusMessage] = useState('')
  const [hasIntelligenceData, setHasIntelligenceData] = useState(false)
  const [activeTab, setActiveTab] = useState<'market' | 'intelligence' | 'competitive'>('market')
  
  // Section 3: Competitive Intelligence Data
  const [competitiveFile, setCompetitiveFile] = useState<File | null>(null)
  const [isProcessingCompetitive, setIsProcessingCompetitive] = useState(false)
  const [competitiveStatus, setCompetitiveStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [competitiveStatusMessage, setCompetitiveStatusMessage] = useState('')

  const handleValueFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValueFile(e.target.files[0])
      setMarketStatus('idle')
      setMarketStatusMessage('')
      setProcessedData(null)
    }
  }

  const handleVolumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVolumeFile(e.target.files[0])
    }
  }

  const handleIntelligenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIntelligenceFile(e.target.files[0])
      setIntelligenceStatus('idle')
      setIntelligenceStatusMessage('')
    }
  }

  const handleProposition2FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProposition2File(e.target.files[0])
    }
  }

  const handleProposition3FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProposition3File(e.target.files[0])
    }
  }

  const handleCompetitiveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompetitiveFile(e.target.files[0])
      setCompetitiveStatus('idle')
      setCompetitiveStatusMessage('')
    }
  }

  // Process Market Intelligence Data
  const handleProcessMarketIntelligence = async () => {
    if (!valueFile) {
      setMarketStatus('error')
      setMarketStatusMessage('Please upload a value file (CSV or Excel)')
      return
    }

    setIsProcessingMarket(true)
    setMarketStatus('processing')
    setMarketStatusMessage('Processing files and generating dashboard preview...')

    try {
      const formData = new FormData()
      formData.append('valueFile', valueFile)
      if (volumeFile) {
        formData.append('volumeFile', volumeFile)
      }

      const response = await fetch('/api/process-excel', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to process files')
      }

      const data: ComparisonData = await response.json()
      
      // Clear old data and set new data
      clearData()
      setData(data)
      setLoading(false)
      setError(null)
      
      // Store dashboard name and currency
      setDashboardName(dashboardNameInput || 'India Market Analysis')
      setCurrency(currencyInput)
      
      // Store processed data
      setProcessedData(data)
      
      // Store context in the store
      const { setDashboardBuilderContext } = useDashboardStore.getState()
      setDashboardBuilderContext({
        valueFile,
        volumeFile,
        projectName: dashboardNameInput || 'market-dashboard'
      })
      
      setMarketStatus('success')
      setMarketStatusMessage('Market intelligence data processed successfully!')
    } catch (error) {
      console.error('Error processing files:', error)
      setMarketStatus('error')
      setMarketStatusMessage(
        error instanceof Error ? error.message : 'An error occurred while processing the files'
      )
    } finally {
      setIsProcessingMarket(false)
    }
  }

  // Process Intelligence Data
  const handleProcessIntelligenceFile = async () => {
    if (!intelligenceFile) {
      setIntelligenceStatus('error')
      setIntelligenceStatusMessage('Please select a file to upload')
      return
    }

    setIsProcessingIntelligence(true)
    setIntelligenceStatus('processing')
    setIntelligenceStatusMessage('Processing intelligence file...')

    try {
      const formData = new FormData()
      formData.append('intelligenceFile', intelligenceFile)
      formData.append('intelligenceType', intelligenceType)

      const response = await fetch('/api/process-intelligence-file', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to process file')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      const processedData = result.data
      
      setRawIntelligenceData({
        headers: processedData.headers || [],
        rows: processedData.rows || []
      })
      setIntelligenceType(intelligenceType)
      
      let processedCount = 1
      let message = `Processed ${processedData.rows?.length || 0} rows from Proposition 1`
      
      // Process Proposition 2 if file is uploaded
      if (proposition2File) {
        try {
          const prop2FormData = new FormData()
          prop2FormData.append('intelligenceFile', proposition2File)
          prop2FormData.append('intelligenceType', intelligenceType)
          
          const prop2Response = await fetch('/api/process-intelligence-file', {
            method: 'POST',
            body: prop2FormData,
          })
          
          if (prop2Response.ok) {
            const prop2Result = await prop2Response.json()
            if (prop2Result.success && prop2Result.data) {
              setProposition2Data({
                headers: prop2Result.data.headers || [],
                rows: prop2Result.data.rows || []
              })
              processedCount++
              message += `, ${prop2Result.data.rows?.length || 0} rows from Proposition 2`
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to process Proposition 2 file:', error)
        }
      }
      
      // Process Proposition 3 if file is uploaded
      if (proposition3File) {
        try {
          const prop3FormData = new FormData()
          prop3FormData.append('intelligenceFile', proposition3File)
          prop3FormData.append('intelligenceType', intelligenceType)
          
          const prop3Response = await fetch('/api/process-intelligence-file', {
            method: 'POST',
            body: prop3FormData,
          })
          
          if (prop3Response.ok) {
            const prop3Result = await prop3Response.json()
            if (prop3Result.success && prop3Result.data) {
              setProposition3Data({
                headers: prop3Result.data.headers || [],
                rows: prop3Result.data.rows || []
              })
              processedCount++
              message += `, ${prop3Result.data.rows?.length || 0} rows from Proposition 3`
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to process Proposition 3 file:', error)
        }
      }
      
      setHasIntelligenceData(true)
      setIntelligenceStatus('success')
      setIntelligenceStatusMessage(message)
    } catch (error: any) {
      console.error('Error processing intelligence file:', error)
      setIntelligenceStatus('error')
      setIntelligenceStatusMessage(error.message || 'Failed to process intelligence file')
    } finally {
      setIsProcessingIntelligence(false)
    }
  }

  // Handle intelligence data save from IntelligenceDataInput component
  const handleIntelligenceDataSave = (data: any[]) => {
    if (intelligenceType === 'customer') {
      setCustomerIntelligenceData(data)
    } else {
      setDistributorIntelligenceData(data)
    }
    setHasIntelligenceData(true)
  }

  // Handle auto-save from IntelligenceDataInput component (for bulk paste)
  const handleIntelligenceAutoSave = (data: any[], parentHeaders?: { prop1: string; prop2: string; prop3: string }) => {
    if (intelligenceType === 'customer') {
      setCustomerIntelligenceData(data)
    } else {
      setDistributorIntelligenceData(data)
    }
    if (parentHeaders) {
      setParentHeaders(parentHeaders)
    }
    setHasIntelligenceData(true)
  }

  // Process Competitive Intelligence Data
  const handleProcessCompetitiveIntelligence = async () => {
    if (!competitiveFile) {
      setCompetitiveStatus('error')
      setCompetitiveStatusMessage('Please select a file to upload')
      return
    }

    setIsProcessingCompetitive(true)
    setCompetitiveStatus('processing')
    setCompetitiveStatusMessage('Processing competitive intelligence file...')

    try {
      const formData = new FormData()
      formData.append('competitiveFile', competitiveFile)

      const response = await fetch('/api/process-competitive-intelligence', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to process file')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server')
      }

      const processedData = result.data
      
      // Store competitive intelligence data in the store
      setCompetitiveIntelligenceData({
        headers: processedData.headers || [],
        rows: processedData.rows || []
      })
      
      setCompetitiveStatus('success')
      setCompetitiveStatusMessage(`Processed ${processedData.rows?.length || 0} rows successfully`)
    } catch (error: any) {
      console.error('Error processing competitive intelligence file:', error)
      setCompetitiveStatus('error')
      setCompetitiveStatusMessage(error.message || 'Failed to process competitive intelligence file')
    } finally {
      setIsProcessingCompetitive(false)
    }
  }

  // Navigate to dashboard
  const handleViewDashboard = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/logo.png" 
                alt="Coherent Market Insights Logo" 
                width={150} 
                height={60}
                className="h-auto w-auto max-w-[150px]"
                priority
              />
              <div>
                <h1 className="text-xl font-bold text-black">Dashboard Builder</h1>
                <p className="text-sm text-gray-600">Build your custom dashboard step by step</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('market')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'market'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                1. Market Intelligence
              </button>
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'intelligence'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                2. Customer/Distributor Intelligence
              </button>
              <button
                onClick={() => setActiveTab('competitive')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'competitive'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                3. Competitive Intelligence
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'market' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">1. Market Intelligence</h2>
              <p className="text-sm text-gray-600">Upload your value and volume sheets to build the market analysis dashboard</p>
            </div>

            <div className="space-y-6">
              {/* Dashboard Name */}
              <div>
                <label htmlFor="dashboardName" className="block text-sm font-medium text-black mb-2">
                  Dashboard Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dashboardName"
                  value={dashboardNameInput}
                  onChange={(e) => setDashboardNameInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="India Market Analysis"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will appear as the subtitle below "Coherent Dashboard"
                </p>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="USD"
                      checked={currencyInput === 'USD'}
                      onChange={() => setCurrencyInput('USD')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-black">USD ($)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="currency"
                      value="INR"
                      checked={currencyInput === 'INR'}
                      onChange={() => setCurrencyInput('INR')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-black">INR (₹)</span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select the currency for displaying values throughout the dashboard
                </p>
              </div>

              {/* Value File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Value File (Required) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="valueFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="valueFile"
                          name="valueFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleValueFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {valueFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {valueFile.name} ({(valueFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Volume File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Volume File (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="volumeFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="volumeFile"
                          name="volumeFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleVolumeFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {volumeFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {volumeFile.name} ({(volumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {marketStatusMessage && (
                <div
                  className={`p-4 rounded-md flex items-start gap-3 ${
                    marketStatus === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : marketStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  {marketStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : marketStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p
                    className={`text-sm ${
                      marketStatus === 'success'
                        ? 'text-green-800'
                        : marketStatus === 'error'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {marketStatusMessage}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcessMarketIntelligence}
                disabled={!valueFile || isProcessingMarket}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessingMarket ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Files...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Process Market Intelligence Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {activeTab === 'intelligence' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">2. Intelligence Data Input</h2>
              <p className="text-sm text-gray-600">Add customer or distributor intelligence data to your dashboard</p>
            </div>

            <IntelligenceDataInput
              intelligenceType={intelligenceType}
              onTypeChange={(type) => {
                setLocalIntelligenceType(type)
                setIntelligenceType(type)
              }}
              onDataSave={handleIntelligenceDataSave}
              onAutoSave={handleIntelligenceAutoSave}
            />

            {/* File Upload Option */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-black mb-4">Or Upload Excel Files</h3>
              <div className="space-y-4">
                {/* Proposition 1 */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Proposition 1 (Basic) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="intelligenceFile"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="intelligenceFile"
                            name="intelligenceFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleIntelligenceFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {intelligenceFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {intelligenceFile.name} ({(intelligenceFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proposition 2 */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Proposition 2 (Advance) (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="proposition2File"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="proposition2File"
                            name="proposition2File"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleProposition2FileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {proposition2File && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {proposition2File.name} ({(proposition2File.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proposition 3 */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Proposition 3 (Premium) (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="proposition3File"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="proposition3File"
                            name="proposition3File"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={handleProposition3FileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                      {proposition3File && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {proposition3File.name} ({(proposition3File.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                {intelligenceStatusMessage && (
                  <div
                    className={`p-4 rounded-md flex items-start gap-3 ${
                      intelligenceStatus === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : intelligenceStatus === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    {intelligenceStatus === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : intelligenceStatus === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                    )}
                    <p
                      className={`text-sm ${
                        intelligenceStatus === 'success'
                          ? 'text-green-800'
                          : intelligenceStatus === 'error'
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      }`}
                    >
                      {intelligenceStatusMessage}
                    </p>
                  </div>
                )}

                {/* Process Button */}
                <button
                  onClick={handleProcessIntelligenceFile}
                  disabled={!intelligenceFile || isProcessingIntelligence}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isProcessingIntelligence ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Process Intelligence Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'competitive' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2">3. Competitive Intelligence</h2>
              <p className="text-sm text-gray-600">Upload competitive intelligence CSV file to display in the competitive intelligence section</p>
            </div>

            <div className="space-y-6">
              {/* Competitive Intelligence File Upload */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Competitive Intelligence File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="competitiveFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="competitiveFile"
                          name="competitiveFile"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="sr-only"
                          onChange={handleCompetitiveFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX, or XLS up to 50MB</p>
                    {competitiveFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {competitiveFile.name} ({(competitiveFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Expected CSV Format:</strong> The CSV should include columns like Company ID, Company Name, Headquarters, CEO, Year Established, Product/Service Portfolio, Strategies, Regional Strength, Overall Revenue, Segmental Revenue, Market Share, and Proposition fields (Proposition 1 Title, Proposition 1 Description, Proposition 1 Category, etc.)
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {competitiveStatusMessage && (
                <div
                  className={`p-4 rounded-md flex items-start gap-3 ${
                    competitiveStatus === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : competitiveStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  {competitiveStatus === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : competitiveStatus === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p
                    className={`text-sm ${
                      competitiveStatus === 'success'
                        ? 'text-green-800'
                        : competitiveStatus === 'error'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {competitiveStatusMessage}
                  </p>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcessCompetitiveIntelligence}
                disabled={!competitiveFile || isProcessingCompetitive}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessingCompetitive ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Process Competitive Intelligence Data
                  </>
                )}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* View Dashboard Button - Fixed at bottom */}
        {marketStatus === 'success' && (
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Ready to View Dashboard!</h3>
                  <p className="text-sm text-blue-800">
                    Your dashboard has been configured. Click below to view it.
                  </p>
                </div>
                <button
                  onClick={handleViewDashboard}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <Eye className="h-5 w-5" />
                  View Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
