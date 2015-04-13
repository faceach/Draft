var mwc = mwc || {};
mwc.productionDomain = 'www.hcmwc2015.com';
mwc.trackingSettings = {
  debugMode: location.href.indexOf(mwc.productionDomain) > -1 ? false : true,
  pageviewPrefix: '/camp/en/mwc2015',
  trackers: [
    {
      name: 'gau',
      options: {
        init: function () {
          ga('create', 'UA-7728030-4', {
            cookieDomain: 'auto',
			siteSpeedSampleRate: 90
          });
        }
      }
    },
    {
      name: 'ha',
      options: {
        siteId: 'huaweimwc',
        domain: mwc.productionDomain,
        autoSendPV: false
      }
    }
  ]
};
