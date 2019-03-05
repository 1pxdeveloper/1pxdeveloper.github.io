$module.factory("randomPick", function() {

	return function randomPick(array) {
		return array[parseInt(Math.random() * array.length)]
	}

});

$module.factory("DB", function(randomPick) {

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


	let DB_NEW = [

		[
			[
				"Greeting. What can I get for you?",
				"Sorry, What kind of coffee would you like?",
				"Well, Americano, Latte, Espresso or black coffee?",
			],

			["americano", "latte", "espresso", "black", "cappuccino"]
		],

		// ["I’d like an americano, please.", "아메리카노 한 잔 주세요."],

		[
			[
				"Okay, What size would you like?",
				"What size?",
				"Would you like the small, medium or large size?",
				"small, medium or large?"
			],

			["small", "medium", "large", "short", "grande", "tall", "venti"]
		],

		// ["A small, please.", "작은 걸로 주세요."],

		[
			[
				"Okay, Anything else besides the drink?",
				"Do you want anything else?",
				"anything else?"
			],

			["yes", "no"]
		],

		[
			[
				"Okay, And is that for here or to go?",
				"for here or to go?"
			],

			["here", "go"]
		],


		[
			[
				"Okay. Your total comes to $3.49. Do you want to pay in cash or credit card?",
				'Sorry. Are you paying with cash or credit?',
				'cash? or credit?',
			],

			["cash", "credit"]
		],


		[
			[
				"Great. We’ll call your number when your order is ready. You can pick it up at the counter over there, okay?",
				'We will call your number. Then, you come here. okay?',
			],

			["ok", "okay", "thanks", "thank you", "thank"]
		],


		[
			[
				'Okay, thanks',
			],

			["ok", "okay", "thanks", "thank you", "thank", "welcome", "bye"]
		]
	];


	let DB_BREAD = [

		[
			["Do you know what time it is?", "지금 시간을 알려주세요.", ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "sorry"]],
			["Sorry. I didn't catch that. What time is it now?", "지금 __시 __분이야.", ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "sorry"]],
			["All right. I'll just check it out myself", "미안해", ["sorry"]],
		],

		[
			["Okay... I'm so low on energy. I was not able to get lunch because of the meeting. Listen. My stomach is growling.", "먹을 것을 사다 준다고 제안해보세요.", ["to eat"]],
			["I mean I'm starving.", "베이글을 사다 준다고 제안해보세요.", ["eat", "bagel"]],
			["Did you hear me? There's nothing to eat here.", `"빵집에서 베이글이라도 좀 사올게."`, ["eat", "bagel"]],
			["Oh god. Get me some bagels. please.", `"알겠어."`, ["yes", "ok", "okay", "know", "bagel"]]
		],

		[
			["Thanks. Ah! I wish I had something to drink.", "어떤 음료를 원하는 지 물어보세요.", ["what", "drink", "beverage"]],
			["Excuse me? Could you buy me something to drink?", "어떤 음료를 원하는 지 물어보세요.", ["what", "drink", "beverage"]],
			["Hey! What's on your mind? I hope you bring me something to drink!", `"어떤 음료로 사올까?"`, ["what", "drink"]],
			["You can buy a beverage for me, right?", `"알겠어."`, ["yes", "ok", "okay", "sure"]]
		],

		["Umm... Buy milk if you can. Do me a favor."]
	];


	let DB_ABC = [

		[
			["Hello, What do you do in your free time?", "평소에 즐기는 취미를 말해보세요.", ["movie", "sing", "song", "listen", "music", "sport"]],
			["Sorry, I can hear that. What do you do? in your free time? What is your hobby?", "평소에 즐기는 취미를 말해보세요.", ["movie", "sing", "song", "lister", "music", "sport"]],
			["Hmm...? then.. which do you like watch movie, to sing a song? or...", "평소에 즐기는 취미를 말해보세요.", ["movie", "sing", "song", "lister", "music", "sport"]],
			["read books, playing guitar, or listen to music? or...", "평소에 즐기는 취미를 말해보세요.", ["movie", "sing", "song", "lister", "music", "sport"]],
			["I like drawing. Do you like drawing?", "평소에 즐기는 취미를 말해보세요.", ["yes", "okay", "ok"]],
		],

		[
			["Oh, do you? How often do you do it?", "얼마나 자주 하는지 알려주세요.", ["every", "day", "week", "once", "twice"]],
			["Pardon? How often do you do?", "얼마나 자주 하는지 알려주세요.", ["every", "day", "week", "once", "twice"]],
			["Sorry. How often?", "얼마나 자주 하는지 알려주세요.", ["every", "day", "week", "once", "twice"]],
			["I try to draw once a week. How about you?", "얼마나 자주 하는지 알려주세요.", ["every", "day", "week", "once", "twice"]],
			["every day? once a week? or once a month?", "얼마나 자주 하는지 알려주세요.", ["yes", "okay", "every", "day", "week", "once", "twice"]],
		],

		[
			["Oh, I always wanted to do that. Can join with you later?", "할 수 있다고 말해주세요.", ["ok", "okay", "yes", "sure", "why not"]],
			["Sorry? Can I join?", "할 수 있다고 말해주세요.", ["ok", "okay", "yes", "sure", "why not"]],
			["Could you play with me?", "할 수 있다고 말해주세요.", ["ok", "okay", "yes", "sure", "why not"]],
		],

		[
			["Wow! When do you available to do it together?", "언제 취미활동을 함께 할수 있는지 알려주세요.", ["next", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]],
			["Sorry. What day do we together?", "언제 취미활동을 함께 할수 있는지 알려주세요.", ["next", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]],
			["Next monday? or friday?", "언제 취미활동을 함께 할수 있는지 알려주세요.", ["next", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]],

			["Do you available on next monday?", "언제 취미활동을 함께 할수 있는지 알려주세요.", ["ok", "okay", "yes", "sure", "why not"]],
		],

		["Okay. Thank you. See you then."]
	];


	// return DB3;


	// return randomPick([DB2, DB3, DB4]);

	return DB_NEW;
});