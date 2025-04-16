document.addEventListener("DOMContentLoaded", () => {
  let isSubmitting = false;

  const sendToGoogleSheet = async (type) => {
    try {
      const deviceId =
        document.getElementById("deviceId")?.value ||
        Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      let referrer = document.referrer;
      if (navigator.userAgent.includes("Snapchat")) {
        referrer = "https://snapchat.com";
      }

      const ipResponse = await fetch("https://ipinfo.io/json");
      const locationData = await ipResponse.json();

      const data = {
        type: type,
        username: window.username || "luc4.aq",
        deviceId: deviceId,
        gameSlug: window.gameSlug || "",
        referrer: referrer,
        ip: locationData.ip,
        userAgent: navigator.userAgent,
        language: navigator.language,
        location: locationData,
        requestTime: Math.floor(Date.now() / 1000),
      };

      if (type === "message") {
        data.question = document.getElementById("question")?.value.trim() || "";
      }

      await fetch(
        "https://script.google.com/macros/s/AKfycbzzHeemACD9VaJlDO_LlF0x7W-ZQi5qrDfoa2-eaM9gvzvsW7HpeG7H-dwjdBxw1irmrQ/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          mode: "no-cors",
        }
      );
    } catch (error) {
      console.error("Error sending data to Google Sheet:", error);
    }
  };

  sendToGoogleSheet("visit");

  const form = document.querySelector("form.form");
  if (form) {
    if (!document.getElementById("deviceId")) {
      const deviceIdInput = document.createElement("input");
      deviceIdInput.type = "hidden";
      deviceIdInput.id = "deviceId";
      deviceIdInput.name = "deviceId";
      form.appendChild(deviceIdInput);
    }

    if (!document.getElementById("deviceId").value) {
      document.getElementById("deviceId").value =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      isSubmitting = true;

      const submitButton = document.querySelector("button.submit");
      const originalButtonText = submitButton.innerText;
      submitButton.innerText = "Sending...";
      submitButton.disabled = true;

      const question = document.getElementById("question").value.trim();
      if (!question) {
        alert("Please enter a question first!");
        submitButton.innerText = originalButtonText;
        submitButton.disabled = false;
        isSubmitting = false;
        return;
      }

      try {
        const deviceId = document.getElementById("deviceId").value;
        const userRegion = $("#userRegion").val();
        if (userRegion === "US") {
          mixpanel.track("web_tapped_send");
        }

        await sendToGoogleSheet("message");

        window.localStorage.setItem(
          "userData",
          JSON.stringify({
            questionId: "generated_" + Math.random().toString(36).substring(2),
            priorityInboxEnabled: false,
            paymentAvailable: false,
            ig_pfp_url: "",
            ig_username: "",
            region: "US",
          })
        );

        document.getElementById("question").value = "";
        window.location.href = "sent.html";
      } catch (error) {
        submitButton.innerText = originalButtonText;
        submitButton.disabled = false;
        isSubmitting = false;
      }
    });
  }
});

