import fs from 'fs'
import path from 'path'
import test from 'ava'
import rimraf from 'rimraf'
import makeSitemap from '../make_sitemap.js'
import { parseString } from 'xml2js'

const BUILDPATH = path.resolve(__dirname, './fixtures')
const SITEMAP_OUTPUT = path.resolve(BUILDPATH, 'sitemap.xml')

test.afterEach.always(t => {
  // Cleanup runs after each test
  rimraf.sync(SITEMAP_OUTPUT)
})

test.serial('Creates Sitemap with all html files', async (t) => {
  let xmlData
  let sitemapData = {}
  try {
    sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath: BUILDPATH,
      prettyURLs: true,
      failBuild() {},
    })
    xmlData = await parseXml(SITEMAP_OUTPUT)
  } catch (err) {
    console.log(err)
  }
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

test.serial("Creates Sitemap with all html files with trailing slash", async t => {
  let xmlData;
  let sitemapData = {};
  try {
    sitemapData = await makeSitemap({
      homepage: "https://site.com/",
      distPath: BUILDPATH,
      prettyURLs: true,
      trailingSlash: true,
      failBuild() {},
    });
    xmlData = await parseXml(SITEMAP_OUTPUT);
  } catch (err) {
    console.log(err);
  }
  const pages = getPages(xmlData);
  t.truthy(sitemapData.sitemapPath);
  t.deepEqual(pages, [
    "https://site.com/",
    "https://site.com/page-one/",
    "https://site.com/page-three/",
    "https://site.com/page-two/",
    "https://site.com/children/child-one/",
    "https://site.com/children/child-two/",
    "https://site.com/children/grandchildren/grandchild-one/",
    "https://site.com/children/grandchildren/grandchild-two/",
  ]);
});

test.serial('Sitemap pretty urls off works correctly', async (t) => {
  let xmlData
  let sitemapData = {}
  try {
    sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath: BUILDPATH,
      prettyURLs: false,
      failBuild() {},
    })
    xmlData = await parseXml(SITEMAP_OUTPUT)
  } catch (err) {
    console.log(err)
  }
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
  let xmlData
  let sitemapData = {}
  const EXCLUDE_PATH = path.resolve(__dirname, './fixtures/children/grandchildren/grandchild-two.html')
  try {
    sitemapData = await makeSitemap({
      homepage: 'https://site.com/',
      distPath: BUILDPATH,
      prettyURLs: true,
      exclude: [
        // Path
        EXCLUDE_PATH,
        // Glob pattern
        '**/**/child-one.html'
      ],
      failBuild() {},
    })
    xmlData = await parseXml(path.resolve(BUILDPATH, 'sitemap.xml'))
  } catch (err) {
    console.log(err)
  }
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
  let xmlData
  const defaultChangeFreq = "daily";
  const defaultPriority = 0.9;

  try {
    await makeSitemap({
      homepage: 'https://site.com/',
      distPath: BUILDPATH,
      prettyURLs: false,
      failPlugin() {},
      changeFreq: defaultChangeFreq,
      priority: defaultPriority,
    })
    xmlData = await parseXml(SITEMAP_OUTPUT)
  } catch (err) {
    console.log(err)
  }

  t.is(xmlData.urlset.url[0].changefreq[0], defaultChangeFreq);
  t.is(xmlData.urlset.url[0].priority[0], defaultPriority.toString());
})

test.serial('Sitemap changefreq and priority defaults to weekly and 0.8', async (t) => {
  let xmlData

  try {
    await makeSitemap({
      homepage: 'https://site.com/',
      distPath: BUILDPATH,
      prettyURLs: false,
      failPlugin() {},
    })
    xmlData = await parseXml(SITEMAP_OUTPUT)
  } catch (err) {
    console.log(err)
  }

  t.is(xmlData.urlset.url[0].changefreq[0], 'weekly');
  t.is(xmlData.urlset.url[0].priority[0], '0.8');
})

function getPages(data) {
  return data.urlset.url.map((record) => {
    return record.loc[0]
  })
}

async function parseXml(filePath) {
  const xml = fs.readFileSync(filePath, 'utf-8')
  return new Promise((resolve, reject) => {
    parseString(xml, function (err, result) {
      if (err) {
        return reject(err)
      }
      return resolve(result)
    })
  })
}
