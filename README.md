![status](https://secure.travis-ci.org/gabceb/node-metainspector.png?branch=master)

## og-metadata

An npm package to access website metadata & link tags. Returns the title, description, favicon, preview image, keywords, theme color, etc. for a given website url.

### Install
With npm:
```
npm install og-metadata
```
With yarn:
```
yarn add og-metadata
```


### Example
Add og-metadata to a Nodejs project & access like
```js
// example export as a Firebase Function
exports.getUrlMetadata = functions.https.onCall((data, context) => {
  const url = data.url; // eg. https://tylerj.me
  if (url) {
    // begin og-metadata code
    const MetaInspector = require("og-metadata");

    var client = new MetaInspector(url, { timeout: 5000 });
    return client.fetch().then(() => {
      // note: no error handling yet
      const data = {
        title: client.title,
        description: client.description,
        image: client.image,
        favicon: client.favicon,
        appleTouchIcon: client.appleTouchIcon,
        url: client.url,
        host: client.host,
        keywords: client.keywords,
        themeColor: client.themeColor,
        twitterCreator: client.twitterCreator,
      };
      return data;
    });
  }
});
```


### Available data
| Key      | Description |
| ----------- | ----------- |
| url      | full url of the page       |
| scheme   | scheme of the page (http, https)        |
| host   | hostname of the page (eg. tylerj.me)        |
| rootUrl   | absolute url of the page w/o subpages or queries        |
| title   | title of the page        |
| description   | description of the page or the first long paragraph if no meta description is provided        |
| author   | page author        |
| keywords   | page keywords, as an array        |
| charset   | charset of the page        |
| links   | every link found on the page, as an array       |
| themeColor   | theme color of the page, if provided        |
| image   | social preview image of the page        |
| favicon   | website favicon image        |
| appleTouchIcon   | Apple touch icon of the page, if provided        |
| images   | every image found on the page, as an array        |
| feeds   | rss or atom links, as an array        |
| ogTitle   | opengraph title        |
| ogDescription   | opengraph description        |
| ogType   | opengraph object type        |
| ogUpdatedTime   | opengraph updated time        |
| ogLocale   | opengraph locale language        |
| twitterCreator   | Twitter creator, if provided        |


### Options
| Option      | Description | Default value |
| ----------- | ----------- | ----------- |
| timeout      | the time in ms to wait for the url to respond       | 20000ms |
| maxRedirects   | the number of redirects allowed        | 5 |
| strictSSL   | force SSL (https instead of http)        | false |
| headers   | options headers for the request        | `{ 'User-Agent' : 'MetaInspector/1.0' }` |

