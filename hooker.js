// Cryptosense Key Inspector (C) Cryptosense 2014 see LICENSE.md

// Hook the WebCryptoAPI


// Array of the different functions, used to obtain the index of
// the function in key.usage array.

var keyFct = ["encrypt","decrypt","sign","verify",
              "deriveKey","deriveBits","exportKey","wrapKey", "unwrapKey"]

var AtoHexa = function (a) {
    return  ("0x" +
             Array.prototype.map.call(
                 a,
                 function(x){
                     x = x.toString(16);
                     x = ("00"+x).substr(-2);
                     return x;
                 }).join('').toUpperCase());
};

var ABtoHexa = function (a){
    var tmp = new Uint8Array(a);
    return AtoHexa(tmp)
};

// Return unique ID for keys.
var getKeyId = (function(){
    var i = 0;
    return (function() {return (i++);});
})();

// Save each function call in sessionstorage.
var saveElem = (function (){
    var k = 0;
    return function(elem)
    {
        sessionStorage[k] = JSON.stringify(elem, null, '  ');
        k += 1;
    };
})();

// Formating algorithmIdentifier
var getAlgorithmIdentifier = function(a)
{
    if (a)
    {
        var algorithm = new Object();
        if (a.name)
            algorithm.name = a.name.toUpperCase();
        if (a.iv)
            algorithm.iv = ABtoHexa(a.iv);
        if(a.hash)
            algorithm.hash = a.hash;
        if (a.length)
            algorithm.length = a.length;
        return algorithm;
    }
};

// Save keys in sessionStorage
function saveKey(key)
{
    sessionStorage["key" + key.id] = JSON.stringify(key, null, '  ');
}

// Edit the used field of a key.
function editKey(key, action)
{
    key.used[keyFct.indexOf(action)] += 1;
    saveKey(key);
}

// Add a new key, which could be a key pair.
function addKey(elem)
{
    function extendKey(key)
    {
        var date = (new Date()).toISOString();
        key.creationDate = date;
        key.id = getKeyId();
        key.used = [0,0,0,0,0,0,0,0,0];
        saveKey(key);
    };
    if (elem.publicKey != null)
    {
        extendKey(elem.privateKey);
        extendKey(elem.publicKey);
    }
    else
        extendKey(elem);
}

// Function called when an error occured in one of the overwrite functions
function error(ret)
{
    return function(err){
        ret.error = err;
        saveElem(ret);
        return Promise.reject(err)
    };
}

// Called on success of an overwrite function that returns standard data
function output(ret)
{
    return function(a){
        ret.output = a;
        saveElem(ret);
        return Promise.resolve(a)
    };
}

// Called on success of an overwrite function that returns raw data
function outputABtoHexa(ret)
{
    return function(a){
        ret.output = ABtoHexa(a);
        saveElem(ret);
        return Promise.resolve(a)
    };
}

// Called on success of an overwrite function that returns raw data
function outputab2str(ret)
{
    return function(a){
        ret.output = ab2str(a);
        saveElem(ret);
        return Promise.resolve(a)
    };
}

// Called on success of an overwrite function that returns a key
function outputKey(ret)
{
    return function(a){
        addKey(a);
        ret.output = a;
        saveElem(ret);
        return Promise.resolve(a)
    };
};

// Overwrite getRandomValues
(function() {
    var proxied = crypto.getRandomValues;
    crypto.getRandomValues = function() {
        var ret = new Object();
        ret.command = "getRandomValues";
        ret.input = arguments;
        ret.output = proxied.apply(this, arguments);
        saveElem(ret);
        return ret.output;
    };
})();

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

