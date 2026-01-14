// utils/deviceFingerprint.js
export const getDeviceFingerprint = () => {
  const data = [
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join("|");

  return btoa(data);
};
