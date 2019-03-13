$module.value("capitalize", function capitalize(str) {
		str = str || "";
		return str[0].toUpperCase() + str.slice(1);
	}
);


$module.value("$timeout", function $timeout(delay) {
		return new Promise(resolve => {
			setTimeout(resolve, delay);
		})
	}
);