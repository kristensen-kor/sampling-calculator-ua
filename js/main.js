import { createApp } from "./vue.esm-browser.js";
// import { createApp } from "./vue.esm-browser.prod.js";

import default_sample_params from "./default_sample_params.js";

let t0 = null;

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
			// console.log(this.data.cities_correspondence);
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

			console.log(performance.now() - t0);
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
			if (x == "cities_correspondence") copy_to_clipboard(this.cities_correspondence);
			if (x == "table") copy_to_clipboard(this.result_text);
		}
	},
	watch: {
		data: function() {
			this.rounded_quotas = this.data.rounded_quotas;
			this.calc_display_table();
		}
	},
	template: "#result-block"
}


let app_config = {};

app_config.data = function() {
	return {
		sample_params: default_sample_params,
		state: "off",
		query: {},
		data: {}
	}
}

app_config.components = {
	"param-block": param_block,
	"result-block": result_block
};

app_config.computed = {
	is_gp_calc: function() {
		return ["gp", "gp_cities"].includes(this.sample_params["calc_type"]);
	},
	cities_show: function() {
		return (this.sample_params["calc_type"] == "cities" || this.sample_params["calc_type"] == "gp_cities");
	},
	quota_show: function() {
		return (!this.is_gp_calc && this.sample_params["calc_type_quotas"]) || (this.is_gp_calc && this.sample_params["calc_type_age_split"]);
	},
	cluster_show: function() {
		return this.sample_params["calc_type"] == "standard";
	},
	sample_size_show: function() {
		return !this.is_gp_calc;
	}
};


app_config.methods = {
	calc: function() {
		t0 = performance.now();

		let query = [...$$(".param-blocks").children].filter(a => a.style.display != "none").map(a => [a.querySelector(".param-name").textContent, a.querySelector(".param-string").textContent].join("\t")).join("\n");

		const res = sample_calc(this.sample_params);

		this.query = query;
		this.data = res;
		this.state = "ready";
	}
};


const app = createApp(app_config);
app.mount("#app");


// lc 581
// lc 233
