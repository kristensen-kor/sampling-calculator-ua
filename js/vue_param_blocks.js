// function param_string_change3() {
// 	this.$emit("update:param_string", this.param_string_local);
// }

// function update_param(param_name) {
// 	return function(value) {
// 		this.$emit(`update:${param_name}`, value);
// 	}
// }

function bind_value(param_name) {
	return {
		get() {
			return this[param_name];
		},
		set(value) {
			this.$emit(`update:${param_name}`, value);
		}
	};
}

const p_calc_type_component = {
	props: ["param_string", "calc_type", "calc_type_quotas", "calc_type_gender_split", "calc_type_age_split"],
	data: function() {
		return {
			items: {
				online: "Выборка для Online/CATI",
				cities: "Выборка по конкретным городам",
				standard: "Выборка для F2F",
				gp: "Статистика по генеральной совокупности",
				gp_cities: "Статистика по городам",
				calc_type_quotas: "Квотная",
				calc_type_gender_split: "С разбивкой по полу",
				calc_type_age_split: "С разбивкой по возрасту"
			}
		};
	},
	computed: {
		v_calc_type: bind_value("calc_type"),
		v_calc_type_quotas: bind_value("calc_type_quotas"),
		v_calc_type_gender_split: bind_value("calc_type_gender_split"),
		v_calc_type_age_split: bind_value("calc_type_age_split"),
		show_quotas_options_checkbox: function() {
			return (["gp", "gp_cities"].includes(this.v_calc_type)) ? false : true;
		},
		show_gp_options_checkbox: function() {
			return !this.show_quotas_options_checkbox;
		},
		param_string_local: function() {
			let s = this.items[this.v_calc_type];
			if (["gp", "gp_cities"].includes(this.v_calc_type)) {
				s += (this.v_calc_type_gender_split ? ", с разбивкой по полу" : "") + (this.v_calc_type_age_split ? ", с разбивкой по возрасту" : "");
			} else {
				s += ", " + (this.v_calc_type_quotas ? "квотная" : "случайная");
			}
			return s;
		}
	},
	watch: {
		param_string_local: function() {
			this.$emit("update:param_string", this.param_string_local);
		}
	},
	mounted: function() {
		this.$emit("update:param_string", this.param_string_local);
	},
	template: "#p_calc_type-component"
};

const p_base_component = {
	props: ["param_string", "param"],
	data: function() {
		return {
			options: [
				{value: "2024v1", text: "2024-06 update"}
			]
		};
	},
	computed: {
		v_base: {
			get: function() {
				let value = this.param;
				this.$emit("update:param_string", this.options.filter(a => a.value == value)[0].text);
				return value;
			},
			set: function(value) {
				this.$emit("update:param", value);
			}
		}
	},
	template: `
		<div>
			<label v-for="option in options">
				<input type="radio" v-model="v_base" name="f_base" :value="option.value">{{ option.text }}
			</label>
		</div>`
};


