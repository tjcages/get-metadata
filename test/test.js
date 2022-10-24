require("mocha");

var MetaInspector = require("../index");
var should = require("should");

require("./fixtures/fixtures");

describe("metainspector", function () {
  describe("multiple clients", function () {
    var firstClient = new MetaInspector("http://www.google.com");
    var secondClient = new MetaInspector("http://www.google.com");

    it("should not keep the same eventEmitter reference among clients", function (done) {
      var calledOnce = false;

      firstClient.fetch().then(function () {
        if (!calledOnce) {
          calledOnce = true;
        } else {
          throw new Error("I should not get called twice");
        }
      });
      secondClient.fetch().then(function () {
        should.exist(secondClient.parsedDocument);

        if (calledOnce) {
          done();
        }
      });
    });
  });

  describe("client", function () {
    var client = null;

    it("should have a url property", function (done) {
      client = new MetaInspector("http://www.google.com");

      client.url.should.equal("http://www.google.com/");
      done();
    });

    it("should add http as the default scheme if no scheme is passed", function (done) {
      client = new MetaInspector("www.google.com");

      client.url.should.equal("http://www.google.com/");
      done();
    });

    it("should have a scheme property", function (done) {
      client = new MetaInspector("http://www.google.com");

      client.scheme.should.equal("http");
      done();
    });

    it("should have a host property", function (done) {
      client = new MetaInspector("http://www.google.com");

      client.host.should.equal("www.google.com");
      done();
    });

    it("should have a rootUrl property", function (done) {
      client = new MetaInspector("http://www.google.com");

      client.rootUrl.should.equal("http://www.google.com");
      done();
    });

    it("should have a parsedDocument", function (done) {
      client = new MetaInspector("http://www.google.com");

      client.fetch().then(function () {
        should.exist(client.parsedDocument);

        done();
      });
    });

    it("should have a title", function (done) {
      client = new MetaInspector("http://www.google.com", {});

      client.fetch().then(function () {
        client.title.should.equal("Google");
        done();
      });

      client.fetch();
    });

    it("should have keywords", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.keywords.should.be
          .instanceof(Array)
          .and.be.eql(["HTML", "CSS", "XML", "JavaScript"])
          .and.have.lengthOf(4);
        done();
      });
    });

    it("keywords should be undefined if there is no keywords", function (done) {
      client = new MetaInspector("http://www.google.com", {});

      client.fetch().then(function () {
        client.keywords.should.be.instanceof(Array).and.be.eql([]);
        done();
      });
    });

    it("author should be undefined if there is no author", function (done) {
      client = new MetaInspector("http://www.google.com", {});

      client.fetch().then(function () {
        should.not.exist(client.author);

        done();
      });
    });

    it("charset should be undefined if there is no charset", function (done) {
      client = new MetaInspector("http://www.google.com", {});

      client.fetch().then(function () {
        should.not.exist(client.charset);

        done();
      });
    });

    it("should have author", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.author.should.be.equal("Author Name");

        done();
      });
    });

    it("should have charset", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.charset.should.be.equal("UTF-8");

        done();
      });
    });

    it("should have links returned as an array", function (done) {
      client = new MetaInspector("http://www.google.com", {});

      client.fetch().then(function () {
        client.links.length.should.equal(51);

        done();
      });
    });

    it("should have a description", function (done) {
      client = new MetaInspector("http://www.google.com", {});

      client.fetch().then(function () {
        client.description.should.equal(
          "Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for."
        );
        done();
      });
    });

    it("should have a og:image with relative path and return as absolute", function (done) {
      client = new MetaInspector("http://www.fastandfurious7-film.com");

      client.fetch().then(function () {
        client.image.should.equal(
          "http://www.fastandfurious7-film.com/images/fb.jpg"
        );

        done();
      });
    });

    it("should have a og:description", function (done) {
      client = new MetaInspector("http://www.fastandfurious7-film.com");

      client.fetch().then(function () {
        client.ogDescription.should.equal(
          "Continuing the global exploits in the unstoppable franchise built on speed, Vin Diesel, Paul Walker and Dwayne Johnson lead the returning cast of Fast & Furious 7."
        );
        done();
      });
    });

    it("should return undefined if the meta description is not defined when metaDescription used", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        should.not.exist(client.metaDescription);

        done();
      });
    });

    it("should find a secondary description if there is no description meta element", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.description.should.equal(
          "This is a new paragraph! This paragraph should be very long so we can grab it as the secondary description. What do you think of that?"
        );

        done();
      });
    });

    it("should find a the image based on the og:image tag if defined", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.image.should.equal("http://placehold.it/350x150");

        done();
      });
    });

    it.skip("should return an array of absolute image paths for all images on the page", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.images.should.be
          .instanceof(Array)
          .and.be.eql([
            "http://www.simple.com/clouds.jpg",
            "http://www.simple.com/image/relative.gif",
            "http://www.simple.com/image/relative2.gif",
            "http://placehold.it/350x150",
            "https://placehold.it/350x65",
            "//placehold.it/350x65",
          ]);

        done();
      });
    });

    it("should return an array of rss or atom feeds if defined", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.feeds.length.should.equal(2);
        done();
      });
    });

    it("should return the open graph title if defined", function (done) {
      client = new MetaInspector("http://www.simple.com", {});

      client.fetch().then(function () {
        client.ogTitle.should.equal("I am an Open Graph title");
        done();
      });
    });

    it("should emit errors", function (done) {
      client = new MetaInspector("http://www.google-404.com/", {});

      client.once("error", function (error) {
        should.exist(error);

        done();
      });
    });

    it("should return the open graph type, if defined", function (done) {
      client = new MetaInspector("http://www.techsuplex.com", {});

      client.fetch().then(function () {
        should.exist(client.ogType);
        client.ogType.should.equal("article");

        done();
      });
    });

    it("should return the last updated time, if defined", function (done) {
      client = new MetaInspector("http://www.techsuplex.com", {});

      client.fetch().then(function () {
        should.exist(client.ogUpdatedTime);
        client.ogUpdatedTime.should.equal("2013-10-31T09:29:46+00:00");

        done();
      });
    });

    it("should return the open graph locale, if defined", function (done) {
      client = new MetaInspector("http://www.techsuplex.com", {});

      client.fetch().then(function () {
        should.exist(client.ogLocale);
        client.ogLocale.should.equal("en_US");

        done();
      });
    });
  });
});
