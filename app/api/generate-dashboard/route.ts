import { NextRequest, NextResponse } from 'next/server'
import { convertExcelFiles } from '@excel-upload-tool/lib/excel-processor'
import { loadAndProcessJsonFiles } from '@/lib/json-processor'
import { generateDashboardFiles, createZipFile } from '@/lib/dashboard-generator'
import * as fs from 'fs/promises'
import * as path from 'path'
import { writeFile } from 'fs/promises'

// Timeout for large file processing and zip generation (5 minutes - Vercel limit)
// Note: Vercel free/hobby plan has a 300 second (5 minute) limit
export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * API Route to generate a deployment-ready dashboard package
 * 
 * Accepts multipart/form-data with:
 * - valueFile: Excel or CSV file for value data (required)
 * - volumeFile: Excel or CSV file for volume data (optional)
 * - projectName: Name for the generated project (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const valueFile = formData.get('valueFile') as File | null
    const volumeFile = formData.get('volumeFile') as File | null
    const projectName = (formData.get('projectName') as string | null) || 'market-dashboard'
    
    if (!valueFile) {
      return NextResponse.json(
        { error: 'valueFile is required' },
        { status: 400 }
      )
    }
    
    // Validate file types
    const valueFileName = valueFile.name.toLowerCase()
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const hasValidExtension = validExtensions.some(ext => valueFileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'valueFile must be an Excel file (.xlsx, .xls) or CSV file (.csv)' },
        { status: 400 }
      )
    }
    
    if (volumeFile) {
      const volumeFileName = volumeFile.name.toLowerCase()
      const hasValidVolumeExtension = validExtensions.some(ext => volumeFileName.endsWith(ext))
      
      if (!hasValidVolumeExtension) {
        return NextResponse.json(
          { error: 'volumeFile must be an Excel file (.xlsx, .xls) or CSV file (.csv)' },
          { status: 400 }
        )
      }
    }
    
    console.log('Starting dashboard generation...')
    
    // Convert files to buffers
    const valueBuffer = Buffer.from(await valueFile.arrayBuffer())
    const volumeBuffer = volumeFile ? Buffer.from(await volumeFile.arrayBuffer()) : undefined
    
    // Detect file types
    const isValueCsv = valueFileName.endsWith('.csv')
    const isVolumeCsv = volumeFile ? volumeFile.name.toLowerCase().endsWith('.csv') : false
    
    // Convert Excel/CSV to JSON
    console.log('Converting Excel/CSV files to JSON...')
    const { value: valueJson, volume: volumeJson } = convertExcelFiles(
      valueBuffer,
      volumeBuffer,
      isValueCsv,
      isVolumeCsv
    )
    
    // Create temporary JSON files for processing
    // Use /tmp in serverless environments (Vercel, AWS Lambda) which is the only writable directory
    // /tmp is guaranteed to exist in serverless environments, so we don't need to create it
    const os = require('os')
    const tempDir = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? '/tmp' : os.tmpdir()
    
    const tempValuePath = path.join(tempDir, `value_${Date.now()}.json`)
    const tempVolumePath = volumeJson ? path.join(tempDir, `volume_${Date.now()}.json`) : null
    const tempSegmentationPath = path.join(tempDir, `segmentation_${Date.now()}.json`)
    
    // Write JSON files
    await writeFile(tempValuePath, JSON.stringify(valueJson, null, 2), 'utf-8')
    if (tempVolumePath && volumeJson) {
      await writeFile(tempVolumePath, JSON.stringify(volumeJson, null, 2), 'utf-8')
    }
    
    // Create segmentation structure (without data, just structure)
    const segmentationJson = JSON.parse(JSON.stringify(valueJson))
    const removeYearData = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj
      
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (/^\d{4}$/.test(key) || key === 'CAGR') {
          continue
        }
        
        if (typeof value === 'object' && value !== null) {
          result[key] = removeYearData(value)
        } else {
          result[key] = value
        }
      }
      
      return result
    }
    
    const segmentationStructure = removeYearData(segmentationJson)
    await writeFile(tempSegmentationPath, JSON.stringify(segmentationStructure, null, 2), 'utf-8')
    
    // Process JSON files through existing pipeline
    console.log('Processing JSON files through pipeline...')
    const comparisonData = await loadAndProcessJsonFiles(
      tempValuePath,
      tempVolumePath,
      tempSegmentationPath
    )
    
    // Clean up temporary files
    try {
      await fs.unlink(tempValuePath)
      if (tempVolumePath) {
        await fs.unlink(tempVolumePath)
      }
      await fs.unlink(tempSegmentationPath)
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError)
    }
    
    // Generate dashboard files
    console.log('Generating dashboard files...')
    const files = await generateDashboardFiles(comparisonData, projectName)
    
    // Create zip file
    console.log('Creating zip file...')
    const zipBuffer = await createZipFile(files)
    
    console.log('Dashboard generation completed successfully')
    
    // Return zip file as response
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating dashboard:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error && error.stack ? error.stack : String(error)
    
    let userFriendlyMessage = errorMessage
    if (errorMessage.includes('Invalid file format')) {
      userFriendlyMessage = `File format error: ${errorMessage}`
    } else if (errorMessage.includes('Could not detect')) {
      userFriendlyMessage = `Column detection error: ${errorMessage}. Please ensure your file has the correct headers.`
    }
    
    return NextResponse.json(
      {
        error: 'Failed to generate dashboard',
        details: userFriendlyMessage,
        debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}




