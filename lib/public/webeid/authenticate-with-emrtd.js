/*
 * Copyright (c) 2020 The Web eID Project
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {
  authenticateWithEmrtd,
  config,
} from "/lib/es/web-eid.js";

import httpErrorHandler from "../utils/httpErrorHandler.js";

function init() {
  const $options = document.querySelector(".authenticate-with-emrtd.options");

  const ui = {
    authButton: document.querySelector("[name='authenticateWithEmrtdButton']"),
    result:     document.querySelector("[name='authWithEmrtdResult']"),

    authChallenge: {
      url:     $options.querySelector("[name='getAuthWithEmrtdChallengeUrl']"),
      headers: $options.querySelector("[name='getAuthWithEmrtdChallengeHeaders']"),
    },

    authToken: {
      url:     $options.querySelector("[name='postAuthWithEmrtdTokenUrl']"),
      headers: $options.querySelector("[name='postAuthWithEmrtdTokenHeaders']"),
    },

    userInteractionTimeout: $options.querySelector("[name='authWithEmrtdUserInteractionTimeout']"),
    authLanguage:           $options.querySelector("[name='authWithEmrtdLanguage']"),
  }

  console.log(ui.result)
  console.log(ui.authChallenge.url)

  ui.authChallenge.url.value            = window.location.origin + "/auth-with-emrtd/challenge";
  ui.authChallenge.headers.placeholder  = "{ }";
  ui.authChallenge.headers.value        = '{ "X-Nonce-Length": "44" }';
  ui.authToken.url.value                = window.location.origin + "/auth-with-emrtd/token";
  ui.authToken.headers.placeholder      = "{ }";
  ui.authToken.headers.value            = '{ "Content-Type": "application/json" }';
  ui.userInteractionTimeout.placeholder = config.DEFAULT_USER_INTERACTION_TIMEOUT;
  ui.result.value                       = "";

  ui.authButton.addEventListener("click", async () => {
    const userInteractionTimeout  = ui.userInteractionTimeout.value;
    const lang                    = ui.authLanguage.value;

    ui.result.value = "";
    ui.authButton.disabled = true;

    try {
      const challengeResponse = await fetch(ui.authChallenge.url.value, {
        method:  "GET",
        headers: JSON.parse(ui.authChallenge.headers.value || "{}"),
      });

      await httpErrorHandler(challengeResponse);

      const { challengeNonce } = await challengeResponse.json();

      const authToken = await authenticateWithEmrtd(challengeNonce, { lang, userInteractionTimeout });

      const authTokenResponse = await fetch(ui.authToken.url.value, {
        method:  "POST",
        headers: JSON.parse(ui.authToken.headers.value || "{}"),
        body:    JSON.stringify(authToken),
      });

      await httpErrorHandler(authTokenResponse);

      const authTokenResult = await authTokenResponse.json();

      ui.result.value = (
        "Authentication successful!" +
        "\n\n[response]\n" +
        JSON.stringify(authTokenResult, null, "  ")
      );

    } catch (error) {
      ui.result.value = (
        "Authentication failed!" +
        `\n\n[Code]\n${error.code}` +
        `\n\n[Message]\n${error.message}` +
        (
          (error.response)
            ? `\n\n[response]\n${JSON.stringify(error.response, null, "  ")}`
            : ""
        )
      );

      console.error(error)

      throw error;

    } finally {
      ui.authButton.disabled = false;
    }

  });
}

document.addEventListener("DOMContentLoaded", init);
