// $$(".main-link.home-link").addEventListener("contextmenu", e => {
// 	const set_style = href => document.getElementById("solarized_style").setAttribute("href", href);

// 	e.preventDefault();

// 	if (document.getElementById("solarized_style").getAttribute("href") == "css\\solarized_light.css") {
// 		set_style("css\\solarized_dark.css");
// 	} else {
// 		set_style("css\\solarized_light.css");
// 	}
// });


// worker
let worker = new Worker("js/worker.js");


const result_block = {
	props: ["state", "query", "data"],
	data: function() {
		return {
			rounded_quotas: [],
			display_table: []
		};
	},
	computed: {
		result_header: function() {
			let header = [];

			// if (this.data.calc_type == "cities" || this.data.calc_type == "gp_cities") header = ["name", "oblast", "population", "script_id"];
			if (this.data.calc_type == "cities" || this.data.calc_type == "gp_cities") header = ["name", "oblast", "population"];
			if (this.data.calc_type == "online" || this.data.calc_type == "gp") header = ["stratum region", "stratum type"];
			// if (this.data.calc_type == "standard") header = ["name", "rayon", "oblast", "type", "population", "script_id", "stratum region", "stratum type"];
			if (this.data.calc_type == "standard") header = ["name", "rayon", "oblast", "type", "population", "stratum region", "stratum type"];

			if (this.data.quota_type != "no" && this.data.quotas_string.length > 1) header = [...header, ...this.data.quotas_string];
			header.push("total");
			// console.log(header);
			return header;
		},
		stats: function() {
			return {
				gp: round(this.data.gp),
				clusters: (this.data.calc_type == "online" || this.data.calc_type == "gp") ? 0 : this.display_table.length
			};
		},
		cities_correspondence: function() {
			console.log(this.data.cities_correspondence);
			if (this.data.calc_type == "online" || this.data.calc_type == "gp") {
				// const header = ["name", "rayon", "oblast", "type", "population", "script_id", "stratum region", "stratum type"].join("\t") + "\n";
				const header = ["name", "rayon", "oblast", "type", "population", "stratum region", "stratum type"].join("\t") + "\n";
				return header + this.data.cities_correspondence.filter(s => s.clusters.length > 0).map(
					s => s.clusters.map(
						// c => [c.name, c.rayon, c.oblast, c.type, round(c.population), c.script_id, c.stratum_def.region, c.stratum_def.type].join("\t")
						c => [c.name, c.rayon, c.oblast, c.type, c.population, c.stratum_region, c.stratum_type].join("\t")
					).join("\n")
				).join("\n");
			}
			return "";
		},
		result_text: function() {
			let text = "";
			text += this.query + "\n";
			text += "\n";
			text += "Генеральная совокупность\t" + this.stats.gp + "\n";
			if (!(this.data.calc_type == "online" || this.data.calc_type == "gp")) text += "Количество точек\t" + this.stats.clusters + "\n";
			text += "\n";
			text += this.result_header.join("\t") + "\n";
			text += this.display_table.map(a => a.join("\t")).join("\n");
			return text;
		}
	},
	methods: {
		calc_display_table: function() {
			if (this.data.calc_type == "cities" || this.data.calc_type == "gp_cities") {
				if (!this.data.cities) return;

				let t = [];

				for (let i = 0; i < this.data.cities.length; i++) {
					const a = this.data.cities[i];
					// let rec = [a.name, a.oblast, round(a.population), a.script_id];
					let rec = [a.name, a.oblast, a.population];
					if (this.rounded_quotas.length == 0) {
						rec = [...rec, ...Array(this.data.quotas_string.length + 1).fill("")];
					} else {
						if (this.rounded_quotas[i].length > 1) rec = [...rec, ...this.rounded_quotas[i]];
						rec.push(sum(this.rounded_quotas[i]));
					}
					t.push(rec);
				}

				this.display_table = t;
			}

			if (this.data.calc_type == "online" || this.data.calc_type == "gp") {
				if (!this.data.strata) return;

				let t = [];

				for (let i = 0; i < this.data.strata.length; i++) {
					const a = this.data.strata[i];
					let rec = [a.stratum_region, a.stratum_type];
					// console.log(a);
					if (this.rounded_quotas.length == 0) {
						rec = [...rec, ...Array(this.data.quotas_string.length + 1).fill("")];
					} else {
						if (this.rounded_quotas[i].length > 1) rec = [...rec, ...this.rounded_quotas[i]];
						rec.push(sum(this.rounded_quotas[i]));
					}
					t.push(rec);
				}

				this.display_table = t;
			}

			if (this.data.calc_type == "standard") {
				if (!this.data.strata) return;

				let t = [];

				let i = 0;

				for (const s of this.data.strata) {
					for (const c of s.sample_clusters) {
						// let rec = [c.name, c.rayon, c.oblast, c.type, round(c.population), c.script_id, c.stratum_def.region, c.stratum_def.type];
						let rec = [c.name, c.rayon, c.oblast, c.type, round(c.population), c.stratum_region, c.stratum_type];

						if (this.rounded_quotas.length == 0) {
							rec = [...rec, ...Array(this.data.quotas_string.length + 1).fill("")];
						} else {
							if (this.rounded_quotas[i].length > 1) rec = [...rec, ...this.rounded_quotas[i]];
							rec.push(sum(this.rounded_quotas[i]));
						}

						t.push(rec);

						i++;
					}
				}

				this.display_table = t;
			}
		},
		sort: function(col) {
			const index = this.result_header.indexOf(col);

			function cmp(i, ord) {
				return (a, b) => {
					if (a[i] > b[i]) return ord * 1;
					if (a[i] < b[i]) return ord * -1;
					return 0;
				}
			}

			let order_before = this.display_table.map(a => a[index]).join("\n");

			this.display_table = this.display_table.sort(cmp(index, 1));

			let order_after = this.display_table.map(a => a[index]).join("\n");

			if (order_before == order_after) this.display_table = this.display_table.sort(cmp(index, -1));
		},
		copy: function(x) {
			let node = $$(".hidden-textarea");

			if (x == "cities_correspondence") node.value = this.cities_correspondence;
			if (x == "table") node.value = this.result_text;

			node.focus();
			node.select();
			document.execCommand("copy");
			node.blur();
		}
	},
	watch: {
		data: function() {
			this.rounded_quotas.length = 0;
			this.calc_display_table();

			let quota_to_round = [];

			if (this.data.quota_type != "no" && this.data.calc_type == "cities") quota_to_round = this.data.cities.map(a => a.sample_raw_quotas);
			if (this.data.quota_type == "no" && this.data.calc_type == "cities") quota_to_round = this.data.cities.map(a => [a.sample_raw]);
			if (this.data.quota_type != "no" && this.data.calc_type == "online") quota_to_round = this.data.strata.map(a => a.quotas_sample);
			if (this.data.quota_type == "no" && this.data.calc_type == "online") quota_to_round = this.data.strata.map(a => [a.sample]);
			if (this.data.quota_type != "no" && this.data.calc_type == "standard") quota_to_round = [].concat(...this.data.strata.map(s => s.sample_clusters.map(a => a.real_quotas)));
			if (this.data.quota_type == "no" && this.data.calc_type == "standard") quota_to_round = [].concat(...this.data.strata.map(s => s.sample_clusters.map(a => [a.sample_raw])));

			if (this.data.quota_type != "no" && this.data.calc_type == "gp_cities") this.rounded_quotas = this.data.cities.map(a => a.gp_quotas.map(b => round(b)));
			if (this.data.quota_type == "no" && this.data.calc_type == "gp_cities") this.rounded_quotas = this.data.cities.map(a => [round(a.gp)]);
			if (this.data.quota_type != "no" && this.data.calc_type == "gp") quota_to_round = this.data.strata.map(a => a.quotas_gp);
			if (this.data.quota_type == "no" && this.data.calc_type == "gp") quota_to_round = this.data.strata.map(a => [a.gp]);

			if (quota_to_round.length > 0) {
				// huh?
				// worker.postMessage(quota_to_round);
				worker.postMessage(JSON.parse(JSON.stringify((quota_to_round))));
			} else {
				this.calc_display_table();
			}
		}
	},
	mounted: function() {
		worker.addEventListener("message", xs => {
			this.rounded_quotas = xs.data;
			this.calc_display_table();
		});
	},
	template: "#result-block"
}



