/* Generates a sitemap */
const { env } = require('process')

const makeSitemap = require('./make_sitemap')

const getInputsDir = ({ inputs }) => inputs.dir || inputs.distPath || inputs.buildDir

const getBuildDir = ({ inputs, constants }) => {
  // Backwards compat... Correct opt is buildDir
  const buildDir = getInputsDir({ inputs }) || constants.PUBLISH_DIR
  // constants.PUBLISH_DIR is always an absolute path
  if (buildDir === constants.PUBLISH_DIR) {
    return buildDir
  }
  // remove leading / to treat the dir a a relative one
  const trimmedBuildDir = buildDir.startsWith('/') ? buildDir.slice(1) : buildDir
  return trimmedBuildDir || '.'
}

module.exports = {
  onPostBuild: async ({ constants, inputs, utils }) => {
    const baseUrl = inputs.baseUrl || env.NETLIFY_PLUGIN_SITEMAP_BASEURL || env.URL
    const urlPrefix = inputs.urlPrefix || env.NETLIFY_PLUGIN_SITEMAP_URL_PREFIX || null
    const buildDir = getBuildDir({ inputs, constants })

    console.log('Creating sitemap from files...')

    const data = await makeSitemap({
      fileName: inputs.filePath,
      homepage: baseUrl,
      distPath: buildDir,
      exclude: inputs.exclude,
      prettyURLs: inputs.prettyURLs,
      changeFreq: inputs.changeFreq,
      priority: inputs.priority,
      trailingSlash: inputs.trailingSlash,
      failBuild: utils.build.failBuild,
      urlPrefix,
    })

    console.log('Sitemap Built!', data.sitemapPath)
  },
}
