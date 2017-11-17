# libmpxtn.js

[pxtoneCollage](http://pxtone.org/)で作成された音楽ファイル(.ptcop)を
ブラウザ上でデコード・再生できるようにしたものです。

## 特徴

[libmpxtn](https://github.com/stkchp/libmpxtn)というC言語で書かれたpxtoneCollageのデコーダをWebAssemblyにコンパイルし、
それを利用してWebページ上でデコード・再生を可能にしています。
再生には現状[audio-feeder](https://github.com/brion/audio-feeder)用の
Float32Arrayの出力をサポートしています。


## デモページ

[libmpxtn.js デモページ](https://tkch.net/wasm/99libmpxtn.html)

TODO: 後日Github Pagesにつくりなおす

## サポートするブラウザ

- WebAssemblyをサポートするブラウザ(ES6 classも使ってます)

- 参考: Can I Use?
    - [WebAssembly](https://caniuse.com/#feat=wasm)
    - [ES6 Class](https://caniuse.com/#feat=es6-class)


## 使い方

`libmpxtn.min.js`と`libmpxtn.wasm`をサーバに配置して、HTMLに以下を加えます。

```html
<script src="libmpxtn.min.js"></script>
```

javascriptからlibmpxtnのインスタンスを作り出します。
引数は順に`確保するメモリ`、`mpxtn_vomit系で使用するバッファサイズ`、`wasmのパス`です。

```javascript
let mpxtn = new libmpxtn(33554432, 4096, "libmpxtn.wasm");
```

あとはwasmをロードすれば各種のメソッドが使えるようになります。

```javascript
mpxtn.load_wasm().then(results => {
	const total = mpxtn.mpxtn_get_total_samples();
	...
});
```


## ライセンス

- Javascript
- [MIT](LICENSE)

ogg/vorbisのデコードは[libogg](https://github.com/xiph/ogg)、[libvorbis](https://github.com/xiph/vorbis)のソースを利用しています。
また、ogg/vorbisで使用されているmathやsortのCライブラリは[musl libc](https://github.com/jfbastien/musl)のソースを利用しています。

- libmpxtn.wasm
	- libmpxtn  - [MIT](wasm/LICENSE.mpxtn.txt)
	- libogg    - [BSD](wasm/LICENSE.ogg.txt)
	- libvorbis - [BSD](wasm/LICENSE.vorbis.txt)
	- musl libc - [MIT](wasm/LICENSE.musl.txt)
