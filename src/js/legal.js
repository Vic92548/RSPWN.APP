// Legal pages helpers: open/close Terms and Privacy within SPA
(function(){
  function safeNavigate(path){
    if (window.router && typeof window.router.navigate === 'function') {
      window.router.navigate(path, true);
    } else {
      window.location.href = path;
    }
  }

  window.openTermsPage = function(){
    if (typeof hideMenu === 'function') hideMenu();
    safeNavigate('/terms');
  };

  window.openPrivacyPage = function(){
    if (typeof hideMenu === 'function') hideMenu();
    safeNavigate('/privacy');
  };

  window.closeTermsCard = function(){
    if (window.cardManager) cardManager.hide('terms-card');
    safeNavigate('/');
  };

  window.closePrivacyCard = function(){
    if (window.cardManager) cardManager.hide('privacy-card');
    safeNavigate('/');
  };
})();
