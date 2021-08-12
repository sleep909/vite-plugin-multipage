# vite-plugin-multipage

> Adds multi-page application support to Vite.

## Installation & Usage

First:

```shell
npm i --save-dev vite-plugin-multipage
```

Then, in `vite.config.js`, something like this:

```javascript
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import multipage from "vite-plugin-multipage";

export default defineConfig({
  plugins: [
    solid(),
    multipage({
      // This is an optional object, defaults as follows:
      mimeCheck: true /* mimeCheck: Set the MIME type on each request using
                         `mime-types.lookup()` */,
      open: "/" /* open: Path to load when starting the server.
                   May be left empty and not open anything. */,
      pageDir: "pages" /* pageDir: Path to the directory with the pages. */,
      purgeDir: "pages" /* purgeDir: Path to be removed after building.
                           May be left empty to remove nothing. */,
      removePageDirs: true /* removePageDirs: Change the final result from
                               "./page/index.html" to "./page.html". */,
      rootPage: "index.html" /* rootPage: The entry point into each page. */,
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },

  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
});
```

## What does it do?

This plugin extends Vite to handle collections of single-page applications.
By following a simple and adjustable naming convention, Vite will ultimately
bundle your collection of pages as:

```
build.outDir: (./dist, by default)

   ./assets/   ./index/index.html   ./pagetwo/index.html ... ./pagetwenty/index.html
```

The project directory for the above would maybe look like:

```
  |--- ./package.json
  |--- ./vite.config.js
  |--- ./assets/
  |--- ./components/
  |--- ./pages/  # This is set by $pageDir.
       |--- ./index/
            |--- ./views/
            |--- ./index.css
            |--- ./index.html
            |--- ./index.jsx
       |--- ./pagetwo/
            |--- ./index.css
            |--- ./index.html # The HTML *must* match $rootPage!
            |--- ./index.jsx
       [....]
       |--- ./pagetwenty/
            |--- ./index.css
            |--- ./index.html
            |--- ./index.jsx
```

The contents of `./pagetwo/index.html` would resemble:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>example page</title>
    <link rel="icon" href="/assets/favicon.ico" />
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
  </head>
  <body>
    <noscript>you need to enable javascript to run this app</noscript>
    <div id="root"></div>
    <script src="/pages/pagetwo" type="module"></script>
  </body>
</html>
```

And `./pagetwo/index.jsx`:

```javascript
import { render } from "solid-js/web";

import "./index.css";
import logo from "@/assets/logo.svg";

function App() {
  return (
    <div>
      <header>
        <img src={logo} alt="logo" />
        <p>you are on page 2 :(</p>
        <a href="/pagetwenty">go to page 20 !</a>
      </header>
    </div>
  );
}

render(App, document.getElementById("root"));
```

## What's the catch?

There are some small caveats to keep in mind with this setup and it is all
related to path resolving.

HTML files must link to files from the perspective of the project root. The
only allowed shortcut is that you may omit the `.jsx` in links and the entire
`/index.jsx`, such as using `/pages/foo` instead of `/pages/foo/index.jsx`.

JSX files need an `@` alias to point to the project root when linking to
`./assets/` and similar other files. It is not available from inside HTML.
Otherwise the linking perspective is from that of the current file directory.

You have several options when linking between pages from JSX due to link
rewriting that this plugin does with the Vite server:

- `href="/"` will point to `/pages/index/index.html`.
- `href="/foo"` will point to `/pages/foo/index.html`.
- `href="/foo.html` will also point to `/pages/foo/index.html`.
- `href="/foo/index.html` will also point to `/pages/foo/index.html`.

What convention you select to use will depend on your configuration of
`removePageDirs` and if you will be doing path or hash based routing:

- Path based routing: `removePageDirs: false`, use `href="/foo"`
- Hash based routing: `removePageDirs: true`, use `href="/foo.html"`
- Single page sites: `removePageDirs: true`, use `href="/"`

This plugin will rewrite `/foo` to `/pages/foo/index.html` to allow for
in-page path routing libraries to function. You will be responsible for doing
similar in your production server, where `/foo` should be mapped to either
`/foo/index.html` or `/foo.html` depending on how `removePageDirs` is set.

Finally, the `$purgeDir` directory is removed. This typically will be the same
path as `$pageDir`, however in the case of `$pageDir` being set to `src/pages`
you will likely wish to set `$purgeDir` to `src` rather than `src/pages`. This
is up to you, depending if you use the `src` prefix directory and if you have
other directories you would like copied to the final build directory.

## License

0BSD
