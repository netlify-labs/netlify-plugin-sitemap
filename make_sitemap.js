const fs = require('fs')
const path = require('path')
const util = require('util')

const globby = require('globby')
const mkdirp = require('mkdirp')
const sm = require('sitemap')

const getPaths = async ({ distPath, exclude }) => {
  const htmlFiles = `${distPath}/**/**.html`
  const excludeFiles = (exclude || []).map((filePath) => `!${filePath.replace(/^!/, '')}`)

  const lookup = [htmlFiles].concat(excludeFiles)
  const paths = await globby(lookup)
  return paths
}

const getUrlFromFile = ({ file, distPath, prettyURLs, trailingSlash }) => {
  const url = file.startsWith(distPath) ? file.replace(distPath, '') : distPath

  if (!prettyURLs) {
    return url
  }

  const prettyUrl = url.replace(/\/index\.html$/, '').replace(/\.html$/, '')

  if (!trailingSlash) {
    return prettyUrl
  }

  return prettyUrl.endsWith('/') ? prettyUrl : `${prettyUrl}/`
}

const DEFAULT_CHANGE_FREQ = 'weekly'
const DEFAULT_PRIORITY = 0.8
// 600 sec cache period
const DEFAULT_CACHE_TIME = 600000

module.exports = async function makeSitemap(opts = {}) {
  const { distPath, fileName, homepage, exclude, prettyURLs, trailingSlash, failBuild } = opts
  const paths = await getPaths({ distPath, exclude })
  const urls = paths.map((file) => {
    const url = getUrlFromFile({ file, distPath, prettyURLs, trailingSlash })
    return {
      url,
      changefreq: opts.changeFreq || DEFAULT_CHANGE_FREQ,
      priority: opts.priority || DEFAULT_PRIORITY,
      lastmodrealtime: true,
      lastmodfile: file,
    }
  })
  const options = {
    hostname: `${homepage.replace(/\/$/, '')}/`,
    cacheTime: DEFAULT_CACHE_TIME,
    urls,
  }
  // Creates a sitemap object given the input configuration with URLs
  const sitemap = sm.createSitemap(options)
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
