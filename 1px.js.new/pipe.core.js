$module.pipe("uppercase", function() {
	return (value) => String(value).toUpperCase();
});


$module.pipe("number", function() {
	return (value) => Number.format(value);
});


$module.pipe("date", function() {
	return (value, format) => Date.format(format, value)
});