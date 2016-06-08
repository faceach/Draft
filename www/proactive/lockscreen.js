var pageTransparentForLockscreen = (function() {
  var rgbaTransparent = 'rgba(0, 0, 0, 0)';
  var styleBody = window.getComputedStyle(document.body);
  var bgHtml = window.getComputedStyle(document.documentElement).getPropertyValue('background-color') || rgbaTransparent;
  var bgBody = styleBody.getPropertyValue('background-color') || rgbaTransparent;
  var opacityBody = styleBody.getPropertyValue('opacity') || 0;

  function getRGBA(rgb, alpha) {
    alpha = alpha > 1 ? (alpha / 100) : alpha;
    match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(rgb)
    return "rgba(" + [match[1], match[2], match[3], alpha].join(',') + ")";
  }

  function isTransparent(bg) {
    return bg === rgbaTransparent;
  }

  return {
    transparent: function(alpha) {
      alpha = alpha > 1 ? (alpha / 100) : alpha;
      if (!isTransparent(bgHtml)) {
        document.documentElement.style.backgroundColor = getRGBA(bgHtml, alpha);
      }
      if (!isTransparent(bgBody)) {
        document.body.style.backgroundColor = getRGBA(bgBody, alpha);
      }
      document.body.style.opacity = 0.99 * opacityBody;
      setTimeout(function() {
        document.body.style.opacity = alpha;
      }, 0);
    },
    recover: function() {
      if (!isTransparent(bgHtml)) {
        document.documentElement.style.backgroundColor = bgHtml;
      }
      if (!isTransparent(bgBody)) {
        document.body.style.backgroundColor = bgBody;
      }
      document.body.style.opacity = opacityBody;
    }
  };
})();
pageTransparentForLockscreen.transparent(.3);
pageTransparentForLockscreen.recover();