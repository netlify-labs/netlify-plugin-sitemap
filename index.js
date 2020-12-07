/* Generates a sitemap */
const { env } = require('process')

const makeSitemap = require('./make_sitemap')

const getBuildDir = ({ inputs, constants }) => {
  // Backwards compat... Correct opt is buildDir
  const buildDir = inputs.dir || inputs.distPath || inputs.buildDir || constants.PUBLISH_DIR
  // remove leading / to treat the dir a a relative one
  const trimmedBuildDir = buildDir.startsWith('/') ? buildDir.slice(1) : buildDir
  return trimmedBuildDir
}

module.exports = {
  onPostBuild: async ({ constants, inputs, utils }) => {
    const baseUrl = inputs.baseUrl || env.URL
    const buildDir = getBuildDir({ inputs, constants })

    console.log('Creating sitemap from files...')

    const data = await makeSitemap({
      homepage: baseUrl,
      distPath: buildDir,
      exclude: inputs.exclude,
      prettyURLs: inputs.prettyURLs,
      changeFreq: inputs.changeFreq,
      priority: inputs.priority,
      trailingSlash: inputs.trailingSlash,
      failBuild: utils.build.failBuild,
    })

    console.log('Sitemap Built!', data.sitemapPath)
  },
}
