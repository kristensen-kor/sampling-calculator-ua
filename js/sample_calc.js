function convertToArrayOfObjects(db) {
	let keys = Object.keys(db);
	let result = [];

	for (let i = 0; i < db[keys[0]].length; i++) {
		result.push(Object.fromEntries(keys.map(key => [key, db[key][i]])));
	}

	return result;
}

function quotas_sort(xs) {
	let ys = {};

	for (x of xs) {
		ys[x.split(/[+-]/)[0]] = x;
	}

	return Object.keys(ys).map(Number).toSorted((a, b) => a - b).map(a => ys[a]);
}

function sample_calc(sample_params) {
	let p = {};

	p.is_gp_calc = ["gp", "gp_cities"].includes(sample_params["calc_type"]);
	p.is_cities_calc = ["cities", "gp_cities"].includes(sample_params["calc_type"]);
	p.is_strata_calc = ["online", "gp"].includes(sample_params["calc_type"]);


	p.quota_type = "no"
	if (!p.is_gp_calc && sample_params["calc_type_quotas"]) p.quota_type = "full";
	if (p.is_gp_calc && sample_params["calc_type_gender_split"] && sample_params["calc_type_age_split"]) p.quota_type = "full";
	if (p.is_gp_calc && sample_params["calc_type_gender_split"] && !sample_params["calc_type_age_split"]) p.quota_type = "gender";
	if (p.is_gp_calc && !sample_params["calc_type_gender_split"] && sample_params["calc_type_age_split"]) p.quota_type = "age";


	p.quotas_string = [];
	if (["full", "gender"].includes(p.quota_type)) p.quotas_string = quotas_sort(Object.values(sample_params["age intervals"])).flatMap(a => sample_params["gender"].map(b => `${b.toUpperCase()} ${a}`));
	if (["age", "no"].includes(p.quota_type)) p.quotas_string = quotas_sort(Object.values(sample_params["age intervals"]));


	let local_main_db = convertToArrayOfObjects(db_main);
	let local_age_db = convertToArrayOfObjects(db_age);

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

	if (p.is_cities_calc) {
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

	{
		let total_sum = {};

		for (const key of used_key_join_age) {
			total_sum[key] = sum(local_age_db.filter(x => x.key_join_age == key).map(x => x.cnt));
		}

		for (let x of local_age_db) {
			x.frac = x.cnt / total_sum[x.key_join_age];
		}

		for (let x of local_age_db) {
			if (["full", "gender"].includes(p.quota_type)) x.quota = `${x.gender.toUpperCase()} ${sample_params["age intervals"][x.age]}`;
			if (["age", "no"].includes(p.quota_type)) x.quota = sample_params["age intervals"][x.age];
		}

		const unique_quota = [...new Set(local_age_db.map(x => x.quota))];

		for (const key of used_key_join_age) {
			quotas[key] = {};

			for (const quota of unique_quota) {
				if (p.quota_type != "no") {
					quotas[key][quota] = sum(local_age_db.filter(x => x.key_join_age == key && x.quota == quota).map(x => x.frac));
				} else {
					quotas[key][quota] = 1;
				}
			}
		}
	}




	for (let x of local_main_db) {
		x.gp = x.population * frac[x.key_join_age];
	}

	const gp_sum = sum(local_main_db.map(x => x.gp));


	let local_strata_db = [];

	if (["standard", "online", "gp"].includes(sample_params["calc_type"])) {
		strata_object = {};

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

			if (!(stratum_def in strata_object)) strata_object[stratum_def] = {stratum_def, stratum_type, stratum_region, clusters: []};
			strata_object[stratum_def].clusters.push(x);
		}

		local_strata_db = Object.values(strata_object);

		for (let stratum of local_strata_db) {
			stratum.gp = sum(stratum.clusters.map(a => a.gp));
		}

		if (["online", "gp"].includes(sample_params["calc_type"])) {
			for (let stratum of local_strata_db) {
				for (let cluster of stratum.clusters) {
					cluster.real_quotas_gp = p.quotas_string.map(a => cluster.gp * quotas[cluster.key_join_age][a]);
				}

				stratum.quotas_gp = transpose(stratum.clusters.map(a => a.real_quotas_gp)).map(sum);
			}

			if (sample_params["calc_type"] == "online") {
				for (let stratum of local_strata_db) {
					stratum.quotas_sample = stratum.quotas_gp.map(a => a / gp_sum * sample_params["sample size"]);
				}
			}
		}
	}


	if (sample_params["calc_type"] == "gp_cities") {
		for (let x of local_main_db) {
			x.gp_quotas = p.quotas_string.map(a => x.gp * quotas[x.key_join_age][a]);
		}
	}


	// calc sample
	if (sample_params["calc_type"] == "cities") {
		for (let x of local_main_db) {
			x.sample_raw = x.gp / gp_sum * sample_params["sample size"];
			x.sample_raw_quotas = p.quotas_string.map(a => x.sample_raw * quotas[x.key_join_age][a]);
		}
	}



	if (sample_params["calc_type"] == "standard") {
		for (let stratum of local_strata_db) {
			stratum.sample = stratum.gp / gp_sum * sample_params["sample size"];
			stratum.cluster_count = stratum.clusters.length;
		}

		for (let stratum of local_strata_db) {
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

		for (let stratum of local_strata_db) {
			for (let cluster of stratum.sample_clusters) {
				cluster.real_quotas = p.quotas_string.map(a => cluster.real_sample * quotas[cluster.key_join_age][a]);
			}
		}
	}



	// round
	let quotas_to_round = [];
	let rounded_quotas = [];

	if (sample_params["calc_type"] == "cities") quotas_to_round = local_main_db.map(a => a.sample_raw_quotas);
	if (sample_params["calc_type"] == "online") quotas_to_round = local_strata_db.map(a => a.quotas_sample);
	if (sample_params["calc_type"] == "standard") quotas_to_round = local_strata_db.flatMap(s => s.sample_clusters.map(a => a.real_quotas));

	if (sample_params["calc_type"] == "gp_cities") rounded_quotas = local_main_db.map(a => a.gp_quotas.map(Math.round));
	if (sample_params["calc_type"] == "gp") rounded_quotas = local_strata_db.map(a => a.quotas_gp.map(Math.round));

	if (quotas_to_round.length > 0) rounded_quotas = to_matrix(lr_round(quotas_to_round.flat()), quotas_to_round.length);


	// result table
	let result_header = [];
	let display_table = [];

	if (p.is_cities_calc) {
		result_header = ["name", "oblast", "population"];
		display_table = local_main_db.map((a, i) => [a.name, a.oblast, a.population, ...rounded_quotas[i], sum(rounded_quotas[i])]);
	}

	if (p.is_strata_calc) {
		result_header = ["stratum region", "stratum type"];
		display_table = local_strata_db.map((a, i) => [a.stratum_region, a.stratum_type, ...rounded_quotas[i], sum(rounded_quotas[i])]);
	}

	if (sample_params["calc_type"] == "standard") {
		result_header = ["name", "rayon", "oblast", "type", "population", "stratum region", "stratum type"];

		display_table = local_strata_db.flatMap(s => s.sample_clusters.map(c => [c.name, c.rayon, c.oblast, c.type, c.population, c.stratum_region, c.stratum_type]));
		display_table = display_table.map((row, i) => [...row, ...rounded_quotas[i], sum(rounded_quotas[i])]);
	}

	result_header = [...result_header, ...p.quotas_string];

	result_header.push("total");



	let res = {};

	res["calc_type"] = sample_params["calc_type"];
	res["result_header"] = result_header;
	res["display_table"] = display_table;

	if (p.is_gp_calc) res["gp"] = sum(rounded_quotas.map(sum));
	if (!p.is_gp_calc) res["gp"] = round(gp_sum);

	res["cities_correspondence"] = "";

	if (p.is_strata_calc) {
		const header = ["name", "rayon", "oblast", "type", "population", "stratum region", "stratum type"];
		const data = local_strata_db.flatMap(stratum => stratum.clusters.map(c => [c.name, c.rayon, c.oblast, c.type, c.population, c.stratum_region, c.stratum_type]));
		res["cities_correspondence"] = [header, ...data].map(row => row.join("\t")).join("\n");
	}

	return res;
}

// lc 312
