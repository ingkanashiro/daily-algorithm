function rand(seed) {
	let state = (seed * 1664525 + 1013904223) % 4294967296;
	return state / 4294967296;
}

function toSeed(date) {
	const [year, month, day] = date.split('-').map(Number);
	return year * 10000 + month * 100 + day;
}

let day = new Date();
let stoDelta = 0;
let level = 0;

console.log('registered today as', stringify(day))

function getDelta() {
	return delta;
}

function getTimer() {
	const now = Date.now() % 86400000;
	const dif = 86400000 - now;

	const hrs = Math.floor((dif / (1000 * 60 * 60)) % 24);
	const mins = Math.floor((dif / (1000 * 60)) % 60);
	const secs = Math.floor((dif / 1000) % 60);

	const fhh = String(hrs);
	const fmm = String(mins).padStart(2, '0');
	const fss = String(secs).padStart(2, '0');

	if (hrs != 0) {
		document.getElementById('timer').innerHTML = `resets in ${fhh}:${fmm}:${fss}`;
	}
	else {
		document.getElementById('timer').innerHTML = `resets in ${fmm}:${fss}`;
	}
}

getTimer();
setInterval(getTimer, 1000);

function stringify(date) {
	let s = date.toUTCString().split(' '); // Wed, | 18 | Aug | 2026 | 20:16:00 | GMT
	return (s[0] + ' ' + s[1] + ' ' + s[2]); 
}


function moveToDay(delta) {

	const l = document.getElementById('day-selector-left');
	const r = document.getElementById('day-selector-right');

	if (delta < 0) {
		r.disabled = false;
	}
	else if (delta > 0) {
		l.disabled = false;
	}

	const today = new Date(); const current = new Date(); 
	
	current.setUTCDate(day.getUTCDate() + delta);
	console.log('moved day pointer to ', stringify(current));
	
	let newDelta = current.getUTCDate() - today.getUTCDate();
	
	if (newDelta > 0) {
		newDelta = 0;
	}
	else if (newDelta < -6) {
		newDelta = -6;
	}

	// update labels and buttons
	if (newDelta === 0) {
		r.disabled = true;
	}
	else if (newDelta === -6) {
		l.disabled = true;
	} 

	const label = document.getElementById('day-selector-label');
	if (newDelta === 0) {
		label.innerText = 'Today';
	}
	else if (newDelta === -1) {
		label.innerText = 'Yesterday';
	}
	else {
		label.innerText = stringify(current);
	}

	day.setUTCDate(current.getUTCDate());
	stoDelta = newDelta;

	loadProblem(level, newDelta);
}

async function loadProblem(level) {

	for (e of document.getElementById('progress-bar').childNodes) {
		e.className = '';
	}

	document.getElementById(`bar-${level}`).className = 'active-sec';

	// set-up loading screen...
	document.getElementById('flashcard').className = 'loading';

	const response = await fetch('https://codeforces.com/api/problemset.problems');
	if (!response.ok) {
		console.error('Coudn\'t fetch problems. Error 404 not found.');
		return;
	}

	const data = await response.json();

	if (data.status != 'OK') {
		console.error('Couldn\'t fetch problems. Codeforces returned ', data.status);
		return;
	}

	const problemset = data.result.problems;

	console.log('Problemset fetched:', problemset);
	let min, max;

	switch (level) {
		case 0:
			min = 800;
			max = 1100;
			break;
		
		case 1:
			min = 1200;
			max = 1700;
			break;
		
		case 2:
			min = 1800; // 500
			max = 2900; // 750
			break;
		
		case 3:
			min = 3000;
			max = 4000;
			break;
	}

	const problemlist = problemset.filter(p => p.rating >= min && p.rating <= max && !p.tags.includes('*special'));
	console.log(problemlist);

	const day = new Date();
	day.setUTCDate(day.getUTCDate() + stoDelta);

	const dateStr = day.toISOString().split('T')[0];	
	const seed = toSeed(dateStr);

	console.log('seed:', seed);


	const index = Math.floor(rand(seed) * problemlist.length);
	console.log('proc:', rand(seed), index);
	const problem = problemlist[index];

	console.log('returned problem:', problem);

	displayHeader(problem);
	displayProblemTags(problem.tags);

	await displayProblemInfo(problem);

	let reward = 0;
	switch (level) {
		case 0:
			reward = 50;
			break;

		case 1:
			reward = 100;
			break;

		case 2:
			reward = 50 * Math.floor(((problem.rating * 5 / 12) - 250) / 50);
			break;
			
		case 3:
			reward = 1500 + (50 * Math.floor((problem.rating - 3000)/50));
			break;
	}

	document.getElementById('tokens-awarded').innerText = '+' + reward.toString();

	
	MathJax.typeset();
	document.getElementById('flashcard').className = '';

	document.documentElement.style.setProperty('--input-max-h', document.getElementById('problem-input').scrollHeight.toString() + 'px');
	document.documentElement.style.setProperty('--output-max-h', document.getElementById('problem-output').scrollHeight.toString() + 'px');

	// let h = (document.getElementById('flashcard').clientHeight).toString() + 'px';

	// console.log('set height cap to ', h);
	// document.documentElement.style.setProperty('--flashcard-dyn-height', h);
}

