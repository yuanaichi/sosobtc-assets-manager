
function numberToCurrency(number, options) {
    // set defaults...
    if (typeof options == 'undefined') { options = {}; }
    var precision = options.precision || 2
    var unit      = options.unit      || '$'
    var separator = options.separator || '.'
    var delimiter = options.delimiter || ','
    var format    = options.format    || '%u%n'
    var negativeFormat = options.negativeFormat || '-%u%n'

    // "clean up" number
    if (typeof number == 'string') { number = number.replace(/\$/g, ''); } // strip dollar sign
    number = isNaN(number) || number == '' || number == null ? 0.0 : number; // set to 0.0 if we can't tell what it is

    // determine which format to use
    if (number < 0) {
        format = negativeFormat;
        number = Math.abs(number); // "remove" the negative sign
    }

    // 'separate' the cents
    var numberStr = parseFloat(number).toFixed(precision).toString();
    var numberFormatted = new Array(numberStr.slice(-1*precision));   // this returns the cents
    numberFormatted.unshift(separator); // add the separator
    numberStr = numberStr.substring(0, numberStr.length-(precision+1)); // this removes the decimal and cents

    // 'delimit' the thousands
    while (numberStr.length > 3) {
        numberFormatted.unshift(numberStr.slice(-3)); // this prepends the last three digits to `numberFormatted`
        numberFormatted.unshift(delimiter); // this prepends the delimiter to `numberFormatted`
        numberStr = numberStr.substring(0, numberStr.length-3);  // this removes the last three digits
    }
    numberFormatted.unshift(numberStr); // there are less than three digits in numberStr, so prepend them

    return format.replace(/%u/g,unit).replace(/%n/g,numberFormatted.join('')); // put it all together
}
var currencyUnit = '￥';
var priceFormat = function(number) {
  return numberToCurrency(number, {unit: currencyUnit + ' '});
};

$('#default_market_tabs-pane-custom > .bottom .currency_item').click(function() {
  if ($(this).text() == 'USD') {
    currencyUnit = '$';
  } else {
    currencyUnit = '￥';
  }
});

var storagePrefix = "_assets_";
var saveAssetNumber = function(assetId, number) {
  localStorage[storagePrefix + assetId] = number;
};

var getAssetNumber = function(assetId) {
  return localStorage.getItem(storagePrefix + assetId) || 0;
};

var enableAssetsManager = function() {
  $(function() {
    $('#default_market_tabs-pane-custom > table').addClass('with-assets');
    $('#default_market_tabs-pane-custom > table > thead > tr').append('<th>数量</th><th>总金额</th>');
    $('#default_market_tabs-pane-custom > .bottom').append('<span class="item">总金额：<span id="asset-total-amount">0</span></span>');

    $('#default_market_tabs-pane-custom > table > tbody > tr').each(function(item) {
      var assetId = $(this).find(".market_name").text();
      var assetNumber = getAssetNumber(assetId);
      $(this).append('<td class="number-td"><input type="number" class="number" name="number" value="' + assetNumber + '"/></td><td class="total-amount" data-amount="0"></td>');
      $(this).find(".number").click(function(e) {
        e.stopPropagation();
        return false;
      }).on('focus', function() {
        $(this).select();
      }).on('blur', function() {
        var assetId = $(this).parents("tr").find(".market_name").text();
        var number = $(this).val();
        console.log(assetId + " save number:", number);
        saveAssetNumber(assetId, number);
        calcRowTotalAmount($(this).parents('tr'));
        calcAssetTotalAmount();
      });
      calcRowTotalAmount($(this));
    });
    calcAssetTotalAmount();
  });
};

var calcRowTotalAmount = function(row) {
  var price = parseFloat(row.find(".latest .main").text());
  var assetId = row.find(".market_name").text();
  var number = row.find(".number").val();
  var priceSplits = (price + "").split(".")
  var decimalLength = priceSplits[1] ? priceSplits[1].length : 2;
  var totalAmount = (number * price).toFixed(decimalLength);
  row.find(".total-amount").text(priceFormat(totalAmount)).attr("data-amount", totalAmount);
};

var calcAssetTotalAmount = function() {
  var total = 0;
  $('#default_market_tabs-pane-custom > table > tbody > tr').each(function(item) {
    total += parseFloat($(this).find(".total-amount").attr("data-amount"));
  });

  $('#asset-total-amount').text(priceFormat(total.toFixed(2)));
};

chrome.runtime.sendMessage({method: "getState"}, function(response) {
  sosoAssetEnabled = response.status;
  if (sosoAssetEnabled) {
    //enable assets manager
    enableAssetsManager();

    $(function() {
      $('body').addClass('asset-manger');
      $(document).on('DOMNodeInserted', '#default_market_tabs-pane-custom', function(e) {
        console.log(e);
        if (e.target == $('#default_market_tabs-pane-custom')[0]) {
          enableAssetsManager();
        }
      });

      $(document).on('DOMCharacterDataModified', '#default_market_tabs-pane-custom .latest .main', function(e) {
        console.log(e, e.target);
        calcRowTotalAmount($(this).parents('tr'));
        calcAssetTotalAmount();
      });
    });

  }
});