// Overwrite encrypt
(function() {
    var proxied = window.crypto.subtle.encrypt;
    window.crypto.subtle.encrypt = function() {
        var ret = new Object();
        ret.command = "encrypt";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.key = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "encrypt");
        ret.input.data = ab2str(arguments[2]);
        var out = proxied.apply(this, arguments)
            .then
        (outputABtoHexa(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite decrypt
(function() {
    var proxied = window.crypto.subtle.decrypt;
    window.crypto.subtle.decrypt = function() {
        var ret = new Object();
        ret.command = "decrypt";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.key = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "decrypt");
        ret.input.data = AtoHexa(arguments[2]);
        var out = proxied.apply(this, arguments)
            .then
        (outputab2str(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite sign
(function() {
    var proxied = window.crypto.subtle.sign;
    window.crypto.subtle.sign = function() {
        var ret = new Object();
        ret.command = "sign";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.key = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "sign");
        ret.input.data = ABtoHexa(arguments[2]);
        var out = proxied.apply(this, arguments)
            .then
        (outputABtoHexa(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite verify
(function() {
    var proxied = window.crypto.subtle.verify;
    window.crypto.subtle.verify = function() {
        var ret = new Object();
        ret.command = "verify";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.key = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "verify");
        ret.input.signature = ABtoHexa(arguments[2]);
        ret.input.data = ABtoHexa(arguments[3]);
        var out = proxied.apply(this, arguments)
            .then
        (output(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite digest
(function() {
    var proxied = window.crypto.subtle.digest;
    window.crypto.subtle.digest = function() {
        var ret = new Object();
        ret.command = "digest";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.data = ABtoHexa(arguments[1]);
        var out = proxied.apply(this, arguments)
            .then
        (outputABtoHexa(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite generateKey
(function() {
    var proxied = window.crypto.subtle.generateKey;
    window.crypto.subtle.generateKey = function() {
        var ret = new Object();
        ret.command = "generateKey";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.extractable = arguments[1];
        ret.input.keyUsages = arguments[2];
        var out = proxied.apply(this, arguments)
            .then
        (outputKey(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite deriveKey
(function() {
    var proxied = window.crypto.subtle.deriveKey;
    window.crypto.subtle.deriveKey = function() {
        var ret = new Object();
        ret.command = "deriveKey";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.baseKey = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "deriveKey");
        // Format the algorithmIdentifier for better reading.
        ret.input.derivedKeyType = getAlgorithmIdentifier(arguments[2]);
        ret.input.extractable = arguments[3];
        ret.input.keyUsages = arguments[4];
        var out = proxied.apply(this, arguments)
            .then
        (outputKey(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite deriveBits
(function() {
    var proxied = window.crypto.subtle.deriveBits;
    window.crypto.subtle.deriveBits = function() {
        var ret = new Object();
        ret.command = "deriveBits";
        ret.input = new Object();
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[0]);
        ret.input.baseKey = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "deriveBits");
        ret.input.length = arguments[2];
        var out = proxied.apply(this, arguments)
            .then
        (outputKey(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite importKey
(function() {
    var proxied = window.crypto.subtle.importKey;
    window.crypto.subtle.importKey = function() {
        var ret = new Object();
        ret.command = "importKey";
        ret.input = new Object();
        ret.input.format = arguments[0];
        if (ret.input.format == "raw")
            ret.input.keyData = ABtoHexa(arguments[1]);
        else
            ret.input.keyData = arguments[1];
        // Format the algorithmIdentifier for better reading.
        ret.input.algorithm = getAlgorithmIdentifier(arguments[2]);
        ret.input.extractable = arguments[3];
        ret.input.keyUsages = arguments[4];
        var out = proxied.apply(this, arguments)
            .then
        (outputKey(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite exportKey
(function() {
    var proxied = window.crypto.subtle.exportKey;
    window.crypto.subtle.exportKey = function() {
        var ret = new Object();
        ret.command = "exportKey";
        ret.input = new Object();
        ret.input.format = arguments[0];
        ret.input.key = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "exportKey");
        var out = proxied.apply(this, arguments)
            .then
        (function(a){
            if (ret.input.format == "raw")
                ret.output = ABtoHexa(a);
            else
                ret.output = a;
            saveElem(ret);
            return Promise.resolve(a)},
         error(ret)
        );
        return out;
    };
})();

// Overwrite wrapKey
(function() {
    var proxied = window.crypto.subtle.wrapKey;
    window.crypto.subtle.wrapKey = function() {
        var ret = new Object();
        ret.command = "wrapKey";
        ret.input = new Object();
        ret.input.format = arguments[0];
        ret.input.key = arguments[1];
        // Save the fact that the key has been used.
        editKey(arguments[1], "wrapKey");
        ret.input.wrappingKey = arguments[2];
        // Format the algorithmIdentifier for better reading.
        ret.input.wrapAlgorithm = getAlgorithmIdentifier(arguments[3]);
        var out = proxied.apply(this, arguments)
            .then
        (outputABtoHexa(ret),
         error(ret)
        );
        return out;
    };
})();

// Overwrite unwrapKey
(function() {
    var proxied = window.crypto.subtle.unwrapKey;
    window.crypto.subtle.unwrapKey = function() {
        var ret = new Object();
        ret.command = "unwrapKey";
        ret.input = new Object();
        ret.input.format = arguments[0];
        ret.input.wrappedKey = AtoHexa(arguments[1]);
        ret.input.unwrappingKey = arguments[2];
        // Save the fact that the key has been used.
        editKey(arguments[2], "unwrapKey");
        // Format the algorithmIdentifiers for better reading.
        ret.input.unwrapAlgorithm = getAlgorithmIdentifier(arguments[3]);
        ret.input.unwrappedKeyAlgorithm = getAlgorithmIdentifier(arguments[4]);
        ret.input.extractable = arguments[5];
        ret.input.keyUsages = arguments[6];
        var out = proxied.apply(this, arguments)
            .then
        (outputKey(ret),
         error(ret)
        );
        return out;
    };
})();
