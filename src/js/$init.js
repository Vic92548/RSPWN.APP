window.analytics = {};
function juneify(writeKey) {
    window.analytics._writeKey = writeKey;
    var script = document.createElement("script");
    script.type = "application/javascript";
    script.onload = function () {
        window.analytics.page();
    };
    script.src = "https://unpkg.com/@june-so/analytics-next/dist/umd/standalone.js";
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(script, first);
}
juneify("4MLzqgiiNqYz3VVt");