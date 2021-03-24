const { readFile, unlink } = require('fs')
const path = require('path')
const { promisify } = require('util')

const test = require('ava')
const tempy = require('tempy')
const { parseString } = require('xml2js')

const pParseString = promisify(parseString)
const pUnlink = promisify(unlink)
const pReadFile = promisify(readFile)

const makeSitemap = require('../make_sitemap.js')

test.beforeEach((t) => {
  t.context.fileName = tempy.file({ name: 'sitemap.xml' })
})

test.afterEach(async (t) => {
  try {
    await pUnlink(t.context.fileName)
  } catch (_) {}
})

// Test relative and absolute paths
const CONFIGS = [
  {
    distPath: './fixtures',
    testNamePostfix: 'relative path',
    cwd: __dirname,
    excludePath: './fixtures/children/grandchildren/grandchild-two.html',
  },
  {
    distPath: path.resolve(__dirname, './fixtures'),
    testNamePostfix: 'absolute path',
    excludePath: path.resolve(__dirname, './fixtures/children/grandchildren/grandchild-two.html'),
  },
  {
    distPath: '.',
    testNamePostfix: 'root relative path',
    cwd: path.join(__dirname, 'fixtures'),
    excludePath: './children/grandchildren/grandchild-two.html',
  },
]

// eslint-disable-next-line max-lines-per-function
CONFIGS.forEach(({ distPath, testNamePostfix, cwd, excludePath }) => {
  test(`Creates Sitemap with all html files - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    const sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: true,
      failBuild() {},
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)
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

  test(`Creates Sitemap with all html files with trailing slash - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    const sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: true,
      trailingSlash: true,
      failBuild() {},
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)
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

  test(`Sitemap pretty urls off works correctly - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    const sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: false,
      failBuild() {},
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)
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

  test(`Sitemap applies changeFreq and priority when configured - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    const defaultChangeFreq = 'daily'
    const defaultPriority = 0.9

    await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: false,
      failBuild() {},
      changeFreq: defaultChangeFreq,
      priority: defaultPriority,
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)

    t.is(xmlData.urlset.url[0].changefreq[0], defaultChangeFreq)
    t.is(xmlData.urlset.url[0].priority[0], defaultPriority.toString())
  })

  test(`Sitemap changefreq and priority defaults to weekly and 0.8 - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: false,
      failBuild() {},
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)

    t.is(xmlData.urlset.url[0].changefreq[0], 'weekly')
    t.is(xmlData.urlset.url[0].priority[0], '0.8')
  })

  test(`Sitemap exclude works correctly - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    const sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: true,
      exclude: [
        // Path
        excludePath,
        // Glob pattern
        '**/**/child-one.html',
      ],
      failBuild() {},
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)
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

  test(`Sitemap urlPrefix works correctly - ${testNamePostfix}`, async (t) => {
    const { fileName } = t.context
    const sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath,
      prettyURLs: true,
      urlPrefix: 'en/',
      failBuild() {},
      fileName,
      cwd,
    })
    const xmlData = await parseXml(fileName)
    const pages = getPages(xmlData)
    t.truthy(sitemapData.sitemapPath)
    t.deepEqual(pages, [
      'https://site.com/en/',
      'https://site.com/en/page-one',
      'https://site.com/en/page-three',
      'https://site.com/en/page-two',
      'https://site.com/en/children/child-one',
      'https://site.com/en/children/child-two',
      'https://site.com/en/children/grandchildren/grandchild-one',
      'https://site.com/en/children/grandchildren/grandchild-two',
    ])
  })
})

const getPages = (data) => data.urlset.url.map((record) => record.loc[0])

const parseXml = async (filePath) => {
  const xml = await pReadFile(filePath, 'utf-8')
  const parsed = await pParseString(xml)
  return parsed
}
