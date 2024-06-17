import { createApp } from "./vue.esm-browser.js";
// import { createApp } from "./vue.esm-browser.prod.js";

import default_sample_params from "./default_sample_params.js";

const result_block = {
	props: ["state", "query", "data"],
	data: function() {
		return {
			display_table: this.data.display_table || [],
			sortKey: null,
			sortOrder: 1
		};
	},
	computed: {
		result_header: function() {
			return this.data.result_header;
		},
		stats: function() {
			return {
				gp: this.data.gp,
				clusters: (this.data.calc_type == "online" || this.data.calc_type == "gp") ? 0 : this.display_table.length
			};
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
		sort: function(index) {
			if (this.sortKey == index) {
				this.sortOrder *= -1;
			} else {
				this.sortKey = index;
				this.sortOrder = 1;
			}

			this.display_table.sort((a, b) => {
				if (a[index] < b[index]) return -1 * this.sortOrder;
				if (a[index] > b[index]) return 1 * this.sortOrder;
				return 0;
			});
		},
		copy: function(x) {
			if (x == "cities_correspondence") copy_to_clipboard(this.data.cities_correspondence);
			if (x == "table") copy_to_clipboard(this.result_text);
		}
	},
	watch: {
		"data.display_table": function(display_table) {
			this.display_table = display_table;
		}
	},
	template: "#result-block"
}


let app_config = {};

app_config.data = function() {
	return {
		sample_params: default_sample_params,
		param_strings: {},
		state: "off",
		query: {},
		data: {}
	}
}

app_config.components = {
	"param-block": param_block,
	"param-block2": param_block2,
	"p_calc_type-component": p_calc_type_component,
	"p_base-component": p_base_component,
	"p_oblasts_component": p_oblasts_component,
	"p_types-component": p_types_component,
	"p_cities-component": p_cities_component,
	"p_gender-component": p_gender_component,
	"p_age-component": p_age_component,
	"p_age_intervals-component": p_age_intervals_component,
	"p_sample_size-component": p_sample_size_component,
	"p_cluster_size-component": p_cluster_size_component,
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
		let query = [...$$(".param-blocks").children].filter(a => a.style.display != "none").map(a => [a.querySelector(".param-name").textContent, a.querySelector(".param-string").textContent].join("\t")).join("\n");

		const res = sample_calc(this.sample_params);

		this.query = query;
		this.data = res;
		this.state = "ready";
	}
};


const app = createApp(app_config);
app.mount("#app");

// custom buttons styling hack?
// document.addEventListener("click", function(event) {
// 	if (event.target.tagName == "BUTTON") event.target.blur();
// });

// wheel event fix
document.addEventListener("wheel", function(event) {
	if (event.target.type == "number") event.target.focus();
});

// lc 581
// lc 233