$(document).ready(function () {
  let paymentAvailable = false;
  let userData = JSON.parse(window.localStorage.getItem("userData"));
  const userRegion = $("#userRegion").val();
  mixpanel.init("e8e1a30fe6d7dacfa1353b45d6093a00");

  if (userData?.region === "US" || userRegion === "US") {
    mixpanel.track_links(".rizz-button", "web_sent_tapped_new_app");
    mixpanel.track_links(".download-link1", "web_tapped_get_your_own");
    mixpanel.track_links(".download-link2", "web_sent_tapped_get_your_own");
    mixpanel.track_links(".another1", "web_sent_tapped_send_another_message");
  }

  const downloadButtonText = $(".download-link").text();
  const downloadButtonText2 = $(".download-link2").text();
  if (uid) {
    mixpanel.track_links(".download-link1", "web_received_download", {
      distinct_id: uid,
      page: "user",
      copy: downloadButtonText,
    });
    mixpanel.track_links(".download-link2", "web_received_download", {
      distinct_id: uid,
      page: "sent",
      copy: downloadButtonText2,
    });
  }

  $(".download-link").click(() => {
    console.log("Download link clicked");
  });

  const stripe = Stripe(
    "pk_live_51KwBgeDayQIxBLDTG6X0rPdazndS0eXsXGLzJExz4TA9TmUMUUfXYflI17I7sE1ZRiE8t9YClg9cUZFRiDYOM36r00oOijCjA4",
    { apiVersion: "2020-08-27" }
  );

  const paymentRequest = stripe.paymentRequest({
    country: "US",
    currency: "usd",
    total: {
      label: "Boost Message",
      amount: 99,
    },
    requestPayerName: true,
    requestPayerEmail: true,
  });

  paymentRequest.canMakePayment().then((result) => {
    if (result?.applePay) {
      paymentAvailable = "applePay";
    } else if (result?.googlePay) {
      paymentAvailable = "googlePay";
    } else if (result?.link) {
      paymentAvailable = "link";
    }
  });

  paymentRequest.on("paymentmethod", async (ev) => {
    ev.complete("fail");
    alert("Your payment method failed. Try again or skip.");
  });

  function isBoostedUI() {
    $(".boost").addClass("button-translucent");
    $(".boost").removeClass("button-white");
    $(".boost").removeClass("pulse");
    $(".boost").text(window.translations.boosted);
    $(".boost").off("click");
  }

  if (window.location.pathname.includes("p/sent")) {
    $(".modal-container").hide();
    $(".pfp").attr("src", userData?.ig_pfp_url);
    if (userData?.isBoosted && false) isBoostedUI();
    if (userData?.priorityInboxEnabled && userData?.paymentAvailable && false) {
      $(".boost").show();
      $(".boost").addClass("pulse");
    } else {
      $(".boost").hide();
      $(".download-link").addClass("pulse");
    }

    $(".boost").click(() => {
      $(".modal-container").show();
      $(".modal-container").removeClass("off");
    });
    $(".modal-bg, .priority-x").click(() => {
      $(".modal-container").addClass("off");
      setTimeout(() => {
        $(".modal-container").hide();
      }, 300);
    });
    $(".pay").click(async () => {
      alert("Please try again in a few seconds.");
    });
  } else {
    window.localStorage.removeItem("userData");
  }

  window.addEventListener("pageshow", function (event) {
    var historyTraversal =
      event.persisted ||
      (typeof window.performance != "undefined" &&
        window.performance.navigation.type === 2);
    if (historyTraversal) {
      $(".submit").attr("disabled", false);
      $("textarea").val("");
      $(".bottom-container").show();
      $(".priority-modal").hide();
      if (!/android/i.test(userAgent)) {
        $(".submit").hide();
      }
    }
  });

  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const referrer = document.referrer;

  if (/android/i.test(userAgent)) {
    $(".download-link").attr(
      "href",
      "https://play.google.com/store/apps/details?id=com.nglreactnative"
    );
    $(".rizz-button").attr(
      "href",
      "https://play.google.com/store/apps/details?id=com.rizz.android"
    );
  } else {
    $(".rizz-button").css("display", "flex");
  }

  $("textarea").focus(function () {
    $(".bottom-container").hide();
  });

  $("textarea").blur(function () {
    $(".bottom-container").show();
  });

  $("textarea").on("input", function (e) {
    if (e.target.value == "" && !/android/i.test(userAgent)) {
      $(".submit").hide();
    } else {
      $(".submit").show();
    }
  });

  if (!/android/i.test(userAgent)) {
    $(".submit").hide();
  }

  const APP_CDN_BASE_URL =
    "https://cdn.simplelocalize.io/d6cb2f56863b434c8fba40f9404505f9/_latest/";
  const userLanguage = $("meta[name='user:language']").attr("content") || "en";
  let randomQuestions = [];

  $.get(APP_CDN_BASE_URL + userLanguage, function (data) {
    const fakeQuestionKeys = Object.keys(data).filter((key) =>
      key.startsWith("default.")
    );
    randomQuestions = fakeQuestionKeys.map((key) => data[key]);
  });

  $(".dice-button").click(function (e) {
    const randomQuestion =
      randomQuestions[Math.floor(Math.random() * randomQuestions.length)];
    $("textarea").val(randomQuestion + " ");
    $("textarea").focus();
    $("textarea")[0].selectionStart = randomQuestion.length + 1;
    $("textarea")[0].selectionEnd = randomQuestion.length + 1;
    $(".submit").show();
    e.preventDefault();
  });

  if (!window.localStorage.getItem("deviceId")) {
    function uuidv4() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );
    }
    window.localStorage.setItem("deviceId", uuidv4());
  }

  $(".deviceId").val(window.localStorage.getItem("deviceId"));

  setInterval(() => {
    let clickCount = parseInt($(".clickCount").text());
    clickCount += Math.floor(Math.random() * 5) - 1;
    $(".clickCount").text(clickCount);
  }, 800);

  if (!window.location.pathname.includes("p/sent")) {
    if (userRegion === "US") {
      mixpanel.track("web_received_pageview", {
        distinct_id: uid,
        referrer: window.document.referrer,
      });
      mixpanel.track("web_viewed_page");
    }
  }
});