let app = {};

app.data = function() {
	return {
		sample_params: {
			"calc_type": "online",
			"calc_type_quotas": true,
			"calc_type_gender_split": true,
			"calc_type_age_split": true,
			"base": "2020w2_war",
			"oblasts": [
				"Вінницька",
				"Волинська",
				"Дніпропетровська",
				"Донецька",
				"Житомирська",
				"Закарпатська",
				"Запорізька",
				"Івано-Франківська",
				"Київ",
				"Київська",
				"Кіровоградська",
				"Луганська",
				"Львівська",
				"Миколаївська",
				"Одеська",
				"Полтавська",
				"Рівненська",
				"Сумська",
				"Тернопільська",
				"Харківська",
				"Херсонська",
				"Хмельницька",
				"Черкаська",
				"Чернівецька",
				"Чернігівська"
			],
			"not_is_ato": true,
			"cities": ["Київ", "Харків", "Одеса", "Дніпро", "Львів"],
			"types": ["Місто", "СМТ"],
			"population more than": 0,
			"population less than": 0,
			"regions": {
				"АР Крим": "Юг",
				"Вінницька": "Центр",
				"Волинська": "Запад",
				"Дніпропетровська": "Восток",
				"Донецька": "Восток",
				"Житомирська": "Север",
				"Закарпатська": "Запад",
				"Запорізька": "Восток",
				"Івано-Франківська": "Запад",
				"Київ": "Киев",
				"Київська": "Север",
				"Кіровоградська": "Центр",
				"Луганська": "Восток",
				"Львівська": "Запад",
				"Миколаївська": "Юг",
				"Одеська": "Юг",
				"Полтавська": "Центр",
				"Рівненська": "Запад",
				"Сумська": "Восток",
				"Тернопільська": "Запад",
				"Харківська": "Восток",
				"Херсонська": "Юг",
				"Хмельницька": "Запад",
				"Черкаська": "Центр",
				"Чернівецька": "Запад",
				"Чернігівська": "Север"
			},
			"no_type_stratification": false,
			"split points": [500, 50],
			"is_smt_split": false,
			"split point names": ["500k+", "500k-50k", "50k-"],
			"gender": ["m", "f"],
			"age more than": 18,
			"age less than": 55,
			"age breakpoints": [],
			"age intervals": {
				16: "16-55",
				17: "16-55",
				18: "16-55",
				19: "16-55",
				20: "16-55",
				21: "16-55",
				22: "16-55",
				23: "16-55",
				24: "16-55",
				25: "16-55",
				26: "16-55",
				27: "16-55",
				28: "16-55",
				29: "16-55",
				30: "16-55",
				31: "16-55",
				32: "16-55",
				33: "16-55",
				34: "16-55",
				35: "16-55",
				36: "16-55",
				37: "16-55",
				38: "16-55",
				39: "16-55",
				40: "16-55",
				41: "16-55",
				42: "16-55",
				43: "16-55",
				44: "16-55",
				45: "16-55",
				46: "16-55",
				47: "16-55",
				48: "16-55",
				49: "16-55",
				50: "16-55",
				51: "16-55",
				52: "16-55",
				53: "16-55",
				54: "16-55",
				55: "16-55"
			},
			"sample size": 400,
			"cluster size": 12
		},
		state: "off",
		query: {},
		data: {}
	}
}