let samples;

async function displayHeader(p) {

	let title = p.index + '. ' + p.name;
	let rating = p.rating;

	document.getElementById('problem-name').innerText = title;
	document.getElementById('problem-rating').innerText = rating;
}

async function displayProblemInfo(p) {

	const code = p.contestId + '/' + p.index;
	const url = `https://codeforces.ingkanashiro.workers.dev/${p.contestId}/${p.index}`;
	let data;
	
	console.log('fetching data from ', url);
	try {

		const response = await fetch(url);
		if (!response.ok) {
			console.error('Couldn\'t scrape Codeforces problem. Provider failed to provide, returned ', response.status);
			document.getElementById('problem').innerHTML = `
				<span style="color: var(--mocha-text); font-style: italic;">Couldn't load problem properly. Please try again.</span>
			`
			return;
		}

		data = await response.json();

	} catch (err) {
		console.error('Couldn\'t scrape Codeforces problem. Error code:', err);
		document.getElementById('problem').innerHTML = `
			<span style="color: var(--mocha-text); font-style: italic;">An error ocurred (${err}).</span>
		`
		return;
	}

	console.log('fetched problem ', code, ':', data);

	// description
	document.getElementById('problem').innerHTML = await data.statementHtml;

	// input / output
	document.getElementById('problem-input').innerHTML = await data.inputSpecification;
	document.getElementById('problem-output').innerHTML = await data.outputSpecification;
	document.getElementById('gotoproblem').href = await data.url;

	// samples
	samples = await data.samples;
	loadProblemSampleOptions();

	// limitations
	let timeLimit = data.timeLimit.split(' ')[0];
	let memLimit = data.memoryLimit.split(' ')[0];

	document.getElementById('time-limit').innerText = timeLimit + ' s';
	document.getElementById('mem-limit').innerText = memLimit + ' MB';
}

