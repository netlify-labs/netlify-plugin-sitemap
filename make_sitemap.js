const fs = require('fs')
const util = require('util')
const path = require('path')
const mkdirp = require('mkdirp')
const sm = require('sitemap')
const globby = require('globby')

module.exports = async function makeSitemap(opts = {}) {
  const { distPath, fileName, homepage, exclude, prettyURLs, failPlugin } = opts
  const htmlFiles = `${distPath}/**/**.html`
  const excludeFiles = (exclude || []).map((filePath) => {
    return `!${filePath.replace(/^!/, '')}`
  })

  const lookup = [ htmlFiles ].concat(excludeFiles)
  const paths = await globby(lookup)
  const urls = paths.map(file => {
    let urlPath = file.startsWith(distPath) ? file.replace(distPath, '') : distPath
    if (prettyURLs) {
      urlPath = urlPath.replace(/\/index\.html$/, '').replace(/\.html$/, '/')
    }
    return {
      url: urlPath,
      changefreq: 'weekly',
      priority: 0.8,
      lastmodrealtime: true,
      lastmodfile: file,
    }
  })
  const options = {
    hostname: `${homepage.replace(/\/$/, '')}/`,
    cacheTime: 600000, // 600 sec cache period
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
    sitemap: sitemap
  }
}