app.components = {
	"param-block": param_block,
	"result-block": result_block
};

app.computed = {
	cities_show: function() {
		return (this.sample_params["calc_type"] == "cities" || this.sample_params["calc_type"] == "gp_cities");
	},
	quota_show: function() {
		return (!(this.sample_params["calc_type"] == "gp" || this.sample_params["calc_type"] == "gp_cities") && this.sample_params["calc_type_quotas"])
			|| ((this.sample_params["calc_type"] == "gp" || this.sample_params["calc_type"] == "gp_cities") && this.sample_params["calc_type_age_split"]);
	},
	cluster_show: function() {
		return this.sample_params["calc_type"] == "standard";
	},
	sample_size_show: function() {
		return this.sample_params["calc_type"] != "gp" && this.sample_params["calc_type"] != "gp_cities";
	}
};


app.methods = {
	calc: function() {
		// console.log(this.sample_params);
		// console.log(JSON.stringify(this.sample_params));
		// this.result.loading = true;
		this.state = "loading";
		let query = [...$$(".param-blocks").children].filter(a => a.style.display != "none").map(a => [a.querySelector(".param-name").textContent, a.querySelector(".param-string").textContent].join("\t")).join("\n");

		const res = sample_calc(this.sample_params);

		// console.log(res);

		this.state = "ready";
		this.query = query;
		this.data = res;


		// fetch_api("/api/sample_calc", this.sample_params)
		// 	.then(data => {
		// 		// console.log(data);
		// 		// this.result.loading = false;
		// 		// this.result.done = true;
		// 		this.state = "ready";
		// 		this.query = query;
		// 		this.data = data;
		// 	})
		// 	.catch(e => {
		// 		console.log("error catch:", e);
		// 		this.state = "error";
		// 		// this.result.loading = false;
		// 	}
		// );
	}
};




