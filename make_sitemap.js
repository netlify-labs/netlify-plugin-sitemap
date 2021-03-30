const fs = require('fs')
const path = require('path')
const util = require('util')

const globby = require('globby')
const mkdirp = require('mkdirp')
const { createSitemap } = require('sitemap')

const ensureTrailingSlash = (url) => (url.endsWith('/') ? url : `${url}/`)

const getPaths = async ({ distPath, exclude = [], cwd = '.' }) => {
  const relPath = getRelPath(distPath, cwd)
  const htmlFiles = relPath === '' ? '**/**.html' : `${relPath}/**/**.html`
  const excludeFiles = exclude.map((excludedPath) => `!${getRelPath(excludedPath, cwd).replace(/^!/, '')}`)

  const lookup = [htmlFiles, ...excludeFiles]
  const paths = await globby(lookup, { cwd })
  return paths
}

// Globbing patterns cannot use backslashes, but Windows use some. It cannot use
// Windows drives.
// Note: this does not apply to `globby` `cwd` option.
const getRelPath = function (filePath, cwd) {
  const relPath = path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath
  return relPath.replace(/\\/g, '/')
}

const prettifyUrl = ({ url, trailingSlash }) => {
  const prettyUrl = url.replace(/\/?index\.html$/, '').replace(/\.html$/, '')

  if (!trailingSlash) {
    return prettyUrl
  }

  return ensureTrailingSlash(prettyUrl)
}

const getUrlFromFile = ({ file, distPath, prettyURLs, trailingSlash }) => {
  const url = path.relative(distPath, file)

  if (!prettyURLs) {
    return url
  }

  const prettyUrl = prettifyUrl({ url, trailingSlash })
  return prettyUrl
}

const getUrlsFromPaths = ({ paths, distPath, prettyURLs, trailingSlash, changeFreq, priority, cwd, urlPrefix }) => {
  const urls = paths.map((file) => {
    const url = getUrlFromFile({ file, distPath, prettyURLs, trailingSlash })

    return {
      url: (urlPrefix ? urlPrefix + url : url).replace('//', '/'),
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

// Creates a sitemap object given the input configuration with URLs and generates XML
const createSitemapInfo = async function ({ homepage, urls, failBuild }) {
  try {
    const hostname = ensureTrailingSlash(homepage)
    const sitemap = createSitemap({ hostname, cacheTime: DEFAULT_CACHE_TIME, urls })
    await util.promisify(sitemap.toXML.bind(sitemap))()
    const xml = sitemap.toString()
    return { sitemap, xml }
  } catch (error) {
    return failBuild('Could not generate XML sitemap', { error })
  }
}

module.exports = async function makeSitemap(opts = {}) {
  const {
    distPath,
    fileName,
    homepage,
    urlPrefix,
    exclude,
    prettyURLs,
    trailingSlash,
    failBuild,
    cwd,
    changeFreq = DEFAULT_CHANGE_FREQ,
    priority = DEFAULT_PRIORITY,
  } = opts

  const paths = await getPaths({ distPath, exclude, cwd })
  const urls = getUrlsFromPaths({ paths, distPath, prettyURLs, trailingSlash, changeFreq, priority, cwd, urlPrefix })

  const { sitemap, xml } = await createSitemapInfo({ homepage, urls, failBuild })

  // write sitemap to file
  const sitemapFileName = fileName || 'sitemap.xml'
  const sitemapFile = path.resolve(distPath, sitemapFileName)
  await mkdirp(path.dirname(sitemapFile))
  // Write sitemap
  await util.promisify(fs.writeFile)(sitemapFile, xml)
  // Return info
  return {
    sitemapPath: sitemapFileName,
    sitemap,
  }
}
