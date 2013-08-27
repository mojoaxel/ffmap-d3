CAT=cat

NODES_SRC=lib/d3.min.js date.js loader.js links.js pacman.js nodes.js
HIVE_SRC=lib/d3.min.js date.js loader.js links.js hive.js

.PHONY: all
all: nodes_compiled.js hive_compiled.js


nodes_compiled.js: $(NODES_SRC)
	$(CAT) $(NODES_SRC) > $@ 	

hive_compiled.js: $(HIVE_SRC)
	$(CAT) $(HIVE_SRC) > $@ 	

clean:
	rm nodes_compiled.js
	rm hive_compiled.js
