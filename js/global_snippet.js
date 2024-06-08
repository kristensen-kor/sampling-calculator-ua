const $$ = x => document.querySelector(x);
const $$$ = x => document.querySelectorAll(x);

async function fetch_api(url, data) {
	const params = {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(data)
	};

	const response = await fetch(url, params);

	if (response.status != 200) throw "status " + response.status;

	const response_data = await response.json();

	if ("error" in response_data) throw response_data.error;

	return response_data.data;
}

const sum = xs => xs.reduce((a, b) => a + b, 0);

const avg = xs => sum(xs) / xs.length;

const iota = x => [...Array(x).keys()];

const transpose = xs => xs.reduce((p, n) => n.map((_, i) => [...(p[i] || []), n[i]]), []);

function round(x, y) {
	if (y === undefined) y = 0;
	return Number(x.toFixed(y));
}

function base64_encode(string, line_length) {
	const result = btoa(encodeURIComponent(string).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode("0x" + p1)));

	return line_length === undefined ? result : result.match(new RegExp(`.{1,${line_length}}`, "g")).join("\n");
}

function base64_decode(string) {
	return decodeURIComponent(atob(string).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
}

function empty_node(node) {
	while (node.firstChild) {
		node.firstChild.remove();
	}
}

function copy_to_clipboard(data) {
	let node = document.createElement("textarea");
	document.body.appendChild(node);
	node.value = data;
	node.select();
	document.execCommand("copy");
	window.getSelection().removeAllRanges();
	node.remove();
}

function dice(xs) {
	let total = sum(xs);

	let rnd = Math.random() * total;

	let acc = 0;

	for (let i = 0; i < xs.length; i++) {
		acc += xs[i];

		if (rnd < acc) return i;
	}

	return xs.length - 1;
}

function lr_round(xs) {
	let base_array = xs.map(Math.floor);

	const difference = round(sum(xs)) - sum(base_array);

	const remainders = xs.map((num, index) => [num - Math.floor(num), index]).toSorted((a, b) => b[0] - a[0]);

	for (let i = 0; i < difference; i++) {
		base_array[remainders[i][1]]++;
	}

	return base_array;
}

function to_matrix(xs, rows) {
	const cols = xs.length / rows;
	return Array.from({ length: rows }, (_, i) => xs.slice(i * cols, (i + 1) * cols));
}

function new_node(tagname, cl, attr, text, child_node) {
	let node = document.createElement(tagname);

	if (cl) cl.split(" ").forEach(a => node.classList.add(a));
	if (text || text === 0) node.textContent = text;
	if (attr) Object.keys(attr).forEach(key => node.setAttribute(key, attr[key]));
	if (child_node) node.appendChild(child_node);

	return node;
}

const hide = (node) => node.classList.add("hidden");
const show = (node) => node.classList.remove("hidden");

function $$_hide(node) {
	$$(node).classList.add("hidden");
}

function $$_show(node) {
	$$(node).classList.remove("hidden");
}

function $$_hidden(node, state) {
	if (state) {
		$$(node).classList.add("hidden");
	} else {
		$$(node).classList.remove("hidden");
	}
}

function Timer(f, name) {
	const t0 = performance.now();

	this.stop = function() {
		const duration = performance.now() - t0;
		console.log((name === undefined ? "duration" : name) + ": " + duration);
		return duration;
	}

	if (f !== undefined && typeof(f) == "function") {
		f();
		return this.stop();
	} else {
		name = f;
	}
}
