// utils/validate.js — validasi ringan untuk field media & teks dari user

// Avatar/banner/image: kosong, URL http(s), atau data URI image (base64) dengan batas panjang
function isValidMedia(v, maxBase64 = 900000) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return true;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(s)) {
    return s.length <= maxBase64 && !/[<>"']/.test(s.slice(0, 256));
  }
  return /^https:\/\/[^\s"'<>\\]+$/.test(s) && s.length <= 2000;
}

// URL video eksternal (youtube/vimeo/direct)
function isValidVideoUrl(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return true;
  return /^(https:\/\/(www\.)?(youtube\.com|youtu\.be|player\.vimeo\.com)\/[^\s"'<>]+|https:\/\/[^\s"'<>]+\.(mp4|webm|mov)(\?[^\s"'<>]*)?)$/i.test(s) && s.length <= 2000;
}

module.exports = { isValidMedia, isValidVideoUrl };