const p_oblasts_component = {
	props: ["param_string", "param"],
	data: function() {
		return {
			oblasts: [
				"АР Крим",
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
			unavailable: [
				"АР Крим",
				"Луганська"
			]
		};
	},
	computed: {
		selected: {
			get: function() {
				const value = this.param;

				let ps = value.join(", ");

				const excluded = this.oblasts.filter(a => !value.includes(a));

				if (excluded.length <= 4) {
					ps = "Все";

					if (excluded.length > 0) {
						ps += ", кроме " + excluded.join(", ");
					}
				}

				this.$emit("update:param_string", ps);

				return value;
			},
			set: function(value) {
				this.$emit("update:param", value);
			}
		}
	},
	methods: {
		select_all: function() {
			this.selected = this.oblasts.filter(x => !this.unavailable.includes(x));
		},
		clear_selection: function() {
			this.selected = [];
		}
	},
	template: "#p_oblasts-component"
};


const p_types_component = {
	props: ["param_string", "param"],
	computed: {
		selected: {
			get: function() {
				const value = this.param;
				this.$emit("update:param_string", value.length == 3 ? "Все" : value.join(", "));
				return value;
			},
			set: function(value) {
				this.$emit("update:param", value);
			}
		}
	},
	template: `
		<div>
			<label><input type="checkbox" v-model="selected" value="Місто">Город</label>
			<label><input type="checkbox" v-model="selected" value="СМТ">ПГТ</label>
			<label><input type="checkbox" v-model="selected" value="Село" disabled>Село</label>
		</div>`
};


const p_cities_component = {
	props: ["param_string", "param"],
	data: function() {
		return {
			cities : []
		};
	},
	computed: {
		selected_cities: {
			get: function() {
				let value = this.param;
				this.$emit("update:param_string", value.join(", "));
				return value;
			},
			set: function(value) {
				this.$emit("update:param", value);
			}
		}
	},
	methods: {
		clear_selection: function() {
			this.selected_cities = [];
		},
		select_centers: function() {
			this.selected_cities = this.cities.filter(a => a[4] == "✓").map(a => a[1]);
		}
	},
	mounted: function () {
		const cities_data = [
			"city_01\tКиїв\tКиїв\t2769559\t✓",
			"city_02\tХарків\tХарківська\t1333160\t✓",
			"city_03\tОдеса\tОдеська\t947987\t✓",
			"city_04\tДніпро\tДніпропетровська\t908554\t✓",
			"city_07\tЛьвів\tЛьвівська\t672875\t✓",
			"city_06\tЗапоріжжя\tЗапорізька\t666101\t✓",
			"city_08\tКривий Ріг\tДніпропетровська\t566523\t",
			"city_09\tМиколаїв\tМиколаївська\t440918\t✓",
			"city_12\tВінниця\tВінницька\t346853\t✓",
			"city_18\tЧернігів\tЧернігівська\t265246\t✓",
			"city_17\tПолтава\tПолтавська\t262287\t✓",
			"city_22\tХмельницький\tХмельницька\t257464\t✓",
			"city_19\tЧеркаси\tЧеркаська\t253134\t✓",
			"city_23\tЧернівці\tЧернівецька\t247938\t✓",
			"city_20\tЖитомир\tЖитомирська\t245430\t✓",
			"city_21\tСуми\tСумська\t240599\t✓",
			"city_25\tРівне\tРівненська\t228778\t✓",
			"city_28\tІвано-Франківськ\tІвано-Франківська\t223452\t✓",
			"city_26\tКам'янське\tДніпропетровська\t212804\t",
			"city_30\tТернопіль\tТернопільська\t211077\t✓",
			"city_27\tКропивницький\tКіровоградська\t206078\t✓",
			"city_31\tЛуцьк\tВолинська\t202617\t✓",
			"city_29\tКременчук\tПолтавська\t201946\t",
			"city_32\tБіла Церква\tКиївська\t194443\t",
			"city_36\tУжгород\tЗакарпатська\t108303\t✓",
			"city_16\tХерсон\tХерсонська\t66991\t✓",
			"city_33\tКраматорськ\tДонецька\t35315\t"
		]

		this.cities = cities_data.map(a => a.split("\t"));
	},
	template: "#p_cities-component"
};


const p_population_component = {
	props: ["param_string", "population_more_than", "population_less_than"],
	data: function() {
		return {
			lt_enabled: false
		};
	},
	computed: {
		gt: bind_value("population_more_than"),
		lt: bind_value("population_less_than"),
		selected: {
			get: function() {
				return [0, 20, 50, 100, 200, 500].includes(this.population_more_than) ? this.population_more_than : "other";
			},
			set: function(value) {
				if (value != "other") this.gt = Number(value);
			}
		},
		ps: function() {
			let value = "Все";
			if (this.gt != 0 || this.lt != 0) {
				value = this.gt + "k+";
				if (this.lt_enabled && this.lt != 0) value += ", но меньше " + this.lt + "k";
			}
			return value;
		}
	},
	watch: {
		ps: {
			handler: function(value) {
				this.$emit("update:param_string", value);
			},
			immediate: true
		},
		lt_enabled: function(value) {
			if (!value) this.lt = 0;
		}
	},
	template: "#p_population-component"
};


const p_strata_region_component = {
	props: ["param_string", "param"],
	data: function() {
		return {
			oblasts: [
				{name: "АР Крим", r6: "Юг", r11: "АР Крым", ro: "", rc: ""},
				{name: "Вінницька", r6: "Центр", r11: "Центр", ro: "", rc: ""},
				{name: "Волинська", r6: "Запад", r11: "Северо-Запад", ro: "", rc: ""},
				{name: "Дніпропетровська", r6: "Восток", r11: "Юго-Восток", ro: "", rc: ""},
				{name: "Донецька", r6: "Восток", r11: "Восток", ro: "", rc: ""},
				{name: "Житомирська", r6: "Север", r11: "Север", ro: "", rc: ""},
				{name: "Закарпатська", r6: "Запад", r11: "Юго-Запад", ro: "", rc: ""},
				{name: "Запорізька", r6: "Восток", r11: "Юго-Восток", ro: "", rc: ""},
				{name: "Івано-Франківська", r6: "Запад", r11: "Запад", ro: "", rc: ""},
				{name: "Київ", r6: "Киев", r11: "Киев", ro: "", rc: ""},
				{name: "Київська", r6: "Север", r11: "Север", ro: "", rc: ""},
				{name: "Кіровоградська", r6: "Центр", r11: "Центр", ro: "", rc: ""},
				{name: "Луганська", r6: "Восток", r11: "Восток", ro: "", rc: ""},
				{name: "Львівська", r6: "Запад", r11: "Запад", ro: "", rc: ""},
				{name: "Миколаївська", r6: "Юг", r11: "Юг", ro: "", rc: ""},
				{name: "Одеська", r6: "Юг", r11: "Юг", ro: "", rc: ""},
				{name: "Полтавська", r6: "Центр", r11: "Центр", ro: "", rc: ""},
				{name: "Рівненська", r6: "Запад", r11: "Северо-Запад", ro: "", rc: ""},
				{name: "Сумська", r6: "Восток", r11: "Северо-Восток", ro: "", rc: ""},
				{name: "Тернопільська", r6: "Запад", r11: "Запад", ro: "", rc: ""},
				{name: "Харківська", r6: "Восток", r11: "Северо-Восток", ro: "", rc: ""},
				{name: "Херсонська", r6: "Юг", r11: "Юг", ro: "", rc: ""},
				{name: "Хмельницька", r6: "Запад", r11: "Северо-Запад", ro: "", rc: ""},
				{name: "Черкаська", r6: "Центр", r11: "Центр", ro: "", rc: ""},
				{name: "Чернівецька", r6: "Запад", r11: "Юго-Запад", ro: "", rc: ""},
				{name: "Чернігівська", r6: "Север", r11: "Север", ro: "", rc: ""}
			],
			selected: "6"
		};
	},
	methods: {
		check_regions: function() {
			this.selected = "custom";
			if (this.oblasts.every(a => a.rc == "")) this.selected = "none";
			if (this.oblasts.every(a => a.rc == a.r6)) this.selected = "6";
			if (this.oblasts.every(a => a.rc == a.r11)) this.selected = "11";
			if (this.oblasts.every(a => a.rc == a.name)) this.selected = "obl";
		}
	},
	watch: {
		selected: {
			handler: function(value) {
				if (value == "none") this.oblasts.forEach(a => a.rc = "");
				if (value == "6") this.oblasts.forEach(a => a.rc = a.r6);
				if (value == "11") this.oblasts.forEach(a => a.rc = a.r11);
				if (value == "obl") this.oblasts.forEach(a => a.rc = a.name);
			},
			immediate: true
		},
		oblasts: {
			handler: function() {
				let param_string = this.oblasts.map(a => a.name + ": " + a.rc).join(", ");
				if (this.selected == "none") param_string = "Не используется";
				if (this.selected == "6") param_string = "Стандартные 6";
				if (this.selected == "11") param_string = "Стандартные 11";
				if (this.selected == "obl") param_string = "По областям";

				this.$emit("update:param_string", param_string);
				this.$emit("update:param", Object.assign({}, ...this.oblasts.map(a => ({[a.name]: a.rc}))));
			},
			deep: true,
			immediate: true
		}
	},
	template: "#p_strata_region-component"
}


const p_strata_type_component = {
	props: ["param_string", "param"],
	data: function() {
		return {
			break_points: [50, 500],
			no_stratification: false,
			split_smt: false
		};
	},
	computed: {
		break_points_sorted: function() {
			return [...new Set(this.break_points.filter(a => a != ""))].sort((a, b) => b - a);
		},
		names: function() {
			let names = [];
			const bps = this.break_points_sorted;

			if (bps.length > 0) names = [`${bps[0]}k+`, ...iota(bps.length - 1).flatMap(i => [`${bps[i + 1]}k-${bps[i]}k`]), `${bps.at(-1)}k-`];

			if (this.split_smt) names.push("ПГТ");

			return names;
		},
		ps: function() {
			if (this.no_stratification) return "Не используется";
			if (this.split_smt && this.break_points.length == 0) return "Города, ПГТ, сёла";
			if (!this.split_smt && this.break_points.length == 0) return "Городcкие и сельские населённые пункты";

			return this.names.join(", ");
		}
	},
	methods: {
		add_break_point: function() {
			this.break_points.push("");
		},
		remove: function(i) {
			this.break_points.splice(i, 1);
		}
	},
	watch: {
		ps: {
			handler: function(value) {
				this.$emit("update:param_string", value);

				if (this.no_stratification) {
					this.$emit("update:param", {"no_type_stratification": true});
				} else {
					this.$emit("update:param", {"no_type_stratification": false, "split_points": this.break_points_sorted, "split_point_names": this.names, "is_smt_split": this.split_smt});
				}
			},
			immediate: true
		}
	},
	template: "#p_strata_type-component"
}


const p_gender_component = {
	props: ["param_string", "param"],
	computed: {
		selected: {
			get: function() {
				const value = this.param;

				let ps = "Все";
				if (value.length == 1 && value.includes("m")) ps = "Мужчины";
				if (value.length == 1 && value.includes("f")) ps = "Женщины";

				this.$emit("update:param_string", ps);

				return value;
			},
			set: function(value) {
				if (value.length == 0) value = this.param.includes("m") ? ["f"] : ["m"];
				this.$emit("update:param", value);
			}
		}
	},
	template: `
		<div>
			<label><input type="checkbox" v-model="selected" value="m">Мужчины</label>
			<label><input type="checkbox" v-model="selected" value="f">Женщины</label>
		</div>`
}


const p_age_component = {
	props: ["param_string", "age_more_than", "age_less_than"],
	computed: {
		gte: {
			get: function() {
				return this.age_more_than;
			},
			set: function(value) {
				if (value <= this.lte) this.$emit("update:age_more_than", value);
			}
		},
		lte: {
			get: function() {
				return this.age_less_than;
			},
			set: function(value) {
				if (value >= this.gte) this.$emit("update:age_less_than", value);
			}
		},
		ps: function() {
			return this.gte + (this.lte == 80 ? "+" : "-" + this.lte);
		}
	},
	watch: {
		ps: {
			handler(value) {
				this.$emit("update:param_string", value);
			},
			immediate: true
		}
	},
	template: "#p_age-component"
}


const p_age_intervals_component = {
	props: ["param_string", "param", "age_more_than", "age_less_than"],
	data: function() {
		return {
			age_intervals: []
		};
	},
	computed: {
		pairs: function() {
			const age_breakpoints = this.age_intervals.filter(a => a.selected && a.show_edge).map(a => a.value);
			const unrolled_array = [this.age_more_than, ...age_breakpoints.flatMap(a => [a, a + 1]), this.age_less_than];

			return iota(unrolled_array.length / 2).map(i => unrolled_array.slice(i * 2, i * 2 + 2));
		},
		strings: function() {
			return this.pairs.map(a => a[1] == 80 ? a[0] + "+" : a.join("-"));
		},
		age_intervals_corr: function() {
			let res = {};
			let si = 0;

			for (let i = this.age_more_than; i <= this.age_less_than; i++) {
				res[i] = this.strings[si];
				if (i == this.pairs[si][1]) si++;
			}

			return res;
		}
	},
	watch: {
		age_more_than: function() {
			this.update_range();
		},
		age_less_than: function() {
			this.update_range();
		},
		age_intervals_corr: function(value) {
			this.$emit("update:param", value);
		},
		strings: function(value) {
			this.$emit("update:param_string", value.join(", "));
		}
	},
	methods: {
		update_range: function() {
			for (let a of this.age_intervals) {
				a.show_node = a.value >= this.age_more_than && a.value <= this.age_less_than;
				a.show_edge = a.value >= this.age_more_than && a.value <= this.age_less_than - 1;
			}
		},
		change_state: function(i) {
			this.age_intervals[i].selected = !this.age_intervals[i].selected;
		},
		reset: function() {
			this.age_intervals.forEach(a => a.selected = false);
		}
	},
	mounted: function() {
		this.age_intervals = iota(81).map(i => ({ value: i, selected: false }));

		this.update_range();
	},
	template: "#p_age_intervals-component"
}


const p_sample_size_component = {
	props: ["param_string", "param"],
	computed: {
		value: {
			get: function() {
				const value = this.param;
				this.$emit("update:param_string", value);
				return value;
			},
			set: function(value) {
				this.$emit("update:param", value);
			}
		}
	},
	template: `
		<div>
			<input type="number" style='width: 8ch;' min="0" v-model.number="value">
		</div>`
}


const p_cluster_size_component = {
	props: ["param_string", "param"],
	computed: {
		value: {
			get: function() {
				const value = this.param;
				this.$emit("update:param_string", value);
				return value;
			},
			set: function(value) {
				this.$emit("update:param", value);
			}
		}
	},
	template: `
	<div>
		<input type="number" style='width: 6ch;' min="0" v-model.number="value">
	</div>`
}


const param_block = {
	props: ["name_text", "param_string"],
	data: function() {
		return {
			is_opened: false
		};
	},
	methods: {
		controls_switch: function() {
			this.is_opened = !this.is_opened;
		}
	},
	template: "#param-block-component"
};

// lc 753
