// Bu dosya, @mapbox/node-pre-gyp modülüne referansları boş bir nesneye yönlendirir
// Bu, tarayıcı ortamında yüklenmesi beklenmeyen node modüllerinin neden olduğu hataları önler

module.exports = {
  // Boş bir nesne
  util: {},
  configure: () => {},
  find: () => {},
  rebuild: () => {},
  clean: () => {},
  package: () => {},
  testpackage: () => {},
  testbinary: () => {},
  unpublish: () => {},
  install: () => {},
  info: () => {}
};
