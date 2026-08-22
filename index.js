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

	return dif;
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

	// get unlocked levels for today
	if (newDelta === 0) {
		document.getElementById('bar-2').disabled = !solved[1];
		document.getElementById('bar-3').disabled = !solved[2];
	}
	else {
		document.getElementById('bar-2').disabled = false;
		document.getElementById('bar-3').disabled = false;
	}

	loadProblem(level, newDelta);
}

async function loadProblem(lvl) {

	for (e of document.getElementById('progress-bar').childNodes) {
		e.className = '';
	}

	document.getElementById('skip').disabled = false;


	document.getElementById(`bar-${lvl}`).className = 'active-sec';

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

	let min, max;

	switch (lvl) {
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

	const day = new Date();
	day.setUTCDate(day.getUTCDate() + stoDelta);

	const dateStr = day.toISOString().split('T')[0];	
	const seed = toSeed(dateStr);

	const index = Math.floor(rand(seed) * problemlist.length);
	const problem = problemlist[index];

	console.log('returned problem:', problem);

	displayHeader(problem);
	displayProblemTags(problem.tags);

	await displayProblemInfo(problem);

	
	let reward = 0;
	switch (lvl) {
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

	if (stoDelta < 0) {
		document.getElementById('skip').className = 'btn-hidden';
		document.getElementById('check').className = 'btn-hidden';
		document.getElementById('outdated-msg').className = '';
		document.getElementById('skipped-msg').className = 'btn-hidden';
		document.getElementById('solved-msg').className = 'btn-hidden';
	}
	else {
		document.getElementById('check').className = '';
		document.getElementById('outdated-msg').className = 'btn-hidden';
		
		if (lvl < 2) {
			
			if (skipped[lvl]) {
				document.getElementById('skip').className = 'btn-hidden';
				document.getElementById('check').className = 'btn-hidden';
				
				document.getElementById('skipped-msg').className = '';
				document.getElementById('solved-msg').className = 'btn-hidden';
			}
			else if (solved[lvl]) {
				document.getElementById('skip').className = 'btn-hidden';
				document.getElementById('check').className = 'btn-hidden';
				
				document.getElementById('skipped-msg').className = 'btn-hidden';
				document.getElementById('solved-msg').className = '';
			}
			else {
				document.getElementById('skip').className = '';
				document.getElementById('check').className = '';
				
				document.getElementById('skipped-msg').className = 'btn-hidden';
				document.getElementById('solved-msg').className = 'btn-hidden';
			}
		}
		else {
			document.getElementById('skip').className = 'btn-hidden';
			document.getElementById('solved-msg').className = (solved[lvl] ? '' : 'btn-hidden');
		}
	}

	document.getElementById('submit-rep').innerHTML = ``;

	localStorage.setItem('contestId', parseInt(problem.contestId));
	localStorage.setItem('index', problem.index);

	// let h = (document.getElementById('flashcard').clientHeight).toString() + 'px';

	// console.log('set height cap to ', h);
	// document.documentElement.style.setProperty('--flashcard-dyn-height', h);

	level = lvl;
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

function canAfford(f) {
	return (f <= parseInt(localStorage.getItem('tokens')));
}

let solved = [false, false, false, false];
let skipped = [false, false];

function _setCompletion(easy, medium, hard, extreme) {
	solved = [easy, medium, hard, extreme];
}

function promptSkip() {

	let f = 0;
	if (!solved[0]) { f += 50; }
	if (!solved[1]) { f += 100; }

	document.getElementById('skip-proceed').disabled = !canAfford(f);


	document.getElementById('forfeit-text').innerText = `${f} tokens`;
	document.getElementById('forfeit-amount').innerText = `-${f}`;

	document.getElementById('skip-prompt').showModal();
}

function closeSkip() {
	document.getElementById('skip-prompt').close();
}

function proceedSkip() {

	let f = 0;
	if (!solved[0]) { f += 50; }
	if (!solved[1]) { f += 100; }

	if (!canAfford(f)) {
		console.warn('price is not affordable, returned false.');
		return;
	}
	else {

		// TODO: complete substracting with strings
		let newValue = parseInt(localStorage.getItem('tokens')) - f; 
		setTokens(newValue.toString());

		loadProblem(2);
		document.getElementById('bar-2').disabled = false;
	}

	skipped[0] = !solved[0];
	skipped[1] = !solved[1];

	localStorage.setItem('skips', skipped);
	localStorage.setItem('solves', solved);

	closeSkip();
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

async function checkProblemStatus(__forceConfirm) {

	document.getElementById('check').disabled = true;

	const report = await (await fetch(`https://codeforces.com/api/user.status?handle=${localStorage.getItem('user')}&from=1&count=100`)).json();
	
	if (report.status != 'OK') {
		console.error('Report returned ', report.status);
		return;
	}

	const submissions = await report.result;

	const contestId = localStorage.getItem('contestId');
	const index = localStorage.getItem('index');

	const v = submissions.filter(p => (p.contestId === contestId && p.problem.index === index));

	if (__forceConfirm) {
		let status = 'OK:';
		let desc = 'Confirm was forced.';
		let type = 0;

		document.getElementById('submit-rep').innerHTML = `
			<img src="assets/icons/sub/submit-accepted.svg" style="height: 14px;">
			<span id="sr-status" class="success">${status}</span> <span id="sr-desc" class="success">${desc}</span>
		`;

		document.getElementById(`bar-${level + 1}`).disabled = false;

		document.getElementById('check').className = 'btn-hidden';
		document.getElementById('skip').className = 'btn-hidden';

		document.getElementById('check').disabled = false;

		loadProblem(level);
		incrementStreak();

		solved[level] = true;

		console.log('check returned ', status, ' (', desc, ')');
		return;
	}

	if (v.length < 1) {
		console.warn('Report couldn\'t find any relevant submissions.');

		document.getElementById('submit-rep').innerHTML = `
			<img src="assets/icons/sub/submit-warn.svg" style="height: 14px;">
			<span id="sr-status" class="warn">FAILED:</span> <span id="sr-desc" class="warn">Couldn't find any relevant submissions.</span>
		`;

		document.getElementById('check').disabled = false;

		return;
	}	
	else {
		let status, desc, type;

		switch (v[0].verdict) {

			case 'OK':
				status = 'OK:';
				desc = 'All tests passed.'
				type = 0;
				break;

			case 'WRONG_ANSWER':
				status = 'FAILED:';
				desc = 'Wrong answer submitted.';
				type = 1;
				break;

			case 'TIME_LIMIT_EXCEEDED':
				status = 'FAILED:';
				desc = 'Time limit exceeded.';
				type = 1;
				break;

			case 'MEMORY_LIMIT_EXCEEDED':
				status = 'FAILED:';
				desc = 'Memory limit exceeded.';
				type = 1;
				break;

			case 'RUNTIME_ERROR':
				status = 'FAILED:';
				desc = 'Runtime error.';
				type = 2;
				break;

			case 'COMPILATION_ERROR':
				status = 'FAILED:';
				desc = 'Compilation error.';
				type = 2;
				break;

			case 'TESTING':
				status = 'WAITING:';
				desc = 'Submission is currently on tests.';
				type = 3;
				break;

			case 'SUBMITTED':
				status = 'WAITING:';
				desc = 'Submission recieved.';
				type = 3;
				break;

			case 'IDLENESS_LIMIT_EXCEEDED':
				status = 'FAILED:';
				desc = 'Output took too long.';
				type = 1;
				break;

			case 'SECURITY_VIOLATED':
				status = 'FAILED:';
				desc = 'Illegal command requested.';
				type = 2;
				break;

			case 'PARTIAL':
				status = 'OK:';
				desc = 'Partial credit.';
				type = 0;
				break;

			default:
				status = 'WHAT:';
				desc = 'Something weird happened.';
				type = 4;
				break;
		}

		switch (type) {
			case 0:
				document.getElementById('submit-rep').innerHTML = `
					<img src="assets/icons/sub/submit-accepted.svg" style="height: 14px;">
					<span id="sr-status" class="success">${status}</span> <span id="sr-desc" class="success">${desc}</span>
				`;

				solved[level] = true;
				document.getElementById(`bar-${level + 1}`).disabled = false;

				document.getElementById('check').className = 'btn-hidden';
				document.getElementById('skip').className = 'btn-hidden';

				document.getElementById('check').disabled = false;

				incrementStreak();
				loadProblem(level);
				break;

			case 1:
				document.getElementById('submit-rep').innerHTML = `
					<img src="assets/icons/sub/submit-warn.svg" style="height: 14px;">
					<span id="sr-status" class="warn">${status}</span> <span id="sr-desc" class="warn">${desc}</span>
				`;

				document.getElementById('check').disabled = false;
				break;
				
				case 2:
					document.getElementById('submit-rep').innerHTML = `
					<img src="assets/icons/sub/submit-error.svg" style="height: 14px;">
					<span id="sr-status" class="danger">${status}</span> <span id="sr-desc" class="danger">${desc}</span>
				`;

				document.getElementById('check').disabled = false;
				break;

			case 3:
				document.getElementById('submit-rep').innerHTML = `
					<img src="assets/icons/sub/submit-info.svg" style="height: 14px;">
					<span id="sr-status" class="info">${status}</span> <span id="sr-desc" class="info">${desc}</span>
				`;

				document.getElementById('check').disabled = false;
				break;
		}

		console.log('check returned ', status, ' (', desc, ')');
	}
	
	localStorage.setItem('skips', skipped);
	localStorage.setItem('solves', solved);


	return await submissions.id;
}

function __setSession(streak, solved) {
	localStorage.setItem('lastSession', JSON.stringify({
		time: new Date(),
		streak: streak,
		solved: solved
	}))

	updateStreakVisuals();
}

function incrementStreak() {

	let newSession = {
		time: new Date(),
		streak: JSON.parse(localStorage.getItem('lastSession')).streak,
		solved: true
	};

	if (!(JSON.parse(localStorage.getItem('lastSession')).solved)) {
		newSession.streak++;
	}

	localStorage.setItem('lastSession', JSON.stringify(newSession));

	updateStreakVisuals();
}

function isBefore(timestamp, from) {

	const fromRef = new Date();
	fromRef.setUTCDate(fromRef.getUTCDate() + from);

	timestamp.setUTCHours(0, 0, 0, 0);

	return (timestamp < from);
}

function reviseStreak() {

	let lastSession = JSON.parse(localStorage.getItem('lastSession'));
	console.log('last session:', lastSession);

	let newSession = {
		time: new Date(),
		streak: null,
		solved: null
	}

	if (lastSession === null || isBefore(new Date(lastSession.time), -1) || (!lastSession.solved && isBefore(new Date(lastSession.time), 0))) {
		newSession.streak = 0;
		newSession.solved = false;
	}
	else {
		newSession.streak = lastSession.streak;
		newSession.solved = lastSession.solved;
	}

	localStorage.setItem('lastSession', JSON.stringify(newSession));
	updateStreakVisuals();
}

function updateStreakVisuals() {

	const icon = document.getElementById('streak-icon');
	const count = document.getElementById('streak-count');

	let thisSession = JSON.parse(localStorage.getItem('lastSession'));
	console.log('session: ', thisSession);

	count.innerText = thisSession.streak;

	if (thisSession.solved) {
		count.className = 'text-streak-on';
		icon.src = 'assets/icons/streak/streak_on.svg';
	}
	else {
		count.className = 'text-streak-off';
		let timeLeft = getTimer();

		if (timeLeft < 3600) {
			icon.src = 'assets/icons/streak/streak_warn.svg';
		}
		else {
			icon.src = 'assets/icons/streak/streak_off.svg';
		}	
	}
}

reloadCodeforces(true);
getTokens();

reviseStreak();
loadProblem(level, 0);