async function displayProblemTags(tags) {

	const e = document.getElementById('tags');
	e.innerHTML = ``;

	for (let i = 0; i < tags.length; i++) {

		console.log(tags[i]);

		let color = 'overlay-1';
		let type = 'tag';
		let name = tags[i];

		switch (tags[i]) {

			case 'implementation':
				color = 'lavander';
				type = 'implementation';
				break;

			case 'brute force':
				color = 'maroon';
				type = 'brute-force';
				break;

			case 'greedy':
				color = 'yellow';
				type = 'greedy';
				break;

			case 'constructive algorithms':
				color = 'lavander';
				type = 'constructive';
				break;

			case 'interactive':
				color = 'lavander';
				type = 'interactive';
				break;

			case 'binary search':
				color = 'sky';
				type = 'search';
				break;

			case 'trinary search':
				color = 'sky';
				type = 'search';
				break;

			case 'two pointers':
				color = 'red';
				type = 'pointers';
				break;

			case 'divide and conquer':
				color = 'peach';
				type = 'divide-and-conquer';
				break;

			case 'meet in the middle':
				color = 'peach';
				type = 'meet-in-the-middle';
				break;

			case 'data structures':
				color = 'yellow';
				type = 'data-structures';
				break;

			case 'dp':
				color = 'blue';
				type = 'dp';
				break;

			case 'dsu':
				color = 'blue';
				type = 'dsu';
				break;

			case 'bitmasks':
				color = 'pink';
				type = 'bitmasks';
				break;

			case 'math':
				color = 'red';
				type = 'math';
				break;

			case 'number theory':
				color = 'teal';
				type = 'number-theory';
				break;

			case 'combinatorics':
				color = 'maroon',
				type = 'combinatorics';
				break;

			case 'chinese remainder theorem':
				color = 'red';
				type = 'chinese-remainder-theorem';
				break;

			case 'matrices':
				color = 'yellow';
				type = 'matrices';
				break;

			case 'fft':
				color = 'blue';
				type = 'fft';
				break;

			case 'graphs':
				color = 'blue';
				type = 'graphs';
				break;

			case 'trees':
				color = 'teal';
				type = 'trees';
				break;

			case 'dfs and similar':
				color = 'lavander';
				type = 'dfs'
				break;

			case 'shortest paths':
				color = 'peach';
				type = 'shortest-path';
				break;

			case 'flows':
				color = 'pink';
				type = 'flows';
				break;

			case 'graph matchings':
				color = 'pink';
				type = 'graph-matchings';
				break;

			case '2-sat':
				color = 'green';
				type = '2-sat';
				break;

			case 'strings':
				color = 'green';
				type = 'strings';
				break;

			case 'hashing':
				color = 'yellow';
				type = 'hashing';
				break;

			case 'string suffix structures':
				color = 'peach';
				type = 'string-suffix-structs';
				break;

			case 'sortings':
				color = 'blue';
				type = 'sorting';
				break;

			case 'geometry':
				color = 'green';
				type = 'geometry';
				break;

			case 'games':
				color = 'red';
				type = 'games';
				break;

			case 'schedules':
				color = 'sapphire';
				type = 'schedules';
				break;

			case 'expression parsing':
				color = 'lavander';
				type = 'parsing';
				break;

			default:
				break;
		}
		
		let tag = `
			<div style="--accent: var(--mocha-${color});">
				<img src="assets/icons/tags/${type}.svg" style="height: 14px;">
				<span>${name}</span>
			</div>
		`;	
		
		e.innerHTML += tag;
	}
}

function loadProblemSampleOptions() {
	const e = document.getElementById('sample-list');
	e.innerHTML = ``;

	for (let l = 0; l < samples.length; l++) {
		e.innerHTML += `
			<label class="sample-opt">
				<input type="radio" name="sample" value="${l+1}" onchange="loadSample(this.value)" ${(l === 0) ? 'checked' : ''}>
				<span>${l+1}</span>
			</label>
		`;
	}
}

function openSamples() {
	loadSample(1);
	document.getElementById('samples').showModal();
}

function closeSamples() {
	document.getElementById('samples').close();
}

function loadSample(i) {
	console.log(samples[i-1]);
	
	let input = samples[i-1].input;
	let output = samples[i-1].output;



	let inputList = input.split('\n');
	let outputList = output.split('\n');

	document.getElementById('sample-input-codeblock').innerHTML = ``;
	for (let ii = 0; ii < inputList.length; ii++) {
		document.getElementById('sample-input-codeblock').innerHTML += `
		<span class="num-line">${ii+1}</span>
		<span class="io-line">${inputList[ii]}</span>
		`;
	}
	
	document.getElementById('sample-output-codeblock').innerHTML = ``;
	for (let ii = 0; ii < outputList.length; ii++) {
		document.getElementById('sample-output-codeblock').innerHTML += `
			<span class="num-line">${ii+1}</span>
			<span class="io-line">${outputList[ii]}</span>
		`;
	}
}



