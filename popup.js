//Cryptosense Key Inspector (C) Cryptosense 2014

// The popup window for displaying the current keys

// Algorithms deprecated even for legacy use
var deprecated_legacy = ["RSAES-PKCS1-v1_5"]
// Algorithms deprecated for future applications.
var deprecated_future = ["RSASSA-PKCS1-v1_5","ECDSA","AES-KW"]

var keyFct = ["encrypt","decrypt","sign","verify",
              "deriveKey","deriveBits","exportKey","wrapKey", "unwrapKey"]


// Html format one key
function get_formated_key(elem) {
   var key = document.createElement("div");
    key.className = "key";

    // The key icon
    var img;
    if (deprecated_legacy.indexOf(elem.algorithm.name) != -1)
        img = "key-red.png";
    else if (deprecated_future.indexOf(elem.algorithm.name) != -1)
        img = "key-orange.png";
    else
        img = "key-green.png";

    // Extractable information
    var extractable = ", not extractable."
    if (elem.extractable) {
        extractable = ", extractable.";
    }

    // Usages information
    var usage = '<p>Usages :';
    elem.usages.forEach(
        function (e) {
            usage += ' ' + e;
        }
    );
    if (usage == '<p>Usages :')
        usage += " none"

    // Length
    var length;
    if (elem.algorithm.length != null)
        length = elem.algorithm.length;
    else
        length = elem.algorithm.modulusLength;

    // Hash information
    var h = "";
    if (elem.algorithm.hash != null)
        hash = '<p> Hash name : '+ elem.algorithm.hash.name + '.</p>';
    else
        hash = "";
    var keyContent =
        '<p class ="keyTitle"> <img src= "' + img + '" class="key-image"> ' +
        '<span class="algorithm"> ' + elem.algorithm.name + '</span> ' +
        elem.creationDate + '</p>' + '<span class="keyContent">' +
        '<p>Type : ' + elem.type + ', length : ' + length +
        extractable + '</p>' + hash + usage + '</span>';
    key.innerHTML = keyContent;

    // The used information.
    var used = document.createElement("span");
    var usedTitle = document.createElement("p");
    var usedContent = document.createElement("ul");
    var totalUsed = elem.used.reduce(function (a, b) {
        return (a + b)
    });
    if (totalUsed > 0) {
        var title;
        if (totalUsed == 1)
            title = " This key has been used once"
        else
            title = " This key has been used " + totalUsed + " times";
        // Generating the complete usage information
        for (i = 0; i < elem.used.length; ++i) {
            if (elem.used[i] != 0) {
                usedContent.innerHTML += '<li>' + keyFct[i] + ' : ' + elem.used[i] +
                    ' times.</li>';
            }
        }
        //display all usage information when clicking on the usage resume.
        usedTitle.innerText =  String.fromCharCode(0x25b8) + title;
        usedContent.style.display = "none";
        usedTitle.onclick =
            function (e) {
                if (usedContent.style.display == "none") {
                    usedContent.style.display = "inline-block";
                    usedTitle.innerText =  String.fromCharCode(0x25be) + title;
                }
                else {
                    usedContent.style.display = "none";
                    usedTitle.innerText =  String.fromCharCode(0x25b8) + title;
                }
            };
    }
    else {
        usedTitle.innerText = "This key has not been used";
    }
    used.appendChild(usedTitle);
    used.appendChild(usedContent);
    key.appendChild(used);
    return key;
}

// Generate and inject the html corresponding to each key
function display_keys(response) {
    response.forEach(function (elem) {
        document.body.appendChild(get_formated_key(JSON.parse(elem)));
    })
}

// Send message to the script running with the page.
function send_to_page(str, fct) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    },
                      function (tabs) {
                          chrome.tabs.sendMessage(tabs[0].id, str, fct)
                      })
}

// Function to save the trace json
function get_cst(fct) {
    send_to_page("get_keys", fct);
}

// Function to download a file, used for the key download.
function download_file(name, t, content) {
    var cstBlob = new Blob([content], {
        type: t
    });
    var link = document.createElement("a");
    var url = window.URL.createObjectURL(cstBlob);
    link.setAttribute("href", url);
    link.setAttribute("download", name);
    link.click();
    window.URL.revokeObjectURL(url)
}

// Function to download the key list.
function save_json(response) {
    var content = "";
    for (i = 0; i < response.length; ++i) {
        content += response[i];
    }
    download_file("key.json", "text/json", content);
}

// Recover the key from page.
window.onload =
    function (e) {
        get_cst(display_keys)
    };

// Bind the event save keys to its button
window.document.body.querySelector(".key_save").onclick =
    function (e) {
        get_cst(save_json)
    };

// Bind the event save traces to its button
window.document.body.querySelector(".trace_save").onclick =
    function (e) {
        send_to_page("save_cst", function (a) {})
    };
