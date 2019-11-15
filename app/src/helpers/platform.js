
const isElectron = () => {
  return / (?:e|E)lectron\//.test(navigator.userAgent);
}

export default {
  isElectron
}