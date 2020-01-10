# Netlify sitemap plugin

Automatically generate a sitemap for your site on `PostBuild` in Netlify.

## Installation

```
npm install @netlify/plugin-sitemap --save-dev
```

## How to use

In your netlify config file add the plugin to the `plugins` block.

```yml
# netlify.yml file
plugins:
  - package: '@netlify/plugin-sitemap'
```

Here is a larger example configuration file.

```yml
# netlify.yml file

# Build Settings
build:
  publish: build

# Build plugins attached to build process
plugins:
  - package: '@netlify/plugin-sitemap'
```

## Configuration

Configure the plugin `buildDir`. Default is the `build.publish` value from Netlify config.

```yml
plugins:
  - package: '@netlify/plugin-sitemap'
    config:
      buildDir: build
```
