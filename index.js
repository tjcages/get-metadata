var util = require("util");
var request = require("request");
var events = require("events");
var cheerio = require("cheerio");
var URI = require("uri-js");
var Promise = require('promise');
var _ = require("lodash");

var debug;

if (/\bmetainspector\b/.test(process.env.NODE_DEBUG)) {
  debug = function () {
    console.error("METAINSPECTOR %s", util.format.apply(util, arguments));
  };
} else {
  debug = function () {};
}

function withDefaultScheme(url) {
  return URI.parse(url).scheme ? url : "http://" + url;
}

var MetaInspector = function (url, options) {
  this.url = URI.normalize(withDefaultScheme(url));

  this.parsedUrl = URI.parse(this.url);
  this.scheme = this.parsedUrl.scheme;
  this.host = this.parsedUrl.host;
  this.rootUrl = this.scheme + "://" + this.host;

  this.options = options || {};
  //default to a sane limit, since for meta-inspector usually 5 redirects should do a job
  //more over beyond this there could be an issue with event emitter loop detection with new nodejs version
  //which prevents error event from getting fired
  this.options.maxRedirects = this.options.maxRedirects || 5;

  //some urls are timing out after one minute, hence need to specify a reasonable default timeout
  this.options.timeout = this.options.timeout || 20000; //Timeout in ms

  this.options.strictSSL = !!this.options.strictSSL;

  this.options.headers = this.options.headers || {
    "User-Agent": "MetaInspector/1.0",
  };
};

//MetaInspector.prototype = new events.EventEmitter();
// MetaInspector.prototype.__proto__ = events.EventEmitter.prototype;
// util.inherits(MetaInspector, events.EventEmitter);

module.exports = MetaInspector;

MetaInspector.prototype.getTitle = function () {
  debug("Parsing page title");

  if (!this.title) {
    this.title = this.parsedDocument("head > title").text();
  }

  return this;
};

MetaInspector.prototype.getFavicon = function () {
  debug("Parsing page favicon");

  if (this.favicon === undefined) {
    var favicon = this.parsedDocument("link[rel='icon']").attr("href");
    if (favicon) {
      this.favicon = this.getAbsolutePath(favicon);
    } else {
      favicon = this.parsedDocument("link[rel='shortcut icon']").attr("href");
      this.favicon = this.getAbsolutePath(favicon);
    }
  }

  return this;
};

MetaInspector.prototype.getTouchIcon = function () {
  debug("Parsing page apple-touch-icon");

  if (this.appleTouchIcon === undefined) {
    var touchIcon = this.parsedDocument("link[rel='apple-touch-icon']").attr(
      "href"
    );
    if (touchIcon) {
      this.appleTouchIcon = this.getAbsolutePath(touchIcon);
    }
  }

  return this;
};

MetaInspector.prototype.getOgTitle = function () {
  debug("Parsing page Open Graph title");

  if (!this.ogTitle) {
    this.ogTitle = this.parsedDocument("meta[property='og:title']").attr(
      "content"
    );
  }

  return this;
};

MetaInspector.prototype.getOgDescription = function () {
  debug("Parsing page Open Graph description");

  if (this.ogDescription === undefined) {
    this.ogDescription = this.parsedDocument(
      "meta[property='og:description']"
    ).attr("content");
  }

  return this;
};

MetaInspector.prototype.getOgType = function () {
  debug("Parsing page's Open Graph Type");

  if (this.ogType === undefined) {
    this.ogType = this.parsedDocument("meta[property='og:type']").attr(
      "content"
    );
  }

  return this;
};

MetaInspector.prototype.getOgUpdatedTime = function () {
  debug("Parsing page's Open Graph Updated Time");

  if (this.ogUpdatedTime === undefined) {
    this.ogUpdatedTime = this.parsedDocument(
      "meta[property='og:updated_time']"
    ).attr("content");

    return this;
  }
};

MetaInspector.prototype.getOgLocale = function () {
  debug("Parsing page's Open Graph Locale");

  if (this.ogLocale === undefined) {
    this.ogLocale = this.parsedDocument("meta[property='og:locale']").attr(
      "content"
    );
  }

  return this;
};

MetaInspector.prototype.getLinks = function () {
  debug("Parsing page links");

  var _this = this;

  if (!this.links) {
    this.links = this.parsedDocument("a").map(function (i, elem) {
      return _this.parsedDocument(this).attr("href");
    });
  }

  return this;
};

MetaInspector.prototype.getMetaDescription = function () {
  debug("Parsing page description based on meta elements");

  if (!this.description) {
    this.description = this.parsedDocument("meta[name='description']").attr(
      "content"
    );
  }

  return this;
};

