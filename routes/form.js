var DOCX_CONTENT_TYPE = require('docx-content-type')
var annotate = require('../util/annotate')
var docx = require('commonform-docx')
var get = require('simple-get')
var internalError = require('./internal-error')
var loadComponents = require('commonform-load-components')
var methodNotAllowed = require('./method-not-allowed')
var outlineNumbering = require('outline-numbering')
var runAuto = require('run-auto')
var sanitize = require('../util/sanitize')

var footer = require('./partials/footer')
var form = require('./partials/form')
var html = require('./html')
var preamble = require('./partials/preamble')
var publicationLink = require('./partials/publication-link')

// TODO: Comment UI

module.exports = function (configuration, request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed.apply(null, arguments)
  }
  var digest = sanitize(request.params.digest)
  runAuto({
    form: function (done) {
      get.concat({
        url: configuration.api + '/forms/' + digest,
        json: true
      }, function (error, response, form) {
        done(error, form)
      })
    },
    loaded: ['form', function (data, done) {
      loadComponents(data.form, {}, function (error, form, resolutions) {
        if (error) return done(error)
        done(null, {form, resolutions})
      })
    }],
    publications: function (done) {
      get.concat({
        url: configuration.api + '/forms/' + digest + '/publications',
        json: true
      }, function (error, response, data) {
        done(error, data)
      })
    },
    comments: function (done) {
      get.concat({
        url: (
          configuration.api +
          '/annotations?context=' + digest
        ),
        json: true
      }, function (error, response, data) {
        done(error, data)
      })
    }
  }, function (error, data) {
    if (error) {
      return internalError(configuration, request, response, error)
    }
    if (request.query.format === 'docx') {
      let options = {
        digest: digest,
        markFilled: true,
        numbering: outlineNumbering
      }
      response.setHeader('Content-Type', DOCX_CONTENT_TYPE)
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${digest}.docx"`
      )
      response.end(
        docx(data.loaded.form, [], options).generate({type: 'nodebuffer'})
      )
      return
    }
    response.setHeader('Content-Type', 'text/html; charset=UTF-8')
    var options = {
      comments: data.comments,
      annotations: annotate(data.loaded.form)
    }
    var docxHREF = (
      '/forms/' + encodeURIComponent(digest) +
      '?format=docx'
    )
    response.end(html`
    ${preamble()}
<header>
  <a href=/>${escape(configuration.domain)}</a> /
  <span class=digest>${digest}</span>
</header>
<main>
  <header>
    <a href="${docxHREF}">Download .docx</a>
    <a href=/edit?from=${digest}>Edit</a>
  </header>
  <header>
    ${publicationsSection(data.publications)}
    ${publishedWithinSection(data.publications)}
  </header>
  ${form(data.form, data.loaded, options)}
</main>
${footer()}
    `)
  })
}

function publicationsSection (publications) {
  var roots = publications.filter(function (publication) {
    return publication.root
  })
  if (roots.length === 0) return ''
  return html`
    <section class=publications>
    <p>This form has been published as:</p>
    <ul>${roots.map(publicationLI)}</ul>
    </section>
  `
}

function publishedWithinSection (publications) {
  var notRoots = publications.filter(function (publication) {
    return !publication.root
  })
  if (notRoots.length === 0) return ''
  return html`
    <section class=publications>
    <p>This form has been published as part of:</p>
    <ul>${notRoots.map(publicationLI)}</ul>
    </section>
  `
}

function publicationLI (publication) {
  return `<li>${publicationLink(publication)}</li>`
}