// const main = {
// 	data() {
// 		return {
// 			sample_params: {
// 				"calc_type": "online",
// 				"calc_type_quotas": true,
// 				"calc_type_gender_split": true,
// 				"calc_type_age_split": true,
// 				"base": "2020w2_war",
// 				"oblasts": [
// 					"Вінницька",
// 					"Волинська",
// 					"Дніпропетровська",
// 					"Донецька",
// 					"Житомирська",
// 					"Закарпатська",
// 					"Запорізька",
// 					"Івано-Франківська",
// 					"Київ",
// 					"Київська",
// 					"Кіровоградська",
// 					"Луганська",
// 					"Львівська",
// 					"Миколаївська",
// 					"Одеська",
// 					"Полтавська",
// 					"Рівненська",
// 					"Сумська",
// 					"Тернопільська",
// 					"Харківська",
// 					"Херсонська",
// 					"Хмельницька",
// 					"Черкаська",
// 					"Чернівецька",
// 					"Чернігівська"
// 				],
// 				"not_is_ato": true,
// 				"cities": ["Київ", "Харків", "Одеса", "Дніпро", "Львів"],
// 				"types": ["Місто", "СМТ", "Село"],
// 				"population more than": 0,
// 				"population less than": 0,
// 				"regions": {
// 					"АР Крим": "Юг",
// 					"Вінницька": "Центр",
// 					"Волинська": "Запад",
// 					"Дніпропетровська": "Восток",
// 					"Донецька": "Восток",
// 					"Житомирська": "Север",
// 					"Закарпатська": "Запад",
// 					"Запорізька": "Восток",
// 					"Івано-Франківська": "Запад",
// 					"Київ": "Киев",
// 					"Київська": "Север",
// 					"Кіровоградська": "Центр",
// 					"Луганська": "Восток",
// 					"Львівська": "Запад",
// 					"Миколаївська": "Юг",
// 					"Одеська": "Юг",
// 					"Полтавська": "Центр",
// 					"Рівненська": "Запад",
// 					"Сумська": "Восток",
// 					"Тернопільська": "Запад",
// 					"Харківська": "Восток",
// 					"Херсонська": "Юг",
// 					"Хмельницька": "Запад",
// 					"Черкаська": "Центр",
// 					"Чернівецька": "Запад",
// 					"Чернігівська": "Север"
// 				},
// 				"no_type_stratification": false,
// 				"split points": [500, 50],
// 				"is_smt_split": false,
// 				"split point names": ["500k+", "500k-50k", "50k-"],
// 				"gender": ["m", "f"],
// 				"age more than": 18,
// 				"age less than": 55,
// 				"age breakpoints": [],
// 				"age intervals": {
// 					16: "16-55",
// 					17: "16-55",
// 					18: "16-55",
// 					19: "16-55",
// 					20: "16-55",
// 					21: "16-55",
// 					22: "16-55",
// 					23: "16-55",
// 					24: "16-55",
// 					25: "16-55",
// 					26: "16-55",
// 					27: "16-55",
// 					28: "16-55",
// 					29: "16-55",
// 					30: "16-55",
// 					31: "16-55",
// 					32: "16-55",
// 					33: "16-55",
// 					34: "16-55",
// 					35: "16-55",
// 					36: "16-55",
// 					37: "16-55",
// 					38: "16-55",
// 					39: "16-55",
// 					40: "16-55",
// 					41: "16-55",
// 					42: "16-55",
// 					43: "16-55",
// 					44: "16-55",
// 					45: "16-55",
// 					46: "16-55",
// 					47: "16-55",
// 					48: "16-55",
// 					49: "16-55",
// 					50: "16-55",
// 					51: "16-55",
// 					52: "16-55",
// 					53: "16-55",
// 					54: "16-55",
// 					55: "16-55"
// 				},
// 				"sample size": 400,
// 				"cluster size": 12
// 			},
// 			state: "off",
// 			query: {},
// 			data: {}
// 		}
// 	},
// 	components: {
// 		"param-block": param_block,
// 		"result-block": result_block
// 	},
// 	computed: {
// 		cities_show: function() {
// 			return (this.sample_params["calc_type"] == "cities" || this.sample_params["calc_type"] == "gp_cities");
// 		},
// 		quota_show: function() {
// 			return (!(this.sample_params["calc_type"] == "gp" || this.sample_params["calc_type"] == "gp_cities") && this.sample_params["calc_type_quotas"])
// 				|| ((this.sample_params["calc_type"] == "gp" || this.sample_params["calc_type"] == "gp_cities") && this.sample_params["calc_type_age_split"]);
// 		},
// 		cluster_show: function() {
// 			return this.sample_params["calc_type"] == "standard";
// 		},
// 		sample_size_show: function() {
// 			return this.sample_params["calc_type"] != "gp" && this.sample_params["calc_type"] != "gp_cities";
// 		}
// 	},
// 	methods: {
// 		calc: function() {
// 			// console.log(this.sample_params);
// 			// console.log(JSON.stringify(this.sample_params));
// 			// this.result.loading = true;
// 			this.state = "loading";
// 			let query = [...$$(".param-blocks").children].filter(a => a.style.display != "none").map(a => [a.querySelector(".param-name").textContent, a.querySelector(".param-string").textContent].join("\t")).join("\n");
// 			fetch_api("/api/sample_calc", this.sample_params)
// 				.then(data => {
// 					// console.log(data);
// 					// this.result.loading = false;
// 					// this.result.done = true;
// 					this.state = "ready";
// 					this.query = query;
// 					this.data = data;
// 				})
// 				.catch(e => {
// 					console.log("error catch:", e);
// 					this.state = "error";
// 					// this.result.loading = false;
// 				}
// 			);
// 		}
// 	}
// };

Vue.createApp(app).mount(".vue");
// Vue.createApp(main).mount(".vue");

// $$(".button-calc").addEventListener("click", () => log_event({"event": "sample_calc"}));

// lc 581
