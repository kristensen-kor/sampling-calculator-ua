

function sample_calc(sample_params) {
	let p = {};

	p.quota_type = "no"
	if (["standard", "online", "cities"].includes(sample_params["calc_type"]) && sample_params["calc_type_quotas"]) p.quota_type = "full";
	if (["gp", "gp_cities"].includes(sample_params["calc_type"]) && sample_params["calc_type_gender_split"] && sample_params["calc_type_age_split"]) p.quota_type = "full";
	if (["gp", "gp_cities"].includes(sample_params["calc_type"]) && sample_params["calc_type_gender_split"] && !sample_params["calc_type_age_split"]) p.quota_type = "gender";
	if (["gp", "gp_cities"].includes(sample_params["calc_type"]) && !sample_params["calc_type_gender_split"] && sample_params["calc_type_age_split"]) p.quota_type = "age";

	function quotas_sort(xs) {
		let ys = {};

		for (x of xs) {
			ys[x.split(/[+-]/)[0]] = x;
		}

		return Object.keys(ys).map(Number).toSorted((a, b) => a - b).map(a => ys[a]);
	}

	p.quotas_string = [];
	if (p.quota_type == "full") p.quotas_string = quotas_sort(Object.values(sample_params["age intervals"])).flatMap(a => sample_params["gender"].map(b => `${b.toUpperCase()} ${a}`));
	if (p.quota_type == "gender") p.quotas_string = sample_params["gender"].map(a => a.toUpperCase());
	if (p.quota_type == "age") p.quotas_string = quotas_sort(Object.values(sample_params["age intervals"]));



	let local_main_db = structuredClone(db_main2);
	let local_age_db = structuredClone(db_age2);

	if (["standard", "online", "gp"].includes(sample_params["calc_type"])) {
		local_main_db = local_main_db.filter(x => sample_params.oblasts.includes(x.oblast) && sample_params.types.includes(x.type));

		if (sample_params["population more than"] != 0) {
			const population_more = Number(sample_params["population more than"]) * 1000;
			local_main_db = local_main_db.filter(x => x.population >= population_more);
		}

		if (sample_params["population less than"] != 0) {
			const population_less = Number(sample_params["population less than"]) * 1000;
			local_main_db = local_main_db.filter(x => x.population <= population_less);
		}
	}

	if (["cities", "gp_cities"].includes(sample_params["calc_type"])) {
		local_main_db = local_main_db.filter(x => x.population >= 50000 && sample_params.cities.includes(x.name));
	}


	const used_key_join_age = [...new Set(local_main_db.map(x => x.key_join_age))];

	local_age_db = local_age_db.filter(x => used_key_join_age.includes(x.key_join_age));

	let total_sum = {};

	for (const key of used_key_join_age) {
		total_sum[key] = sum(local_age_db.filter(x => x.key_join_age == key).map(x => x.cnt));
	}

	local_age_db = local_age_db.filter(x => sample_params["gender"].includes(x.gender) && x.age >= sample_params["age more than"] && x.age <= sample_params["age less than"])

	let frac = {};

	for (const key of used_key_join_age) {
		frac[key] = sum(local_age_db.filter(x => x.key_join_age == key).map(x => x.cnt)) / total_sum[key];
	}



	let quotas = {};

	if (p.quota_type != "no") {
		let total_sum = {};

		for (const key of used_key_join_age) {
			total_sum[key] = sum(local_age_db.filter(x => x.key_join_age == key).map(x => x.cnt));
		}

		for (let x of local_age_db) {
			x.frac = x.cnt / total_sum[x.key_join_age];
		}

		for (let x of local_age_db) {
			if (p.quota_type == "full") x.quota = `${x.gender.toUpperCase()} ${sample_params["age intervals"][x.age]}`;
			if (p.quota_type == "gender") x.quota = x.gender.toUpperCase();
			if (p.quota_type == "age") x.quota = sample_params["age intervals"][x.age];
		}

		const unique_quota = [...new Set(local_age_db.map(x => x.quota))];

		for (const key of used_key_join_age) {
			quotas[key] = {};

			for (const quota of unique_quota) {
				quotas[key][quota] = sum(local_age_db.filter(x => x.key_join_age == key && x.quota == quota).map(x => x.frac));
			}
		}
	}


	for (let x of local_main_db) {
		x.gp = x.population * frac[x.key_join_age];
	}

	const gp_sum = sum(local_main_db.map(x => x.gp));


	strata = {};

	if (["standard", "online", "gp"].includes(sample_params["calc_type"])) {

		for (let x of local_main_db) {
			let stratum_region = sample_params["regions"][x.oblast];

			let stratum_type = "";

			if (!sample_params["no_type_stratification"]) {
				if (sample_params["split points"].length == 0) {
					stratum_type = sample_params["is_smt_split"] ? x.type : "Міські населені пункти";
				} else {
					if (sample_params["is_smt_split"] && x.type == "СМТ") {
						stratum_type = x.type;
					} else {
						stratum_type = sample_params["split point names"][0];
						for (let i = 0; i < sample_params["split points"].length; i++) {
							if (x.population < sample_params["split points"][i] * 1000) stratum_type = sample_params["split point names"][i + 1];
						}
					}
				}
			}

			stratum_def = JSON.stringify({stratum_region, stratum_type});

			x.stratum_region = stratum_region;
			x.stratum_type = stratum_type;
			x.stratum_def = stratum_def;

			if (!(stratum_def in strata)) strata[stratum_def] = {stratum_def, stratum_type, stratum_region, clusters: []};
			strata[stratum_def].clusters.push(x);
		}

		for (let stratum of Object.values(strata)) {
			stratum.gp = sum(stratum.clusters.map(a => a.gp));
		}

		if (["online", "gp"].includes(sample_params["calc_type"])) {
			if (p.quota_type != "no") {
				for (let s of Object.keys(strata)) {
					for (let x of strata[s].clusters) {
						x.real_quotas_gp = p.quotas_string.map(a => x.gp * quotas[x.key_join_age][a]);
					}

					strata[s].quotas_gp = transpose(strata[s].clusters.map(a => a.real_quotas_gp)).map(a => sum(a));
				}
			}

			if (sample_params["calc_type"] == "online") {
				for (let stratum of Object.values(strata)) {
					stratum.sample = stratum.gp / gp_sum * sample_params["sample size"];
					stratum.quotas_sample = stratum.quotas_gp.map(a => a / gp_sum * sample_params["sample size"]);
				}
			}
		}
	}




	if (sample_params["calc_type"] == "gp_cities" && p.quota_type != "no") {
		for (let x of local_main_db) {
			x.gp_quotas = p.quotas_string.map(a => x.gp * quotas[x.key_join_age][a]);
		}
	}


	// calc sample
	if (sample_params["calc_type"] == "cities") {
		for (let x of local_main_db) {
			x.sample_raw = x.gp / gp_sum * sample_params["sample size"];
		}
	}

	if (sample_params["calc_type"] == "cities" && p.quota_type != "no") {
		for (let x of local_main_db) {
			x.sample_raw_quotas = p.quotas_string.map(a => x.sample_raw * quotas[x.key_join_age][a]);
		}
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

	if (sample_params["calc_type"] == "standard") {
		for (let stratum of Object.values(strata)) {
			stratum.sample = stratum.gp / gp_sum * sample_params["sample size"];
			stratum.cluster_count = stratum.clusters.length;
		}

		for (let stratum of Object.values(strata)) {
			stratum.sample_clusters = [];

			if (stratum.sample / stratum.cluster_count >= sample_params["cluster size"]) {
				stratum.sample_clusters = stratum.clusters;
				for (cluster of stratum.sample_clusters) {
					cluster.real_sample = cluster.gp / gp_sum * sample_params["sample size"];
				}
			} else {
				const cnt = Math.max(1, round(stratum.sample / sample_params["cluster size"]));
				const sample = stratum.sample / cnt;

				let index_map = [];
				let weights = [];

				for (let i in stratum.clusters) {
					index_map.push(i);
					weights.push(stratum.clusters[i].gp);
				}

				for (let i = 0; i < cnt; i++) {
					const random_index = dice(weights);
					const real_index = index_map[random_index];

					stratum.sample_clusters.push(stratum.clusters[real_index]);

					weights[random_index] = 0;
				}

				for (let cluster of stratum.sample_clusters) {
					cluster.real_sample = sample;
				}
			}
		}

		if (p.quota_type != "no") {
			for (let stratum of Object.values(strata)) {
				for (let cluster of stratum.sample_clusters) {
					cluster.real_quotas = p.quotas_string.map(a => cluster.real_sample * quotas[cluster.key_join_age][a]);
					cluster.real_quotas_gp = p.quotas_string.map(a => cluster.gp * quotas[cluster.key_join_age][a]);
				}
			}
		}
	}

	const strata_export = Object.values(strata);

	// round
	let quotas_to_round = [];
	let rounded_quotas = [];

	if (p.quota_type != "no" && sample_params["calc_type"] == "cities") quotas_to_round = local_main_db.map(a => a.sample_raw_quotas);
	if (p.quota_type == "no" && sample_params["calc_type"] == "cities") quotas_to_round = local_main_db.map(a => [a.sample_raw]);
	if (p.quota_type != "no" && sample_params["calc_type"] == "online") quotas_to_round = strata_export.map(a => a.quotas_sample);
	if (p.quota_type == "no" && sample_params["calc_type"] == "online") quotas_to_round = strata_export.map(a => [a.sample]);
	if (p.quota_type != "no" && sample_params["calc_type"] == "standard") quotas_to_round = [].concat(...strata_export.map(s => s.sample_clusters.map(a => a.real_quotas)));
	if (p.quota_type == "no" && sample_params["calc_type"] == "standard") quotas_to_round = [].concat(...strata_export.map(s => s.sample_clusters.map(a => [a.sample_raw])));

	if (p.quota_type != "no" && sample_params["calc_type"] == "gp_cities") rounded_quotas = local_main_db.map(a => a.gp_quotas.map(b => round(b)));
	if (p.quota_type == "no" && sample_params["calc_type"] == "gp_cities") rounded_quotas = local_main_db.map(a => [round(a.gp)]);
	if (p.quota_type != "no" && sample_params["calc_type"] == "gp") rounded_quotas = strata_export.map(a => a.quotas_gp.map(b => round(b)));
	if (p.quota_type == "no" && sample_params["calc_type"] == "gp") rounded_quotas = strata_export.map(a => [round(a.gp)]);

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
		let cols = xs.length / rows;
		return Array.from({ length: rows }, (_, i) => xs.slice(i * cols, (i + 1) * cols));
	}

	if (quotas_to_round.length > 0) rounded_quotas = to_matrix(lr_round(quotas_to_round.flat()), quotas_to_round.length);



	let res = {};

	res["calc_type"] = sample_params.calc_type;
	res["quota_type"] = p.quota_type;
	res["quotas_string"] = p.quotas_string;
	res["rounded_quotas"] = rounded_quotas;

	res["gp"] = gp_sum;


	if (["cities", "gp_cities"].includes(sample_params.calc_type)) {
		res["cities"] = local_main_db;
	}

	if (["gp", "online"].includes(sample_params.calc_type)) {
		// res["cities_correspondence"] = strata.byValue.map!(s => s.clusters.filter!(c => c.type == "Місто").array).array.serializeToJson;
		res["cities_correspondence"] = strata_export;
	}

	if (["gp", "online", "standard"].includes(sample_params.calc_type)) {
		// strata.byValue.each!((ref s) => {s.clusters = null;}());
		res["strata"] = strata_export;
	}

	if (p.calc_type == "standard") {
		res["count"] = sum(strata_export.map(s => s.sample_clusters.length));
	}

	return res;

}

// lc 312


