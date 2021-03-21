// get a path module
const path = require('path')
// get a serverless http module
const serverless = require('serverless-http');
// get a html minifier to delete all whitespace
const minify = require('html-minifier').minify;

// main app module from serverless folder
const { app } = require("./dist/angryssr/serverless/main");

// serverless use AWS as Origin Request
const handle = serverless(app, {
    provider: 'aws',
    type: 'lambda-edge-origin-request'
});

// get requests from CloudFront
const handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;

// if request does'nt have an extension or it's a index.html call
    if ((!path.extname(request.uri)) || (request.uri === '/index.html')) {
        const response = await handle(event, context);
        let minified = minify(response.body, {
            caseSensitive: true,
            collapseWhitespace: true,
            preserveLineBreaks: true,
            removeAttributeQuotes: true,
            removeComments: true
        });
        console.log('response: ', response)
        callback(null, {
            status: response.status,
            statusDescription: response.statusDescription,
            headers: {
                ...response.headers,
            },
            body: minified,
            bodyEncoding: response.bodyEncoding
        });
    } else {
        // for other css, js, images call from S3 bucket
        console.log(`${request.uri} directly served from S3`)
        return request;
    }

}

exports.handler = handler;