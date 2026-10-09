// Derleme betiği: index.src.html (JSX kaynak) → index.html (tarayıcıya hazır)
//
// Uygulamanın kaynak kodu index.src.html içindedir ve JSX ile yazılmıştır.
// Eskiden bu kod her açılışta telefonda Babel ile derleniyordu (birkaç saniye).
// Bu betik derlemeyi önceden yapar; index.html'de Babel yüklenmez, uygulama
// daha hızlı açılır.
//
// Kullanım:  node derle.js
// Gerekli:   npm i @babel/standalone   (ya da BABEL_YOLU ortam değişkeni)
const fs = require("fs");
const path = require("path");

let Babel;
try { Babel = require(process.env.BABEL_YOLU || "@babel/standalone"); }
catch (e) { console.error("@babel/standalone bulunamadı. Önce: npm i @babel/standalone"); process.exit(1); }

const kok = __dirname;
const kaynak = fs.readFileSync(path.join(kok, "index.src.html"), "utf8");

const ACILIS = '<script type="text/babel" data-type="module">';
const bas = kaynak.indexOf(ACILIS);
if (bas < 0 || kaynak.indexOf(ACILIS, bas + 1) >= 0) throw new Error("Tek bir text/babel betiği bekleniyordu");
const icBas = bas + ACILIS.length;
const son = kaynak.indexOf("</script>", icBas);
const jsx = kaynak.slice(icBas, son);

const sonuc = Babel.transform(jsx, {
  sourceType: "module",
  comments: false,
  presets: [
    ["env", { targets: { safari: "13", ios: "13", chrome: "80", firefox: "78" }, modules: false }],
    ["react", { runtime: "classic" }],
  ],
}).code;
if (/<\/script/i.test(sonuc)) throw new Error("Derlenmiş kodda </script geçiyor");

let cikti = kaynak.slice(0, bas) + '<script type="module">\n' + sonuc + "\n" + kaynak.slice(son);

// Babel artık tarayıcıda gerekmiyor
const babelEtiketi = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@babel\/standalone@[^"]+"><\/script>\n?/;
if (!babelEtiketi.test(cikti)) throw new Error("Babel <script> etiketi bulunamadı");
cikti = cikti.replace(babelEtiketi, "");
cikti = cikti.replace(/\s*if \(typeof Babel === 'undefined'\) eksikler\.push\('Babel'\);/, "");

cikti = cikti.replace(/^<!DOCTYPE html>/i, m => m + "\n<!-- OTOMATİK ÜRETİLDİ: Bu dosyayı düzenlemeyin. Kaynak: index.src.html — derlemek için: node derle.js -->");

fs.writeFileSync(path.join(kok, "index.html"), cikti);
console.log("index.html üretildi:", (cikti.length / 1e6).toFixed(2) + " MB (kaynak " + (kaynak.length / 1e6).toFixed(2) + " MB)");
