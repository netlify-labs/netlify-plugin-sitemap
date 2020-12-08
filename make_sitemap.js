const fs = require('fs')
const path = require('path')
const util = require('util')

const globby = require('globby')
const mkdirp = require('mkdirp')
const { createSitemap } = require('sitemap')

const ensureTrailingSlash = (url) => (url.endsWith('/') ? url : `${url}/`)

const getPaths = async ({ distPath, exclude, cwd }) => {
  const htmlFiles = `${distPath}/**/**.html`
  const excludeFiles = (exclude || []).map((filePath) => `!${filePath.replace(/^!/, '')}`)

  const lookup = [htmlFiles].concat(excludeFiles)
  const paths = await globby(lookup, { cwd })
  return paths
}

const normalizeFile = ({ file, distPath }) => {
  // handle root distPath
  if (distPath === '.') {
    return `/${file}`
  }

  if (file.startsWith(distPath)) {
    return file.replace(distPath, '')
  }

  return distPath
}

const prettifyUrl = ({ url, trailingSlash }) => {
  const prettyUrl = url.replace(/\/index\.html$/, '').replace(/\.html$/, '')

  if (!trailingSlash) {
    return prettyUrl
  }

  return ensureTrailingSlash(prettyUrl)
}

const getUrlFromFile = ({ file, distPath, prettyURLs, trailingSlash }) => {
  const url = normalizeFile({ file, distPath })

  if (!prettyURLs) {
    return url
  }

  const prettyUrl = prettifyUrl({ url, trailingSlash })
  return prettyUrl
}

const getUrlsFromPaths = ({ paths, distPath, prettyURLs, trailingSlash, changeFreq, priority, cwd }) => {
  const urls = paths.map((file) => {
    const url = getUrlFromFile({ file, distPath, prettyURLs, trailingSlash })
    return {
      url,
      changefreq: changeFreq,
      priority,
      lastmodrealtime: true,
      lastmodfile: cwd === undefined ? file : path.resolve(cwd, file),
    }
  })
  return urls
}

const DEFAULT_CHANGE_FREQ = 'weekly'
const DEFAULT_PRIORITY = 0.8
// 600 sec cache period
const DEFAULT_CACHE_TIME = 600000

module.exports = async function makeSitemap(opts = {}) {
  const {
    distPath,
    fileName,
    homepage,
    exclude,
    prettyURLs,
    trailingSlash,
    failBuild,
    cwd,
    changeFreq = DEFAULT_CHANGE_FREQ,
    priority = DEFAULT_PRIORITY,
  } = opts

  const paths = await getPaths({ distPath, exclude, cwd })
  const urls = getUrlsFromPaths({ paths, distPath, prettyURLs, trailingSlash, changeFreq, priority, cwd })

  // Creates a sitemap object given the input configuration with URLs
  const sitemap = createSitemap({ hostname: ensureTrailingSlash(homepage), cacheTime: DEFAULT_CACHE_TIME, urls })
  // Generates XML
  try {
    await util.promisify(sitemap.toXML.bind(sitemap))()
  } catch (error) {
    failBuild('Could not generate XML sitemap', { error })
  }
  // Gives you a string containing the XML data
  const xml = sitemap.toString()
  // write sitemap to file
  const sitemapFileName = fileName || 'sitemap.xml'
  const sitemapFile = path.resolve(distPath, sitemapFileName)
  // Ensure dist path
  await mkdirp(distPath)
  // Write sitemap
  await util.promisify(fs.writeFile)(sitemapFile, xml)
  // Return info
  return {
    sitemapPath: sitemapFileName,
    sitemap,
  }
}
