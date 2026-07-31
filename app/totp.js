// Lightweight Pure JS TOTP Generator for Fitbit OS

// UPDATE: Accept the calibrated epoch time from our app
export function generateTOTP(secretBase32, epoch) {
  try {
    const key = base32tohex(secretBase32);
    
    // UPDATE: Use the passed epoch, or default to standard time if none is provided
    if (!epoch) {
      epoch = Math.floor(new Date().getTime() / 1000);
    }
    
    const time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');
    
    const hmac = core_hmac_sha1(key, time);
    
    const offset = hex2dec(hmac.substring(hmac.length - 1));
    let otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
    
    otp = ("000000" + otp).slice(-6); 
    return otp;
  } catch (e) {
    return "ERROR ";
  }
}

// ... keep all the helper functions below exactly as they were! ...

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function hex2dec(s) { return parseInt(s, 16); }
function dec2hex(s) { return (s < 15.5 ? '0' : '') + Math.round(s).toString(16); }
function leftpad(str, len, pad) {
  if (len + 1 >= str.length) { str = Array(len + 1 - str.length).join(pad) + str; }
  return str;
}

function base32tohex(base32) {
  let base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";
  
  // Strip any accidental spaces from the secret key
  base32 = base32.replace(/\s+/g, '');
  
  for (let i = 0; i < base32.length; i++) {
    let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue; 
    bits += leftpad(val.toString(2), 5, '0');
  }
  for (let i = 0; i + 4 <= bits.length; i += 4) {
    let chunk = bits.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

// =========================================================
// PURE JAVASCRIPT HMAC-SHA1 ENGINE
// =========================================================

function hex2binb(str) {
  var bin = [];
  for (var i = 0; i < str.length; i += 2) {
    var num = parseInt(str.substr(i, 2), 16);
    bin[i >> 3] |= num << (24 - (i % 8) * 4);
  }
  return bin;
}

function binb2hex(binarray) {
  var hex_tab = "0123456789abcdef";
  var str = "";
  for (var i = 0; i < binarray.length * 4; i++) {
    str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
           hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
  }
  return str;
}

function core_sha1(x, len) {
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;

  for (var i = 0; i < x.length; i += 16) {
    var olda = a, oldb = b, oldc = c, oldd = d, olde = e;
    for (var j = 0; j < 80; j++) {
      if (j < 16) w[j] = x[i + j] || 0;
      else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d; d = c; c = rol(b, 30); b = a; a = t;
    }
    a = safe_add(a, olda); b = safe_add(b, oldb); c = safe_add(c, oldc); d = safe_add(d, oldd); e = safe_add(e, olde);
  }
  return [a, b, c, d, e];
}

function sha1_ft(t, b, c, d) {
  if (t < 20) return (b & c) | ((~b) & d);
  if (t < 40) return b ^ c ^ d;
  if (t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

function sha1_kt(t) {
  return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
}

function safe_add(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

function rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

function core_hmac_sha1(key, data) {
  var bkey = hex2binb(key);
  if (bkey.length > 16) bkey = core_sha1(bkey, key.length * 4);
  var ipad = Array(16), opad = Array(16);
  for (var i = 0; i < 16; i++) {
    ipad[i] = (bkey[i] || 0) ^ 0x36363636;
    opad[i] = (bkey[i] || 0) ^ 0x5C5C5C5C;
  }
  var hash = core_sha1(ipad.concat(hex2binb(data)), 512 + data.length * 4);
  return binb2hex(core_sha1(opad.concat(hash), 512 + 160));
}