MetaInspector.prototype.getSecondaryDescription = function () {
  debug("Parsing page secondary description");
  var _this = this;

  if (!this.description) {
    var minimumPLength = 120;

    this.parsedDocument("p").each(function (i, elem) {
      if (_this.description) {
        return;
      }

      var text = _this.parsedDocument(this).text();

      // If we found a paragraph with more than
      if (text.length >= minimumPLength) {
        _this.description = text;
      }
    });
  }

  return this;
};

MetaInspector.prototype.getDescription = function () {
  debug(
    "Parsing page description based on meta description or secondary description"
  );
  this.getMetaDescription();
  this.getSecondaryDescription();

  return this;
};

MetaInspector.prototype.getKeywords = function () {
  debug("Parsing page keywords from apropriate metatag");

  if (!this.keywords) {
    var keywordsString = this.parsedDocument("meta[name='keywords']").attr(
      "content"
    );

    if (keywordsString) {
      this.keywords = keywordsString.split(",");
    } else {
      this.keywords = [];
    }
  }

  return this;
};

MetaInspector.prototype.getAuthor = function () {
  debug("Parsing page author from apropriate metatag");

  if (!this.author) {
    this.author = this.parsedDocument("meta[name='author']").attr("content");
  }

  return this;
};

MetaInspector.prototype.getCharset = function () {
  debug("Parsing page charset from apropriate metatag");

  if (!this.charset) {
    this.charset = this.parsedDocument("meta[charset]").attr("charset");
  }

  return this;
};

MetaInspector.prototype.getImage = function () {
  debug("Parsing page image based on the Open Graph image");

  if (!this.image) {
    var img = this.parsedDocument("meta[property='og:image']").attr("content");
    if (img) {
      this.image = this.getAbsolutePath(img);
    } else {
      img = this.parsedDocument("meta[name='og:image']").attr("content");
      if (img) {
        this.image = this.getAbsolutePath(img);
      }
    }
  }

  return this;
};

MetaInspector.prototype.getImages = function () {
  debug("Parsing page body images");
  var _this = this;

  if (this.images === undefined) {
    this.images = this.parsedDocument("img").map(function (i, elem) {
      var src = _this.parsedDocument(this).attr("src");
      return _this.getAbsolutePath(src);
    });
  }

  return this;
};

MetaInspector.prototype.getFeeds = function () {
  debug("Parsing page feeds based on rss or atom feeds");

  if (!this.feeds) {
    this.feeds = this.parseFeeds("rss") || this.parseFeeds("atom");
  }

  return this;
};

MetaInspector.prototype.parseFeeds = function (format) {
  var _this = this;
  var feeds = this.parsedDocument(
    "link[type='application/" + format + "+xml']"
  ).map(function (i, elem) {
    return _this.parsedDocument(this).attr("href");
  });

  return feeds;
};

MetaInspector.prototype.getThemeColor = function () {
  debug("Parsing page theme color from apropriate metatag");

  if (!this.themeColor) {
    this.themeColor = this.parsedDocument("meta[name='theme-color']").attr("content");
  }

  return this;
};

MetaInspector.prototype.getTwitterCreator = function () {
  debug("Parsing twitter creator from apropriate metatag, if it exists");

  if (!this.twitterCreator) {
    this.twitterCreator = this.parsedDocument("meta[property='twitter:creator']").attr("content");
  }

  return this;
};

MetaInspector.prototype.initAllProperties = function () {
  // title of the page, as string
  this.getTitle()
    .getAuthor()
    .getCharset()
    .getKeywords()
    .getLinks()
    .getDescription()
    .getFavicon()
    .getTouchIcon()
    .getImage()
    .getImages()
    .getFeeds()
    .getThemeColor()
    .getOgTitle()
    .getOgDescription()
    .getOgType()
    .getOgUpdatedTime()
    .getOgLocale()
    .getTwitterCreator();
};

MetaInspector.prototype.getAbsolutePath = function (href) {
  if (/^(http:|https:)?\/\//i.test(href)) {
    return href;
  }
  if (!/^\//.test(href)) {
    href = "/" + href;
  }

  return this.rootUrl + href;
};

MetaInspector.prototype.fetch = function () {
  var _this = this;
  var totalChunks = 0;
  return new Promise(function (resolve, reject) {
    var req = request(
      _.assign({ uri: _this.url, gzip: true }, _this.options),
      function (error, response, body) {
        if (error) {
          return reject(error);
        }

        if (response.statusCode !== 200) {
          return reject(
            new Error("Response status code was " + response.statusCode)
          );
        }

        _this.response = response;
        _this.parsedDocument = cheerio.load(body);
        _this.initAllProperties();

        resolve(_this);
      }
    );

    req.on("data", function (chunk) {
      totalChunks += chunk.length;
      if (totalChunks > _this.maxBytes) {
        req.abort();
        reject(new Error("Response body exceeded maxBytes limit"));
      }
    });
  });
};