// Account Badge functionality

function openAccountModal(e) {

	let user = localStorage.getItem('user');

	if (user === null) {
		document.getElementById('user-input').value = '';
	}
	else {
		document.getElementById('user-input').value = user;
	}

	let msg;
	switch (e) {
		case 0:
			msg = 'You shouldn\'t be able to see this...';
			break;

		case 1:
			msg = 'Account not found';
			break;

		case 2:
			msg = 'Invalid username';
			break;

		case 3:
			msg = 'Couldn\'t connect to the account';
			break;

		default:
			msg = 'What.';
			break;
	}

	if (e === 0) {
		document.getElementById('account-bottom-bar').innerHTML = `
			<button class="sync-btn" onclick="reloadCodeforces(false)">
				<img src="assets/icons/sync.svg">
				<span>Sync</span>
			</button>
		`
	}
	else if (e < 3) {
		document.getElementById('account-bottom-bar').innerHTML = `
			<div style="display: inline-flex; align-items: center; gap: 4px; width: 100%;">
				<img src="assets/icons/error.svg" style="height: 16px;">
				<span class="error-span">${msg}</span>
			</div>
			<button class="retry-btn" onclick="reloadCodeforces(false)">
				<img src="assets/icons/sync.svg">
				<span>Retry</span>
			</button>
		`;

	}
	else {
		document.getElementById('account-bottom-bar').innerHTML = `
			<div style="display: inline-flex; align-items: center; gap: 4px; width: 100%;">
				<img src="assets/icons/warning.svg" style="height: 16px;">
				<span class="warning-span">${msg}</span>
			</div>
				<button class="sync-btn" onclick="reloadCodeforces(false)">
				<img src="assets/icons/sync.svg">
				<span>Sync</span>
			</button>
		`;
	}
	
	document.getElementById('account-modal').showModal();
	document.getElementById('user-input').focus();
}

function closeAccountModal() {
	document.getElementById('account-modal').close();
}

// Tokens 

function getTokens() {
	let tokens = localStorage.getItem('tokens');

	if (tokens === null) {
		tokens = '0';

		console.warn('tokens were null, set to 0');
	}
	else {
		console.log('tokens:', tokens);
	}

	localStorage.setItem('tokens', tokens);
	updateTokens();
}

function updateTokens() {
	document.getElementById('token-short').innerText = parseTokenCount(localStorage.getItem('tokens'), true);
	document.getElementById('token-long').innerText = parseTokenCount(localStorage.getItem('tokens'), false);
}

function formatNumber(val) {
	let s = val.split(''); 
	let strf = "";

	let c = 0;
	for (let i = val.length-1; i >= 0; i--) {
		strf = ((c % 3 === 2 && i != 0) ? ',' : '') + s[i] + strf;
		c++;
	}
	return strf;
}

function parseTokenCount(val, short) {

	let str = "";

	const suffix = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
	const msg = [
		'touch grass',
		'fancy a job?',
		'the big leagues are calling',
		'you found me! go touch some grass man, you surely can\'t have grinded so much'
	];

	let s = formatNumber(val); // '12,345,678,912,345,678'
	let v = s.split(',').length - 1;

	console.log("s:", s);
	console.log("v:", v);

	if (short && val.length > 5) {
					
		if (v < 12) {
			str = s.split(',')[0] + '.' + ((parseInt(s.split(',')[1][1]) < 5) ? s.split(',')[1][0] : (Math.min(parseInt(s.split(',')[1][0]) + 1, 9))) 
					+ ' ' + suffix[v];
		}
		else {
			str = '+999.9 Dc';
		}
	}
	else {
		if (v < 12) {
			str = s;
		}
		else {
			let r = Math.floor(Math.random() * (msg.length));
			// if (r === msg.length) { r--; }
			// str = msg[r];
			str = msg[Math.min(r, msg.length - 1)] + ' • ' + s; // xd
		}
	}

	if (short) {
		const adjust = 0.5;
		let w = (str.length * adjust) + 1.125;

		document.documentElement.style.setProperty('--token-initial-width', w.toString() + 'rem');

		console.log('set max-width to ', w);
	}

	return str;
}

