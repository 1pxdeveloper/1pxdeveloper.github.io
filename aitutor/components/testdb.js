$module.factory("DB", function() {

	let DB = [
		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],
	];

	let DB2 = [
		["Last time, we completed all 'Travel' missions. Good job. I prepared missions about 'Sports' and 'Cafe' this time. What's your choice?", ""],
		["", ""],
		["Really? Then, let's talk about 'Cafe' with me. Are you ready?", ""],
		["", ""],

		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],

		["We completed all 'Cafe' missions. Hurray", ""],
		["", ""]
	];


	let DB3 = [
		["When I checked, we were on a 'Cafe' missions. Do you want to keep going?", ""],
		["", ""],
		["Great! So. let's talk about 'Cafe' Are you ready?", ""],
		["", ""],

		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],

		["Good Jobs. Perfect missions! If you want to talk about a diffrent topic, take a look!", ""],
		["", ""]
	];


	let DB4 = [
		["Hi. let's do our best. What will we talk about today? I am intersted in American drama these days. What are you especially interested in?", ""],
		["", ""],
		["Well, that's something I'm not familiar with. Why don't we talk about 'Cafe' today?", ""],
		["", ""],

		["What can I get for you?", "무엇을 도와드릴까요?"],
		["I’d like an americano, please.", "아메리카노 한 잔 주세요."],
		["What size would you like?", "어떤 사이즈로 드릴까요?"],
		["A small, please.", "작은 걸로 주세요."],
		["Anything else besides the drink?", "음료 말고 다른 거 필요하신 거 있으세요?"],
		["No, thanks. That’s all.", "괜찮아요. 그게 다에요."],

		["Good Jobs. Perfect missions! If you want to talk about a diffrent topic, take a look!", ""],
		["", ""]
	];

	function randomPick(array) {
		return array[parseInt(Math.random() * array.length)]
	}

	return randomPick([DB2, DB3, DB4]);

	// return DB;
});