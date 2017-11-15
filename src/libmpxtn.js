"use strict";
class libmpxtn {
	constructor(size, buffsize, path) {
		/* [memory image]
		 * +---------------------------------------+
		 * | FLAT MEMORY IMAGE(maybe...)           |
		 * |---------------------------------------+
		 * | GLOBAL | STACK | BUFFER | FILE | HEAP |
		 * +---------------------------------------+
		 */
		this.memsize    = size;
		this.globalsize =  256 * 1024; /* 256KB(fixed) */
		this.stacksize  = 1024 * 1024; /*   1MB(fixed) */
		this.buffersize =    buffsize;
		this.filesize   =           0;
		this.heapsize   =           0;
		this.calc_top();
		this.memory     = new WebAssembly.Memory({initial: this.memsize / 64 / 1024});
		this.heap       = new heapmemory(this.heaptop, this.heapsize, this.memory, 4);
		this.mpxtnobj   =           0;
		this.imports    = {imports: {}};
		this.exports    = {};
		this.path       = path;

		this.imports.env = { 
			memory: this.memory,
			malloc: size => this.heap.malloc(size),
			realloc: (addr, size) => this.heap.realloc(addr, size),
			free: addr => this.heap.free(addr)
		};
	}

	calc_top() {
		this.stacktop  = this.globalsize;
		this.buffertop = this.stacktop  + this.stacksize;
		this.filetop   = this.buffertop + this.buffersize;
		this.heaptop   = this.filetop   + this.filesize;
		this.heapsize  = this.memsize   - this.heaptop;
	}

	load_wasm() {
		return new Promise((resolve, reject) => {
			fetch(this.path).then(response =>
				response.arrayBuffer()
			).then(bytes =>
				WebAssembly.instantiate(bytes, this.imports)
			).then(results => {
				this.exports = results.instance.exports;
				resolve(results);
			});
		});
	}

	heap_usage() {
		return {
			size: this.heapsize,
			allocated: this.heap.allocated_bytes(),
			free: this.heap.freetable()
		};
	}

	clear() {
		this.mpxtnobj = 0;
		this.heap.clear();
	}

	set_file(bytes, size) {
		this.filesize = size;
		this.calc_top();

		const sview = new Uint8Array(bytes);
		let   dview = new Uint8Array(this.memory.buffer);

		for(let i = 0; i < this.filesize; ++i) {
			dview[this.filetop + i] = sview[i];
		}

		/* resize & reset heapmemory */
		this.mpxtnobj = 0;
		this.heap.resize(this.heaptop, this.heapsize);
	}

	get ready() {
		return (this.mpxtnobj > 0);
	}

	mpxtn_mread() {
		this.mpxtnobj = this.exports.mpxtn_mread(this.filetop, this.filesize, 0);
		return (this.mpxtnobj > 0);
	}

	mpxtn_reset() {
		if(this.mpxtnobj == 0) return null;
		return this.exports.mpxtn_reset(this.mpxtnobj);
	}
	mpxtn_get_total_samples() {
		if(this.mpxtnobj == 0) return null;
		return this.exports.mpxtn_get_total_samples(this.mpxtnobj);
	}
	mpxtn_get_current_sample() {
		if(this.mpxtnobj == 0) return null;
		return this.exports.mpxtn_get_current_sample(this.mpxtnobj);
	}
	mpxtn_get_repeat_sample() {
		if(this.mpxtnobj == 0) return null;
		return this.exports.mpxtn_get_repeat_sample(this.mpxtnobj);
	}
	mpxtn_set_loop(loop) {
		if(this.mpxtnobj == 0) return null;
		return this.exports.mpxtn_set_loop(this.mpxtnobj, Boolean(loop));
	}
	mpxtn_get_loop() {
		if(this.mpxtnobj == 0) return null;
		return this.exports.mpxtn_get_loop(this.mpxtnobj);
	}

	mpxtn_vomit() {
		if(this.mpxtnobj == 0) return null;
		this.exports.mpxtn_vomit(this.buffertop, this.buffersize / 4, this.mpxtnobj);
		return this.memory.buffer.slice(this.buffertop, this.buffertop + this.buffersize);
	}

	mpxtn_vomit_feeder() {
		if(this.mpxtnobj == 0) return null;
		const m = this.buffertop + this.buffersize / 2;
		this.exports.mpxtn_vomit_feeder(this.buffertop, this.buffersize / 8, this.mpxtnobj);
		return [
			new Float32Array(this.memory.buffer.slice(this.buffertop, m)),
			new Float32Array(this.memory.buffer.slice(m, this.buffertop + this.buffersize))
		];
	}

	dump_pcm() {
		if(this.mpxtnobj == 0) return null;
		this.mpxtn_reset();
		this.mpxtn_set_loop(false);
		const step = this.buffersize / 4;
		const total = this.mpxtn_get_total_samples();
		let buffer = new ArrayBuffer(44 + total * 4); // int16(2byte), stereo
		// write header
		let view = new DataView(buffer);
		view.setUint32( 0, 0x52494646, false);    // RIFF
		view.setUint32( 4, 36 + total * 4, true); // size
		view.setUint32( 8, 0x57415645, false); // WAVE
		view.setUint32(12, 0x666D7420, false); // fmt 
		view.setUint32(16, 16, true);          // size
		view.setUint16(20, 1, true);           // wFormatTag
		view.setUint16(22, 2, true);           // nChannels
		view.setUint32(24, 44100, true);       // nSamplePerSec
		view.setUint32(28, 44100 * 4, true);   // nAvgBytePerSec
		view.setUint16(32, 4, true);           // nBlockAlign
		view.setUint16(34, 16, true);          // nBitPerSample
		view.setUint32(36, 0x64617461, false); // DATA
		view.setUint32(40, total * 4, true);   // size

		// decode data
		let dview = new Uint32Array(buffer);

		for(let i = 0; i < total; i+=step) {
			const sview = new Uint32Array(this.mpxtn_vomit());
			for(let j = 0; j < step && (i + j) < total; ++j) {
				dview[44 + i + j] = sview[j];
			}
		}
		return buffer;
	}
};

