importScripts("\\js\\global_snippet.js");

self.addEventListener("message", function(xs) {
	postMessage(round_table(xs.data));
});

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

function round_table(xs) {
	let rvn = xs;
	let rvt = transpose(xs);

	let len1 = rvn.length;
	let len2 = rvt.length;

	let basen = rvn.map(a => a.map(b => Math.trunc(b)));
	let baset = rvt.map(a => a.map(b => Math.trunc(b)));

	let currentn = [];
	let currentt = [];
	let best = [];

	let total = Math.round(sum(rvn.map(a => sum(a))));

	let rd1 = rvn.map(a => sum(a));
	let rd2 = rvt.map(a => sum(a));

	let temp_1 = new Array(len1).fill(0);
	let temp_2 = new Array(len2).fill(0);

	function iteration() {
		currentn = basen.map(a => a.slice()).slice();
		currentt = baset.map(a => a.slice()).slice();


		let current_total = sum(currentn.map(a => sum(a)));

		while (current_total != total) {
			let cd1 = currentn.map(a => sum(a));

			temp_1 = rd1.map((a, i) => a - cd1[i]);

			temp_1.forEach((a, i) => temp_1[i] = a < 0 ? 0 : a);

			let i1 = dice(temp_1);

			let cd2 = currentt.map(a => sum(a));

			temp_2 = rd2.map((a, i) => a - cd2[i]);

			for (let i = 0; i < temp_2.length; i++) {
				if (temp_2[i] < 0) temp_2[i] = 0;
				let ind = i1 * temp_2.length + i;
				if (rvn[i1][i] <= currentn[i1][i]) temp_2[i] = 0;
			}

			if (sum(temp_2) == 0) break;

			let i2 = dice(temp_2);

			currentn[i1][i2]++;
			currentt[i2][i1]++;
			current_total++;
		}
	}

	function calc_diff() {
		let cd1 = currentn.map(a => sum(a));
		let cd2 = currentt.map(a => sum(a));

		temp_1 = rd1.map((a, i) => (a - cd1[i]) ** 2);
		temp_2 = rd2.map((a, i) => (a - cd2[i]) ** 2);

		return sum(temp_1) / len1 + sum(temp_2) / len2;
	}

	iteration();

	let current_diff = calc_diff();
	let best_diff = current_diff;

	best = currentn.map(a => a.slice()).slice();

	let nc = 0;

	for (let i = 0; i < 10; i++) {
		iteration();
		current_diff = calc_diff();
		nc++;

		if (current_diff < best_diff) {
			best_diff = current_diff;
			best = currentn.map(a => a.slice()).slice();
			nc = 0;
		}
	}

	return best;
}

// lc 115
