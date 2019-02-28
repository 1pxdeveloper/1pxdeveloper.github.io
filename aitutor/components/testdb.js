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
		["Last time, we completed all 'Travel' missions. I prepared missions about 'Sports' and 'Cafe' this time. What's your choice?", ""],

		["원하는 주제를 알려주세요.", "I would like to talk about _______."],
		["Really? Then, let's talk about 'Cafe' with me. Are you ready?", ""],
		["", "I an ready."],

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


	let DB911 = [
		[`Your father fell down while trying to fix the antenna on the roof. You didn't panic and called 911 right away.`, ""],
		["", ""],
		[`Nine-one-one operator. What's your emergency?`, "지금 어떤 상황인지 911에 알려주세요.", "아버지가 지붕에서 떨어졌어요."],
		["My father has fallen off the roof.", ""],
		["Off the roof? What's your address?", ""],

		["Uh, 242 Beatrice Lane.", "집 주소를 알려주세요.", "베아트리스가 242번지요."],
		["We will send paramedics immediately. Is he badly hurt?"],
		["It seems like he broke his leg.", "어디를 다쳤는지 자세히 알려주세요.", "그의 다리가 부러진 것 같아요."],
		["Okay. He shouldn't try to move, stand, or sit up."]
	];


	function randomPick(array) {
		return array[parseInt(Math.random() * array.length)]
	}

	// return DB3;


	// return randomPick([DB2, DB3, DB4]);

	return DB911;
});