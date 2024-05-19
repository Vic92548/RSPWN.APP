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

!(function(e,t){const a="featurebase-sdk";function n(){if(!t.getElementById(a)){var e=t.createElement("script");(e.id=a),(e.src="https://do.featurebase.app/js/sdk.js"),t.getElementsByTagName("script")[0].parentNode.insertBefore(e,t.getElementsByTagName("script")[0])}}"function"!=typeof e.Featurebase&&(e.Featurebase=function(){(e.Featurebase.q=e.Featurebase.q||[]).push(arguments)}),"complete"===t.readyState||"interactive"===t.readyState?n():t.addEventListener("DOMContentLoaded",n)})(window,document);

