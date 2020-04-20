/* Generates a sitemap */
const makeSitemap = require('./make_sitemap')

module.exports = {
  onPostBuild: async ({ constants, inputs, utils }) => {
    const baseUrl = inputs.baseUrl || process.env.URL
    // Backwards compat... Correct opt is buildDir
    const buildDir = inputs.dir || inputs.distPath || inputs.buildDir || constants.PUBLISH_DIR

    console.log('Creating sitemap from files...')

    const data = await makeSitemap({
      homepage: baseUrl,
      distPath: buildDir,
      exclude: inputs.exclude,
      prettyURLs: inputs.prettyURLs,
      failPlugin: utils.build.failPlugin,
    })

    console.log('Sitemap Built!', data.sitemapPath)
  },
}
