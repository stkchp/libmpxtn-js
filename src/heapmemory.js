"use strict";
class heapmemory {
	constructor(top, size, memory, align = 4) {
		this.top    = Number(top);
		this.size   = Number(size);
		this.memory = memory;
		this.align  = align;
		this.ftable = {0: this.size};
		this.atable = {};
	}

	resize(top, size) {
		this.top  = Number(top);
		this.size = Number(size);
		this.ftable = {0: this.size};
		this.atable = {};
	}

	clear() {
		this.ftable = {0: this.size}
		this.atable = {};
	}

	tabledump() {
		console.log("alloc");
		console.log(this.atable);
		console.log("free");
		console.log(this.ftable);
	}

	allocated(i) {
		i = Number(i);
		if(i in this.ftable) {
			return true;
		}
		return false;
	}

	allocated_bytes() {
		let s = 0;
		for(let a in this.atable) {
			s += this.atable[a];
		}
		return s;
	}

	freetable() {
		return this.ftable;
	}

	check_fwdspace(i) {
		i = Number(i);
		if(!this.allocated(i)) {
			return;
		}
		const fi = i + Number(this.ftable[i]);
		if(!(fi in this.ftable)) {
			return;
		}
		
		this.ftable[i] += this.ftable[fi];
		delete this.ftable[fi];
	}

	check_bwdspace(i) {
		i = Number(i);
		const keys = Object.keys(this.ftable).sort(
			(a, b) => {
				return Number(a) - Number(b);
			}
		);
		const ck = Number(keys.indexOf(i.toString()));
		if(ck > 0) {
			const bi = Number(keys[ck - 1]);
			if(bi + this.ftable[bi] == i) {
				this.ftable[bi] += this.ftable[i];
				delete this.ftable[i];
			}
		}
	}

	aligned(size) {
		const rest = size % this.align;
		if(rest == 0) {
			return size;
		} else {
			return size + (this.align - rest);
		}
	}
	
	malloc(size) {
		let addr = null;
		size = this.aligned(size);
		
		/* search free table */
		for(let i in this.ftable) {
			i = Number(i)
			if(size <= this.ftable[i]) {
				
				/* insert alloctable */
				this.atable[i] = size;

				/* update freetable */
				if(size < this.ftable[i]) {
					this.ftable[i + size] = this.ftable[i] - size;
				}
				delete this.ftable[i];

				addr = this.top + i;
			}
		}
		if(addr == null) return 0;

		/* zero clear */
		let view = new Uint8Array(this.memory.buffer);
		for(let i = 0; i < size; ++i) {
			view[addr + i] = 0;
		}
		return addr;
	}

	free(addr) {
		const i = Number(addr - this.top);
		if(i in this.atable) {

			/* insert freetable */
			this.ftable[i] = this.atable[i];

			/* update alloctable */
			delete this.atable[i];

			/* freetable concat check[forward] */
			this.check_fwdspace(i);
			/* freetable concat check[backward] */
			this.check_bwdspace(i);
		}
	}
	
	realloc(addr, size) {
		/* addr == NULL, same as malloc. */
		if(addr == 0) return this.malloc(addr);
		
		const i = addr - this.top;
		if(i in this.atable) {
			size = this.aligned(size);

			/* size == 0, same as free. */
			if(size == 0) {
				free(addr);
				return 0;
			}

			/* shrink or same */
			if(size <= this.atable[i]) {
				/* shrink */
				if(size < this.atable[i]) {
					const ni = i + size;
					this.ftable[ni] = this.ftable[i] - size;
					/* search forward free space */
					this.check_fwdspace(ni);
				}
				return addr;
			}

			/* search forward freespace */
			const ni = i + this.atable[i];
			if(ni in this.ftable) {
				const avail = this.atable[i] + this.ftable[ni];
				if(size <= avail) {
					this.atable[i] = size;

					/* shrink freetable */
					if(size < avail) {
						const si = i + size;
						this.ftable[si] = avail - size;
					}
					delete this.ftable[ni];
					return addr;
				}
			}

			/* re-malloc */
			const naddr = this.malloc(size);
			if(naddr > 0) {
				/* copy */
				let view = new Uint8Array(this.memory.buffer);
				for(let w = 0; w < this.atable[i]; ++w) {
					view[naddr + w] = view[addr + w];
				}
				/* free old */
				this.free(addr);
				return naddr;
			}
		}
		return null;
	}

}
