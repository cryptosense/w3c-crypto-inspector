#Cryptosense Key Inspector
(C) Cryptosense 2014, see LICENSE.md

A very simple chromium extension that traces calls to the W3C WebCrypto API. Both keys and calls can be exported in JSON format.

Send feedback, bugs, comments, questions to webcrypto@cryptosense.com


##Absence from Chrome Web Store

We're releasing this little extension in source code only to find out
if it corresponds to the expectations of the community.  We will
submit this extension to the Chrome Web store by ourselves when it is
ready. Please don't do it yourself.

Versions for other browsers will follow as their implementations of
the API become available.

##Usage

To install, go to "chrome://extensions" and choose
"Load unpacked extension...", then select the extension directory.

The extension will run on each page you visit. You can see the current
keys by clicking the extension icon. A green key icon indicates a key
using a secure algorithm (in the sense of "secure for future use" at
http://cryptosense.com/choice-of-algorithms-in-the-w3c-crypto-api/ ),
an orange key means an algorithm secure for the moment but not
approved for future use, and a red keys means an algorithm considered
insecure. Attention - this does not mean that the key value itself is
secure, or that the applications use of the algroithm is secure,
etc. etc.

You can download the JSON of current keys or the JSON of all function
calls by clicking the corresponding button.

##Extra notes and issues

This extension adds some data in the key to allow them to be more
easily identified (ID, usage and creation date).

It is possible that the overwrite of the standard W3C webcrypto API
functions breaks the promise mechanism somewhat.

Occasionally, if a script calls generate key immediately this
executes before the function has been redefined so it escapes tracing.

When viewing keys, the popup doesn't resize itself when extending a
node and reducing it afterwards. If you know how to do this, tell us,
or submit a patch!

##How it works

* popup.js : The page displayed when clicking the extension icon, it
manages the displaying and downloading of the differents required
datas.

* contentscript.js : Code that runs with each page but not in the same
environment.  It injects hooker.js on each page and receives the
messages from the popup.

* hooker.js : The code that polyfills the standard W3C WebCrypto API
functions.
