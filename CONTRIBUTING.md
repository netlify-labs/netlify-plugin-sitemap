# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing, please read the
[code of conduct](CODE_OF_CONDUCT.md).

## Setup

> Install Node.js + npm on your system: https://nodejs.org/en/download/

```sh
git clone git@github.com:netlify-labs/netlify-plugin-sitemap.git
cd netlify-plugin-sitemap
npm install
```

Make sure everything is correctly setup with:

```bash
npm test
npm run format
```

## Releasing

1. Merge the release PR
2. Switch to the default branch `git checkout main`
3. Pull latest changes `git pull`
4. Publish the package `npm publish`

## License

By contributing to Netlify Node Client, you agree that your contributions will be licensed under its
[MIT license](LICENSE).
