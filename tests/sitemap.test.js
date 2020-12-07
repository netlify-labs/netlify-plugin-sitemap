const fs = require('fs/promises')
const path = require('path')
const { promisify } = require('util')

const test = require('ava')
const rimraf = require('rimraf')
const { parseString } = require('xml2js')

const pParseString = promisify(parseString)

const makeSitemap = require('../make_sitemap.js')

const BUILDPATH = path.resolve(__dirname, './fixtures')
const SITEMAP_OUTPUT = path.resolve(BUILDPATH, 'sitemap.xml')

test.afterEach.always(() => {
  // Cleanup runs after each test
  rimraf.sync(SITEMAP_OUTPUT)
})

test.serial('Creates Sitemap with all html files', async (t) => {
  const sitemapData = await makeSitemap({
    homepage: 'https://site.com/',
    distPath: BUILDPATH,
    prettyURLs: true,
    failBuild() {},
  })
  const xmlData = await parseXml(SITEMAP_OUTPUT)
  const pages = getPages(xmlData)
  t.truthy(sitemapData.sitemapPath)
  t.deepEqual(pages, [
    'https://site.com/',
    'https://site.com/page-one',
    'https://site.com/page-three',
    'https://site.com/page-two',
    'https://site.com/children/child-one',
    'https://site.com/children/child-two',
    'https://site.com/children/grandchildren/grandchild-one',
    'https://site.com/children/grandchildren/grandchild-two',
  ])
})

test.serial('Creates Sitemap with all html files with trailing slash', async (t) => {
  const sitemapData = await makeSitemap({
    homepage: 'https://site.com/',
    distPath: BUILDPATH,
    prettyURLs: true,
    trailingSlash: true,
    failBuild() {},
  })
  const xmlData = await parseXml(SITEMAP_OUTPUT)
  const pages = getPages(xmlData)
  t.truthy(sitemapData.sitemapPath)
  t.deepEqual(pages, [
    'https://site.com/',
    'https://site.com/page-one/',
    'https://site.com/page-three/',
    'https://site.com/page-two/',
    'https://site.com/children/child-one/',
    'https://site.com/children/child-two/',
    'https://site.com/children/grandchildren/grandchild-one/',
    'https://site.com/children/grandchildren/grandchild-two/',
  ])
})

test.serial('Sitemap pretty urls off works correctly', async (t) => {
  const sitemapData = await makeSitemap({
    homepage: 'https://site.com/',
    distPath: BUILDPATH,
    prettyURLs: false,
    failBuild() {},
  })
  const xmlData = await parseXml(SITEMAP_OUTPUT)
  const pages = getPages(xmlData)
  t.truthy(sitemapData.sitemapPath)
  t.deepEqual(pages, [
    'https://site.com/index.html',
    'https://site.com/page-one.html',
    'https://site.com/page-three.html',
    'https://site.com/page-two.html',
    'https://site.com/children/child-one.html',
    'https://site.com/children/child-two.html',
    'https://site.com/children/grandchildren/grandchild-one.html',
    'https://site.com/children/grandchildren/grandchild-two.html',
  ])
})

test.serial('Sitemap exclude works correctly', async (t) => {
  const EXCLUDE_PATH = path.resolve(__dirname, './fixtures/children/grandchildren/grandchild-two.html')
  const sitemapData = await makeSitemap({
    homepage: 'https://site.com/',
    distPath: BUILDPATH,
    prettyURLs: true,
    exclude: [
      // Path
      EXCLUDE_PATH,
      // Glob pattern
      '**/**/child-one.html',
    ],
    failBuild() {},
  })
  const xmlData = await parseXml(path.resolve(BUILDPATH, 'sitemap.xml'))
  const pages = getPages(xmlData)
  t.truthy(sitemapData.sitemapPath)
  t.deepEqual(pages, [
    'https://site.com/',
    'https://site.com/page-one',
    'https://site.com/page-three',
    'https://site.com/page-two',
    // excluded 'https://site.com/children/child-one.html',
    'https://site.com/children/child-two',
    'https://site.com/children/grandchildren/grandchild-one',
    // excluded 'https://site.com/children/grandchildren/grandchild-two.html'
  ])
})

test.serial('Sitemap applies changeFreq and priority when configured', async (t) => {
  const defaultChangeFreq = 'daily'
  const defaultPriority = 0.9

  await makeSitemap({
    homepage: 'https://site.com/',
    distPath: BUILDPATH,
    prettyURLs: false,
    failBuild() {},
    changeFreq: defaultChangeFreq,
    priority: defaultPriority,
  })
  const xmlData = await parseXml(SITEMAP_OUTPUT)

  t.is(xmlData.urlset.url[0].changefreq[0], defaultChangeFreq)
  t.is(xmlData.urlset.url[0].priority[0], defaultPriority.toString())
})

test.serial('Sitemap changefreq and priority defaults to weekly and 0.8', async (t) => {
  await makeSitemap({
    homepage: 'https://site.com/',
    distPath: BUILDPATH,
    prettyURLs: false,
    failBuild() {},
  })
  const xmlData = await parseXml(SITEMAP_OUTPUT)

  t.is(xmlData.urlset.url[0].changefreq[0], 'weekly')
  t.is(xmlData.urlset.url[0].priority[0], '0.8')
})

const getPages = (data) => data.urlset.url.map((record) => record.loc[0])

const parseXml = async (filePath) => {
  const xml = await fs.readFile(filePath, 'utf-8')
  const parsed = await pParseString(xml)
  return parsed
}
