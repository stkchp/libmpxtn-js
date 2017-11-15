# libmpxtn.js

[pxtoneCollage](http://pxtone.org/)で作成された音楽ファイル(.ptcop)を
ブラウザ上でデコード・再生できるようにしたものです。

## 特徴

[libmpxtn](/stkchp/libmpxtn)というC言語で書かれたpxtoneCollageのデコーダをWebAssemblyにコンパイルし、
それを利用してWebページ上でデコード・再生を可能にしています。
再生には現状[audio-feeder](/brion/audio-feeder)用の
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

`libmpxtn.min.js`と`libmpxtn.wasm`を


## ライセンス

- Javascript
- [MIT](LICENSE)

ogg/vorbisのデコードは[libogg](/xiph/ogg)、[libvorbis](/xiph/vorbis)のソースを利用しています。
また、ogg/vorbisで使用されているmathやsortのCライブラリは[musl libc](/jfbastien/musl)のソースを利用しています。

- libmpxtn.wasm
	- libmpxtn  - [MIT](wasm/LICENSE.mpxtn)
	- libogg    - [BSD](wasm/LICENSE.ogg)
	- libvorbis - [BSD](wasm/LICENSE.vorbis)
	- musl libc - [MIT](wasm/LICENSE.musl)
