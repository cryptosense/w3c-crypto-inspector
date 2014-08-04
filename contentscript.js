// Cryptosense Key Inspector (c) Cryptosense 2014 see LICENSE.md

// add hook into each page

sessionStorage.clear();

var b = document.createElement('script');
b.src = chrome.extension.getURL('hooker.js');
(document.head||document.documentElement).appendChild(b);
b.onload = function() {
    b.parentNode.removeChild(b);
};


function get_keys() {
    var cstContent = [];
    for(i = 0; i < sessionStorage.length && sessionStorage["key" +i]; ++i)
    {
        cstContent[i] = sessionStorage["key"+i];
    }
    return cstContent;
};

function save_cst() {
    var path = window.location.pathname;
    var sfile = path.substring(path.lastIndexOf("/")+1);
    var ffile = sfile.substring(0, sfile.lastIndexOf(".")) + ".cst";
    var cstContent = "";
    for(i = 0; i < sessionStorage.length && sessionStorage[i]; ++i)
        cstContent += sessionStorage[i.toString()];
    var cstBlob = new Blob([cstContent],{type : 'text/json'});
    var link = document.createElement("a");
    var url =  window.URL.createObjectURL(cstBlob);
    link.setAttribute("href", url);
    link.setAttribute("download", ffile);
    link.click();
    window.URL.revokeObjectURL(url)
    return "ok";
};


chrome.runtime.onMessage.addListener(
    function(request, sender, senderResponse)
    {
        if (request == "get_keys")
            senderResponse(get_keys ());
        else if (request == "save_cst")
            senderResponse(save_cst());
        else
            senderResponse("error");
    }
);
