import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const siteUrl = 'https://hitenjadeja.github.io/the-build-bench/'
const catalogPath = fileURLToPath(new URL('../data/harnesses.v1.json', import.meta.url))
const publicCatalogPath = fileURLToPath(new URL('../public/catalog.json', import.meta.url))
const sitemapPath = fileURLToPath(new URL('../public/sitemap.xml', import.meta.url))
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))

await copyFile(catalogPath, publicCatalogPath)

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${catalog.generatedAt}</lastmod>
  </url>
</urlset>
`

await writeFile(sitemapPath, sitemap, 'utf8')
console.log(`Prepared catalog.json and sitemap.xml for ${catalog.harnesses.length} harnesses.`)
