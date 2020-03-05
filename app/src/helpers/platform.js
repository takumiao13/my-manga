const isElectron = () => / (?:e|E)lectron\//.test(navigator.userAgent);

const isWxBrowser = () => /MicroMessenger/i.test(navigator.userAgent);

/**
* Detecting if your app is launched from the home screen
* {@see https://developers.google.com/web/fundamentals/app-install-banners/#preventing_the_mini-infobar_from_appearing}
*/
const isLaunchedFromHS = () => window.navigator.standalone === true
   || window.matchMedia('(display-mode: standalone)').matches;

export default {
  isElectron,
  isWxBrowser,
  isLaunchedFromHS,
}