function setTokens(val) {
	localStorage.setItem('tokens', val);
	updateTokens();
}

let lastErrCode = 0;

function setAccountStatus(status) {

	switch (status) {
		case 0: // disconnected

			document.getElementById('account').onclick = () => {openAccountModal(0)};
			
			document.getElementById('account').innerHTML = `
			<img src="assets/icons/cloud_off.svg" style="height: 18px">
			<span id="acc-user">(No account)</span>
			<span id="acc-status">● Offline</span>
			`;
			
			document.documentElement.style.setProperty('--account-badge-accent', '#7f849c');
			document.documentElement.style.setProperty('--account-badge-accent-blur', '#7f849c22');

			break;
			
		
		case 1: // OK
			document.getElementById('account').onclick = () => {openAccountModal(0)};

			document.getElementById('account').innerHTML = `
				<img src="assets/icons/cloud_done.svg" style="height: 18px">
				<span id="acc-user" style="font-style: italic; color: var(--mocha-green);">${localStorage.getItem('user')}</span>
				<span id="acc-status" style="font-weight: 700; color: var(--mocha-green);">● Online</span>
			`;

			document.documentElement.style.setProperty('--account-badge-accent', '#a6e3a1');
			document.documentElement.style.setProperty('--account-badge-accent-blur', '#a6e3a122');

			break;
		
		case 2: // syncing
			document.getElementById('account').onclick = () => {};

			document.getElementById('account').innerHTML = `
				<img src="assets/icons/cloud_sync.svg" style="height: 18px">
				<span id="acc-user" style="font-style: italic; color: var(--mocha-peach);">${localStorage.getItem('user')}</span>
				<span id="acc-status" style="font-weight: 700; color: var(--mocha-peach);">● Connecting</span>
			`;

			document.documentElement.style.setProperty('--account-badge-accent', '#fab387');
			document.documentElement.style.setProperty('--account-badge-accent-blur', '#fab38722');

			break;
		
		case 3: // error
			document.getElementById('account').onclick = () => {openAccountModal(lastErrCode)};

			document.getElementById('account').innerHTML = `
				<img src="assets/icons/cloud_alert.svg" style="height: 18px">
				<span id="acc-user" style="font-style: italic; color: var(--mocha-red);">${localStorage.getItem('user')}</span>
				<span id="acc-status" style="font-weight: 700; color: var(--mocha-red);">● Offline</span>
			`;

			document.documentElement.style.setProperty('--account-badge-accent', '#f38ba8');
			document.documentElement.style.setProperty('--account-badge-accent-blur', '#f38ba822');

			break;
	}

}

async function reloadCodeforces(force) {

	let u;
	if (force) {
		u = localStorage.getItem('user') || '';
	}
	else {
		// get user input.
		u = document.getElementById('user-input').value;
	
		if (u === '') {
			setAccountStatus(0);
			return;
		}
	}


	// validate
	let allowedChar = [
		'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
		'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
		'W', 'X', 'Y', 'Z', 
		'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
		'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
		'w', 'x', 'y', 'z',
		'_', '-', '.',
		'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
	];

	for (char of u) {

		if (!allowedChar.includes(char)) {
			lastErrCode = 2;

			setAccountStatus(3);
			openAccountModal(2); // invalid username

			return;
		}

	}

	localStorage.setItem('user', u); // user is valid
	setAccountStatus(2);
	closeAccountModal();

	const response = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(u)}`);
	const data = await response.json();

	if (data.status === 'OK') {
		setAccountStatus(1);
		closeAccountModal();	// user exists, sync done!
	}
	else {
		lastErrCode = 1;

		openAccountModal(1);	// user not found.
		setAccountStatus(3);
	}

}

reloadCodeforces(true);
getTokens();
loadProblem(level, 0);