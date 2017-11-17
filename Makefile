TARGET = libmpxtn.min.js
SRCS = src/heapmemory.js src/libmpxtn.js

.PHONY: all clean zip
all: $(TARGET)

$(TARGET): $(SRCS)
	uglifyjs $^ -o $@ -c -m

clean:
	rm -vf $(TARGET)

zip:
	zip release.zip $(TARGET) LICENSE wasm/*
