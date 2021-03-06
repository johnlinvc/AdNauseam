/*******************************************************************************

    AdNauseam - Fight back against advertising surveillance.
    Copyright (C) 2014-2016 Daniel C. Howe

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/dhowe/AdNauseam
*/

/* global vAPI, uDom */

/******************************************************************************/

(function () {

  'use strict';

  /******************************************************************************/

  var messager = vAPI.messaging;
  var dntRespectAppeared = false;

  /******************************************************************************/
  var changeUserSettings = function (name, value) {

    //console.log("changing", name, value);

    messager.send('dashboard', {
      what: 'userSettings',
      name: name,
      value: value
    });
  };

  var onInputChanged = function (ev) {

    var input = ev.target;
    var name = this.getAttribute('data-setting-name');
    var value = input.value;
    if (value !== input.value) {
      input.value = value;
    }
    changeUserSettings(name, value);
  };

  function switchValue(name) {

    return uDom('[data-setting-name=' + name + ']').prop('checked');
  }

  function hideOrClick() {

    return switchValue('hidingAds') || switchValue('clickingAds');
  }

  function hasEnabledToggle() {
    return switchValue('hidingAds') || switchValue('clickingAds') || switchValue('blockingMalware');
  }

  function toggleNum(){
    var toggleNum = 0;
    if(switchValue('hidingAds')) toggleNum++;
    if(switchValue('clickingAds')) toggleNum++;
    if(switchValue('blockingMalware')) toggleNum++;

    return toggleNum;
  }

  function changeDNTexceptions(bool) {

    changeUserSettings("disableClickingForDNT", bool);
    changeUserSettings("disableHidingForDNT", bool);
  }

  function toggleDNTException(bool) {

    var dntInput = uDom('#dnt-exception');

    if (hideOrClick() && !dntRespectAppeared) { // runs once only

      changeDNTexceptions(true);
      dntInput.prop('checked', true);
      dntRespectAppeared = true;
    }

    dntInput.parent().css('opacity', hideOrClick() ? '1' : '0');
  }

  function toggleFirstRunButton() {
    var button = uDom('#confirm-close > button');

    if (hasEnabledToggle()) {
      //remove class "disable"
      button.removeClass("disabled");
    }
    else {
      //add class disable
      button.addClass("disabled");
    }

    //change text according to toggle Numbers
    switch(toggleNum()) {
    case 0:
        button.removeClass("toggled1");
        button.removeClass("large");

        button.addClass("toggled0");
        break;
    case 1:
        button.attr("data-i18n", "adnFirstRunThatsIt");
        button.removeClass("toggled0");

        button.removeClass("toggled2");
        button.addClass("large");
        button.addClass("toggled1");
        break;
    case 2:
        button.attr("data-i18n", "adnFirstRunBetterButStill");
        button.removeClass("toggled1");
        button.removeClass("toggled3");
        button.addClass("toggled2");
        break;
    case 3:
        button.attr("data-i18n", "adnFirstRunLetsGo");
        button.removeClass("toggled2");
        button.addClass("toggled3");
        break;

    }
    //reload the text
    vAPI.i18n.render();

  }

  /******************************************************************************/

  // TODO: use data-* to declare simple settings
  var onUserSettingsReceived = function (details) {

    uDom('[data-setting-type="bool"]').forEach(function (uNode) {

      uNode.prop('checked', details[uNode.attr('data-setting-name')] === true)
        .on('change', function () {

            if (this.getAttribute('data-setting-name') === "respectDNT") {
              changeDNTexceptions(this.checked);
            } else {
              changeUserSettings(
                this.getAttribute('data-setting-name'),
                this.checked
              );
            }

            if (!hideOrClick()) {
              changeDNTexceptions(false);
            }

            toggleFirstRunButton();
            toggleDNTException();

        });
    });

    uDom('[data-setting-type="input"]').forEach(function (uNode) {
      uNode.val(details[uNode.attr('data-setting-name')])
        .on('change', onInputChanged);
    });

    uDom(document).on('click', '#To3pfilter', function() {
        openPage('/dashboard.html#3p-filters.html');
    });

    uDom(document).on('click', '#ToOptions',function (e) {
       openPage('/dashboard.html#options.html');
    });

    uDom('#confirm-close').on('click', function (e) {
      if (hasEnabledToggle()) {
        e.preventDefault();
        // handles #371
        window.open(location, '_self').close();
      }
    });

    uDom('#app-version').text(details.appVersion);

    toggleDNTException();
  };
  /******************************************************************************/

  uDom.onLoad(function () {

    messager.send('dashboard', {
      what: 'userSettings'
    }, onUserSettingsReceived);

    messager.send('adnauseam', {
      what: 'verifyAdBlockers' },
        function() {
          vAPI.messaging.send(
              'adnauseam', {
                  what: 'getNotifications'
              },
              function(n) {
                  renderNotifications(n, "firstrun");
              });
        });
  });

  /******************************************************************************/

})();
