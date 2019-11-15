
export const byId = document.getElementById.bind(document);

export const getScrollTop = (elem) => {
  return elem ? elem.scrollTop : 
        window.pageYOffset || 
        document.documentElement.scrollTop || 
        document.body.scrollTop;
}

export const getScrollHeight = (elem) => {
  return elem ? elem.scrollHeight : Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
}

export const getOffsetHeight = (elem) => {
  return elem ? elem.clientHeight : window.innerHeight;
}

