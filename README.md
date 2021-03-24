# Netlify sitemap plugin

Automatically generate a sitemap for your site after it finishes building in Netlify.

## Installation

You can install this plugin in the Netlify UI from this [direct in-app installation link](https://app.netlify.com/plugins/@netlify/plugin-sitemap/install) or from the [Plugins directory](https://app.netlify.com/plugins).

To use file-based installation, add the following lines to your `netlify.toml` file:

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"
```

Note: The `[[plugins]]` line is required for each plugin, even if you have other plugins in your `netlify.toml` file already.

To complete file-based installation, from your project's base directory, use npm, yarn, or any other Node.js package manager to add this plugin to devDependencies in `package.json`.

```
npm install -D @netlify/plugin-sitemap
```

## Configuration

By default, the plugin generates a sitemap based on the `publish` directory configured in your site build settings or `netlify.toml`.
To change the default behavior use the `buildDir` configuration.

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  buildDir = "public"
```

### Writing to a subfolder path

If your site is meant to be served from a subfolder, you can also apply the `filePath` parameter in order to place the `sitemap.xml` in a particular location _within_ in the `buildDir`. NOTE: this parameter must contain the full file name including "sitemap.xml".

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  buildDir = "public"
  filePath = "some/subfolder/sitemap.xml"
```

### Excluding files from sitemap

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  buildDir = "public"
  exclude = [
    # By file Path
    './build-dir/path-to/file.html',
    # By Glob pattern
    '**/**/child-one.html'
  ]
```

### Pretty URLs

Pretty urls a.k.a. `site.com/index.html` being turned into  `site.com/` is on by default.

To disable this feature set the `prettyURLs` option to `false`

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  buildDir = "public"
  # disable pretty URLS and keep `index.html` & trailing `.html` file references in paths
  prettyURLs = false
```

When using pretty URLs, missing trailing slashes can be appended by setting the `trailingSlash` option to `true`. This renders `site.com/page-one.html` as `site.com/page-one/`.

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  buildDir = "public"
  prettyURLs = true
  # Append missing trailing slash to pretty URL
  trailingSlash = true
```

### Set the default values for "changefreq" and "priority"

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  changeFreq = "daily"
  priority = 0.5
```
### Set base URL from environment variable rather than plugin input

You can include an environment variable (`NETLIFY_PLUGIN_SITEMAP_BASEURL`) in your Netlify site to set the base URL that will be used by the plugin. This option is useful if the `baseUrl` plugin input can't be used.
Example use case: different Netlify sites built from the same repository and don't/can't have custom domains.

Priority of base URL assignment:
plugin input `baseUrl` -> env `NETLIFY_PLUGIN_SITEMAP_BASEURL` -> Netlify site default URL

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  baseUrl = "http://example.com"
```

>  NOTE: Although the above is called base URL this actually ends up being the hostname in the sitemap and as such trying to use a URL like `http://example.com/en/` will results in `http://example.com/`

### Add a prefix to the URL

You can include an environment variable (NETLIFY_PLUGIN_SITEMAP_URL_PREFIX) in your Netlify site to set the URL prefix that will be used by the plugin. This option is useful if the urlPrefix plugin input can't be used. Example use case: different Netlify sites built from the same repository and don't/can't have custom domains.

Priority of base URL assignment: plugin input urlPrefix -> env NETLIFY_PLUGIN_SITEMAP_URL_PREFIX

```toml
[[plugins]]
package = "@netlify/plugin-sitemap"

  [plugins.inputs]
  urlPrefix = "/en/"
```
