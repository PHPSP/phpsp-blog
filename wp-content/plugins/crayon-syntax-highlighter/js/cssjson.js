/**
 * CSS-JSON Converter for JavaScript, v.2.0 By Aram Kocharyan, http://aramk.com/
 * Converts CSS to JSON and back.
 */

var CSSJSON = new function() {

	var base = this;

	base.init = function() {
		// String functions
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		};

		String.prototype.repeat = function(n) {
			return new Array(1 + n).join(this);
		};
	};
	base.init();

	var selX = /([^\s\;\{\}][^\;\{\}]*)\{/g;
	var endX = /\}/g;
	var lineX = /([^\;\{\}]*)\;/g;
	var commentX = /\/\*[\s\S]*?\*\//g;
	var lineAttrX = /([^\:]+):([^\;]*);/;

	// This is used, a concatenation of all above. We use alternation to
	// capture.
	var altX = /(\/\*[\s\S]*?\*\/)|([^\s\;\{\}][^\;\{\}]*(?=\{))|(\})|([^\;\{\}]+\;(?!\s*\*\/))/gmi;

	// Capture groups
	var capComment = 1;
	var capSelector = 2;
	var capEnd = 3;
	var capAttr = 4;

	var isEmpty = function(x) {
		return typeof x == 'undefined' || x.length == 0 || x == null;
	};

	/**
	 * Input is css string and current pos, returns JSON object
	 * 
	 * @param cssString
	 *            The CSS string.
	 * @param args
	 *            An optional argument object. ordered: Whether order of
	 *            comments and other nodes should be kept in the output. This
	 *            will return an object where all the keys are numbers and the
	 *            values are objects containing "name" and "value" keys for each
	 *            node. comments: Whether to capture comments. split: Whether to
	 *            split each comma separated list of selectors.
	 */
	base.toJSON = function(cssString, args) {
		var node = {
            children: {},
            attributes: {}
        };
		var match = null;
		var count = 0;

		if (typeof args == 'undefined') {
			var args = {
				ordered : false,
				comments : false,
                stripComments : false,
				split : false
			};
		}
        if (args.stripComments) {
            args.comments = false;
            cssString = cssString.replace(commentX, '');
        }

		while ((match = altX.exec(cssString)) != null) {
			if (!isEmpty(match[capComment]) && args.comments) {
				// Comment
				var add = match[capComment].trim();
				node[count++] = add;
			} else if (!isEmpty(match[capSelector])) {
				// New node, we recurse
				var name = match[capSelector].trim();
				// This will return when we encounter a closing brace
				var newNode = base.toJSON(cssString, args);
				if (args.ordered) {
					var obj = {};
					obj['name'] = name;
					obj['value'] = newNode;
					// Since we must use key as index to keep order and not
					// name, this will differentiate between a Rule Node and an
					// Attribute, since both contain a name and value pair.
					obj['type'] = 'rule';
					node[count++] = obj;
				} else {
					if (args.split) {
						var bits = name.split(',');
					} else {
						var bits = [name];
					}
                    for (i in bits) {
                        var sel = bits[i].trim();
                        if (sel in node.children) {
                            for (var att in newNode.attributes) {
                                node.children[sel].attributes[att] = newNode.attributes[att];
                            }
                        } else {
                            node.children[sel] = newNode;
                        }
                    }
				}
			} else if (!isEmpty(match[capEnd])) {
				// Node has finished
				return node;
			} else if (!isEmpty(match[capAttr])) {
				var line = match[capAttr].trim();
				var attr = lineAttrX.exec(line);
				if (attr) {
					// Attribute
					var name = attr[1].trim();
					var value = attr[2].trim();
					if (args.ordered) {
						var obj = {};
						obj['name'] = name;
						obj['value'] = value;
						obj['type'] = 'attr';
						node[count++] = obj;
					} else {
						node.attributes[name] = value;
					}
				} else {
					// Semicolon terminated line
					node[count++] = line;
				}
			}
		}

		return node;
	};

	/**
	 * @param node
	 *            A JSON node.
	 * @param depth
	 *            The depth of the current node; used for indentation and
	 *            optional.
	 * @param breaks
	 *            Whether to add line breaks in the output.
	 */
	base.toCSS = function(node, depth, breaks) {
		var cssString = '';
		if (typeof depth == 'undefined') {
			depth = 0;
		}
		if (typeof breaks == 'undefined') {
			breaks = false;
		}
		if (node.attributes) {
			for (i in node.attributes) {
				cssString += strAttr(i, node.attributes[i], depth);
			}
		}
		if (node.children) {
			var first = true;
			for (i in node.children) {
				if (breaks && !first) {
					cssString += '\n';
				} else {
					first = false;
				}
				cssString += strNode(i, node.children[i], depth);
			}
		}
		return cssString;
	};

	// Helpers

	var strAttr = function(name, value, depth) {
		return '\t'.repeat(depth) + name + ': ' + value + ';\n';
	};

	var strNode = function(name, value, depth) {
		var cssString = '\t'.repeat(depth) + name + ' {\n';
		cssString += base.toCSS(value, depth + 1);
		cssString += '\t'.repeat(depth) + '}\n';
		return cssString;
	};

};
