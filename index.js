/* Generates a sitemap */
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const sm = require('sitemap')
const globby = require('globby')

module.exports = {
  name: '@netlify/plugin-sitemap',
  onPostBuild: async ({ constants, pluginConfig, netlifyConfig }) => {
    const baseUrl = pluginConfig.baseUrl || process.env.URL
    const buildConfig = netlifyConfig.build || {}
    // Backwards compat... Correct opt is buildDir
    const buildDistOpt = pluginConfig.dir || pluginConfig.distPath || pluginConfig.buildDir
    const buildDir = buildDistOpt || buildConfig.publish || constants.BUILD_DIR
    const excludeFiles = pluginConfig.exclude || []

    if (!buildDir) {
      throw new Error('Sitemap plugin missing build directory value')
    }
    if (!baseUrl) {
      throw new Error('Sitemap plugin missing homepage value')
    }
    console.log('Creating sitemap from files...')

    const data = await makeSitemap({
      homepage: baseUrl,
      distPath: buildDir,
      exclude: excludeFiles,
      prettyURLs: pluginConfig.prettyURLs
    })

    console.log('Sitemap Built!', data.sitemapFile)
  },
}

async function makeSitemap(opts = {}) {
  const { distPath, fileName, homepage, exclude, prettyURLs } = opts
  // eslint-disable-next-line
  const prettyUrlsEnabled = (prettyURLs === false || prettyURLs === 'false') ? false : true
  if (!distPath) {
    throw new Error('Missing distPath option')
  }
  const htmlFiles = `${distPath}/**/**.html`
  const excludeFiles = (exclude || []).map((filePath) => {
    return `!${filePath.replace(/^!/, '')}`
  })

  const lookup = [ htmlFiles ].concat(excludeFiles)
  const paths = await globby(lookup)
  const urls = paths.map(file => {
    const regex = new RegExp(`^${distPath}`)
    let urlPath = file.replace(regex, '')
    if (prettyUrlsEnabled) {
      urlPath = urlPath.replace(/\/index\.html$/, '').replace(/\.html$/, '')
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
  // Generates XML with a callback function
  sitemap.toXML(error => {
    if (error) {
      throw error
    }
  })
  // Gives you a string containing the XML data
  const xml = sitemap.toString()
  // write sitemap to file
  const sitemapFileName = fileName || 'sitemap.xml'
  const sitemapFile = path.resolve(distPath, sitemapFileName)
  // Ensure dist path
  await mkdirp(distPath)
  // Write sitemap
  fs.writeFileSync(sitemapFile, xml, 'utf-8')
  // Return info
  return {
    sitemapPath: sitemapFileName,
    sitemap: sitemap
  }
}

module.exports.makeSitemap = makeSitemap
