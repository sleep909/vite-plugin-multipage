const path = require("path");
const shell = require("shelljs");
const url = require("url");
const mime = require("mime-types");

let Config;

module.exports = (userConfig = {}) => {
  const defaultConfig = {
    open: "/",
    pageDir: "pages",
    purgeDir: "pages",
    removePageDirs: true,
    rootPage: "index.html",
    mimeCheck: true,
    ...userConfig,
  };

  return {
    name: "vite-plugin-multipage",
    enforce: "pre",

    config(config) {
      Config = config;
      config.root = config.root || process.cwd();
      config.pageDir = defaultConfig.pageDir;
      config.purgeDir = defaultConfig.purgeDir;
      config.removePageDirs = defaultConfig.removePageDirs;
      config.rootPage = defaultConfig.rootPage;
      config.mimeCheck = defaultConfig.mimeCheck;
      config.build = config.build || {};
      config.build.outDir = config.build.outDir || "dist";
      config.build.rollupOptions = config.build.rollupOptions || {};
      config.build.rollupOptions.input = getPageRoots();
      config.server = config.server || {};
      config.server.open = defaultConfig.open;
    },

    configureServer({ middlewares: app }) {
      app.use(rewritePages());
    },

    writeBundle() {
      const { pageDir, purgeDir, rootPage, removePageDirs } = Config;
      const resolve = (p) => path.resolve(Config.build.outDir, p);

      if (removePageDirs) {
        shell.ls(resolve(pageDir)).forEach((page) => {
          shell.mv(
            resolve(`${pageDir}/${page}/${rootPage}`),
            `${resolve(".")}/${page}.html`
          );
        });
      } else {
        shell.ls(resolve(pageDir)).forEach((page) => {
          shell.mv(resolve(`${pageDir}/${page}`), resolve("."));
        });
      }

      if (purgeDir) shell.rm("-rf", resolve(purgeDir));
    },
  };
};

const getPageRoots = () => {
  const roots = [];
  const { pageDir, rootPage } = Config;
  const resolve = (p) => path.resolve(Config.root, p);

  shell.ls(resolve(pageDir)).forEach((page) => {
    roots.push(resolve(`${pageDir}/${page}/${rootPage}`));
  });

  return roots;
};

const rewritePages = () => {
  const rules = [];
  const { pageDir, rootPage, mimeCheck } = Config;
  const resolve = (p) => path.resolve(Config.root, p);

  rules.push({
    from: /^\/$/,
    to: `/${pageDir}/${rootPage.replace(".html", "")}/${rootPage}`,
  });

  shell.ls(resolve(pageDir)).forEach((page) => {
    rules.push({
      from: new RegExp(`^/${page}/${rootPage}$`),
      to: `/${pageDir}/${page}/${rootPage}`,
    });
    rules.push({
      from: new RegExp(`^/${page}.html$`),
      to: `/${pageDir}/${page}/${rootPage}`,
    });
    rules.push({
      from: new RegExp(`^/${page}$`),
      to: `/${pageDir}/${page}/${rootPage}`,
    });
  });

  return (req, res, next) => {
    const name = url.parse(req.url).pathname;

    if (mimeCheck) {
      res.setHeader("Content-Type", mime.lookup(name));
    }

    for (var r in rules) {
      if (name.match(rules[r].from)) {
        req.url = rules[r].to;
        res.statusCode = 308;
        break;
      }
    }

    return next();
  };
};
