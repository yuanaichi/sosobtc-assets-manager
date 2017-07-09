var getEnabledState = function() {
    return localStorage.getItem("_sosoAssetEnabled") == "true";
};

var setIconBadge = function(sosoAssetEnabled) {
  if (sosoAssetEnabled) {
    chrome.browserAction.setBadgeBackgroundColor({color: '#00ff00'});
    chrome.browserAction.setBadgeText({text: 'on'});
  } else {
    chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
    chrome.browserAction.setBadgeText({text: 'off'});
  }
};

setIconBadge(getEnabledState());

chrome.browserAction.onClicked.addListener(function(tab) {
  newState = !getEnabledState();
  localStorage.setItem("_sosoAssetEnabled", newState);
  setIconBadge(newState);

  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.executeScript(tab.id, {code: 'window.location.reload();'});
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getState") {
      sendResponse({status: getEnabledState()});
    }
});
