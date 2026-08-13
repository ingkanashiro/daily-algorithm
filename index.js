function getTodaySeed() {
	const d = new Date();
	const year = d.getUTCFullYear();
	const month = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return parseInt(`${year}${month}${day}`, 10);
}

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



function updateTokens(short = true) {
	document.getElementById('token-count').innerText = parseTokenCount(localStorage.getItem('tokens'), short);
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
		'lol',
		'touch grass',
		'overkill',
		'natsukerayo',
		'why?',
		'you found me! go touch some grass man you surely cant have grinded so much'
	];

	let s = formatNumber(val); // '12,345,678,912,345,678'
	let v = s.split(',').length - 1;

	console.log("s:", s);
	console.log("v:", v);

	if (short && val.length > 5) {
					
		if (v < 12) {
			str = s.split(',')[0] + '.' + ((parseInt(s.split(',')[1][1]) < 5) ? s.split(',')[1][0] : (parseInt(s.split(',')[1][0]) + 1)) + ' ' + suffix[v];
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
			str = msg[Math.min(r, msg.length - 1)] // xd
		}
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
			
			break;
			
		
		case 1: // OK
			document.getElementById('account').onclick = () => {openAccountModal(0)};

			document.getElementById('account').innerHTML = `
				<img src="assets/icons/cloud_done.svg" style="height: 18px">
				<span id="acc-user" style="font-style: italic; color: var(--mocha-green);">${localStorage.getItem('user')}</span>
				<span id="acc-status" style="font-weight: 700; color: var(--mocha-green);">● Online</span>
			`;

			break;
		
		case 2: // syncing
			document.getElementById('account').onclick = () => {};

			document.getElementById('account').innerHTML = `
				<img src="assets/icons/cloud_sync.svg" style="height: 18px">
				<span id="acc-user" style="font-style: italic; color: var(--mocha-peach);">${localStorage.getItem('user')}</span>
				<span id="acc-status" style="font-weight: 700; color: var(--mocha-peach);">● Connecting</span>
			`;

			break;
		
		case 3: // error
			document.getElementById('account').onclick = () => {openAccountModal(lastErrCode)};

			document.getElementById('account').innerHTML = `
				<img src="assets/icons/cloud_alert.svg" style="height: 18px">
				<span id="acc-user" style="font-style: italic; color: var(--mocha-red);">${localStorage.getItem('user')}</span>
				<span id="acc-status" style="font-weight: 700; color: var(--mocha-red);">● Offline</span>
			`;

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






document.addEventListener('DOMContentLoaded', onLoad);

function onLoad() {
	document.getElementById('tokens').onmouseover = (e) => {
		updateTokens(false);
	}
	document.getElementById('tokens').onmouseleave = (e) => {
		updateTokens(true);
	}
}