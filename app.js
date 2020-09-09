"use strict";

function getErrorText(url) {
  const printableURL = encodeURI(url);

  if (url.startsWith("http")) {
    return `
    Could not fetch from URL <em><a href="${printableURL}">${printableURL}</a></em>.<br>
    Your issue could be one of the following:
    <ul>
        <li>The URL does not exist.
        <li>The URL does not support <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS">Cross-Origin Resource Sharing (CORS)</a>,
            when it should send a response header like <code>Access-Control-Allow-Origin: *</code>
    </ul>
    Please see your <a href="https://developer.mozilla.org/en-US/docs/Tools">Browser Developer Tools</a> for additional details.
    `;
  }
  return `Could not fetch from <em>${printableURL}</em>, which doesn't look like a valid URL.`;
}

function resetInterface() {
  console.log(
    "Please ignore SRI warnings above this line, as they are part of the SRI support check (badge at the bottom of the page)."
  );
  document.getElementById("sriSnippet").innerText = "";
  document.getElementById("sriError").innerText = "";
  document.getElementById("sriSnippet").classList.remove('is-active');
  document.getElementById("sriCopyClipboard").classList.remove('is-active');
  document.getElementById("sriCopyClipboardButton").disable = true;
  document.getElementById("sriURLCopied").classList.remove('is-active', 'success', 'fail');
}

async function hashText(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash384 = await crypto.subtle.digest("SHA-384", data);

  return hash384;
}

async function formSubmit(event) {
  event.preventDefault();
  resetInterface();
  const inputEl = document.getElementById("url");
  const url = inputEl.value;
  const resultDiv = document.getElementById("sriSnippet");
  const copyDiv = document.getElementById("sriCopyClipboard");
  const errorDiv = document.getElementById("sriError");

  console.info("Trying", url);
  try {
    const response = await fetch(url);

    console.info("Response", response);
    if (response.status === 200) {
      const text = await response.text();
      const hashBuffer = await hashText(text); // Array Buffer
      const base64string = btoa(
        String.fromCharCode(...new Uint8Array(hashBuffer))
      );
      const integrityMetadata = `sha384-${base64string}`;
      const scriptEl = `<span style="color: #ffa07a">&lt;script src=</span><span style="color:#abe338">&quot;${encodeURI(
        url
      )}&quot;</span> <span style="color: #ffa07a">integrity=</span><span style="color:#abe338">&quot;${integrityMetadata}&quot;</span> <span style="color: #ffa07a">crossorigin=</span><span style="color:#abe338">&quot;anonymous&quot;</span><span style="color: #ffa07a">&gt;&lt;/script&gt;</span>`;

      resultDiv.classList.add("is-active");
      resultDiv.innerHTML = scriptEl;
      copyDiv.classList.add("is-active");
      document.getElementById("sriCopyClipboardButton").disable = false;
    } else {
      console.error("Non-OK HTTP response status. Error.");
      errorDiv.innerHTML = getErrorText(url);
    }
  } catch (e) {
    console.error("Fetch Error: ", e);
    errorDiv.innerHTML = getErrorText(url);
  }
}

function copyToClipboardSuccess() {
  const statusElem = document.getElementById("sriURLCopied");

  statusElem.innerText = "snippet copied!";
  statusElem.classList.remove("fail");
  statusElem.classList.add("is-active", "success");
}

function copyToClipboardFail(cause) {
  const statusElem = document.getElementById("sriURLCopied");

  if (!cause) {
    cause = "unknown error";
  }
  const msg = `copy failed: ${cause}`;

  console.error(msg);
  statusElem.innerText = msg;
  statusElem.classList.remove("success");
  statusElem.classList.add("is-active", "fail");
}

async function copyToClipboard() {
  const resultDiv = document.getElementById("sriSnippet");
  const snippet = resultDiv.innerText;

  if (!window.navigator.clipboard) {
    copyToClipboardFail("could not access clipboard");
    return;
  }
  try {
    await window.navigator.clipboard.writeText(snippet);
    return copyToClipboardSuccess();
  } catch (e) {
    return copyToClipboardFail();
  }
}

addEventListener("DOMContentLoaded", () => {
  document.getElementById("sriForm").addEventListener("submit", formSubmit);
  document.getElementById("sriCopyClipboardButton").addEventListener("click", copyToClipboard);
});
