import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const DEFAULT_RAW_BUDGET_BYTES = 500_000
const DEFAULT_GZIP_BUDGET_BYTES = 150_000
const distDirectory = path.resolve('dist')
const manifestPath = path.join(distDirectory, '.vite', 'manifest.json')

function readBudget(name, defaultValue) {
  const value = globalThis.process.env[name]

  if (value === undefined) {
    return defaultValue
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a non-negative integer number of bytes.`)
  }

  const bytes = Number(value)

  if (!Number.isSafeInteger(bytes)) {
    throw new Error(`${name} must be a safe integer number of bytes.`)
  }

  return bytes
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} bytes (${(bytes / 1_000).toFixed(2)} KB)`
}

const rawBudgetBytes = readBudget('BUNDLE_BUDGET_RAW_BYTES', DEFAULT_RAW_BUDGET_BYTES)
const gzipBudgetBytes = readBudget('BUNDLE_BUDGET_GZIP_BYTES', DEFAULT_GZIP_BUDGET_BYTES)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const entryAssets = Object.entries(manifest).filter(
  ([, asset]) => asset.isEntry && asset.file.endsWith('.js'),
)

if (entryAssets.length !== 1) {
  throw new Error(
    `Expected exactly one JavaScript production entry in ${manifestPath}; found ${entryAssets.length}.`,
  )
}

const [, entryAsset] = entryAssets[0]
const entryPath = path.join(distDirectory, entryAsset.file)
const entryContents = await readFile(entryPath)
const rawBytes = entryContents.byteLength
const gzipBytes = gzipSync(entryContents).byteLength

globalThis.console.log(`Entry asset: ${entryAsset.file}`)
globalThis.console.log(`Raw size: ${formatBytes(rawBytes)}`)
globalThis.console.log(`Gzip size: ${formatBytes(gzipBytes)}`)
globalThis.console.log(`Raw budget: ${formatBytes(rawBudgetBytes)}`)
globalThis.console.log(`Gzip budget: ${formatBytes(gzipBudgetBytes)}`)

const overages = []

if (rawBytes > rawBudgetBytes) {
  overages.push(`raw size exceeds its budget by ${formatBytes(rawBytes - rawBudgetBytes)}`)
}

if (gzipBytes > gzipBudgetBytes) {
  overages.push(`gzip size exceeds its budget by ${formatBytes(gzipBytes - gzipBudgetBytes)}`)
}

if (overages.length > 0) {
  globalThis.console.error(`Bundle budget failed: ${overages.join('; ')}.`)
  globalThis.process.exitCode = 1
} else {
  globalThis.console.log('Bundle budget passed.')
}
