$module.factory("randomPick", function() {

	return function randomPick(array) {
		return array[parseInt(Math.random() * array.length)]
	}

});

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
		["You have seen a man fall down on the roof. You didn't panic and called 911 right away.", ""],
		["", ""],

		["Nine-one-one operator. What's your emergency?"],
		["I saw a man has fallen off the roof.", "당신이 목격한 것을 911에 알려주세요.", '"어떤 남자가 지붕에서 떨어졌어요."'],
		["Okay. Where are you now?", ""],

		["I'm at the LG Science Park.", "현재 위치를 알려주세요.", '"저는 LG사이언스파크에 있습니다."'],
		["We will send paramedics immediately. Let me know about his injury."],
		["It seems like he broke his left leg", "그가 어디를 다쳤는지 자세히 알려주세요.", '"그의 왼쪽 다리가 부러진 것 같아요."'],

		["All right. Do not let him move, stand, or sit up. Thank you for calling."],
		["Thank you", "미션이 종료되었습니다.", "미션이 종료되었습니다."],
	];








	// return DB3;


	// return randomPick([DB2, DB3, DB4]);

	return DB911;
});