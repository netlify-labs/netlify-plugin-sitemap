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
